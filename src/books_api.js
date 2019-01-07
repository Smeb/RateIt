function env(key) {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Key '${key}' is not present in the environment`);
  }
  return value;
}

function logAll(object) {
  console.log(JSON.stringify(object, { showHidden: false, depth: null }));
}

function sortResultsBySuccess(results) {
  const errors = {};
  const successes = {};

  Object.keys(results).forEach((isbn) => {
    const result = results[isbn];
    if (result.rating.averageRating) {
      successes[result.lookupTitle] = result;
    } else {
      errors[result.lookupTitle] = result;
    }
  });

  return [successes, errors];
}

function processGoogleBooksResult(lookupTitle, result) {
  console.log(JSON.stringify(result, null, 4))
  const { volumeInfo } = result;
  const {
    authors,
    averageRating,
    ratingsCount,
    title,
  } = volumeInfo;
  const {
    identifier,
    type,
  } = getIdentifier(volumeInfo.industryIdentifiers);
  return {
    authors,
    title,
    lookupTitle,
    rating: {
      averageRating,
      ratingsCount,
      source: 'google',
    },
    identifier,
    identifierType: type,
  };
}

function getIdentifier(identifiers) {
  return identifiers.reduce((acc, current) => {
    if (acc === undefined) return current;

    // always prefer ISBN_13s to ISBN_10s, and ISBNs to all other types
    if (current.type === 'ISBN_13') return current;
    if (acc.type !== 'ISBN_13' && current.type === 'ISBN_10') return current;
    return acc;
  });
}

function findBestMatch(book, matches) {
  return matches.items.filter(item => item.volumeInfo.language === 'en')[0];
}

function fetchGoogleBookResults(sanitizedName) {
  const key = env('googlebooks_key');
  return fetch(`https://www.googleapis.com/books/v1/volumes?q=${sanitizedName}&key=${key}`)
    .then(response => response.json());
}

function getGoogleBookResults(bookName) {
  // We mainly want to avoid '#' symbols, which prematurely terminate a search
  const sanitizedName = bookName.replace(/\W+/g, ' ').replace(/\s+/g, ' ');
  return retrieve(sanitizedName, fetchGoogleBookResults);
}

function hashByIdentifier(results) {
  const hash = {};
  results.forEach((result) => { hash[result.identifier] = result; });
  return hash;
}

function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  return url;
}

function calculateTotalGoodreadsRatings(goodreadsBook) {
  const {
    ratings_count,
    reviews_count,
    text_reviews_count,
    work_ratings_count,
    work_reviews_count,
    work_text_reviews_count,
  } = goodreadsBook;

  return ratings_count + reviews_count + text_reviews_count
        + work_ratings_count + work_reviews_count + work_text_reviews_count;
}

function updateEntries(bookEntries, goodreadsBook) {
  let identifier;
  if (goodreadsBook.isbn13 in bookEntries) {
    identifier = goodreadsBook.isbn13;
  } else if (goodreadsBook.isbn in bookEntries) {
    identifier = goodreadsBook.isbn10;
  } else {
    // Shouldn't be possible, since isbns
    console.warn(`goodreads result ${goodreadsBook} didn't reference a known book`);
    return;
  }

  const { ratingsCount } = bookEntries[identifier].rating;
  const totalGoodreadsRatings = calculateTotalGoodreadsRatings(goodreadsBook);
  if (ratingsCount === undefined || ratingsCount < totalGoodreadsRatings) {
    bookEntries[identifier].rating = {
      averageRating: goodreadsBook.average_rating,
      ratingsCount: totalGoodreadsRatings,
      source: 'goodreads',
    };
  }
}

const goodreadsFetch = (() => {
  let lastCall = Date.now() - 1000;
  return url => new Promise((resolve, reject) => {
    lastCall = lastCall + 1000 > Date.now() ? lastCall + 1000 : Date.now();
    setTimeout(() => {
      console.log(Date.now());
      resolve(fetch(url));
    }, lastCall - Date.now());
  });
})();

function fetchGoodReadsBookInfo(isbns) {
  const key = env('goodreads_key');
  return fetch(buildUrl('https://www.goodreads.com/book/review_counts.json', { isbns, key }))
    .then(response => response.json())
}

function getGoodReadsBookInfo(bookEntries) {
  const isbns = Object.keys(bookEntries);

  return fetchGoodReadsBookInfo(isbns)
    .then((json) => {
      json.books.forEach(book => updateEntries(bookEntries, book));
      return bookEntries;
    });
}

function getGoogleBookInfo(book) {
  return getGoogleBookResults(book)
    .then(results => findBestMatch(book, results))
    .then(result => processGoogleBooksResult(book, result))
    .catch((error) => {
      logAll(`error: ${book}`);
      logAll(error);
      return undefined;
    });
}

function cacheResults(results) {
  const searchKeys = Object.keys(results);
  for (key in searchKeys) {
    store(key, results[key]);
  }
}

function lookupBookRatings(books) {
  return Promise.all(books.map(getGoogleBookInfo))
    .then(foundBooks => foundBooks.filter(book => book !== undefined))
    .then(hashByIdentifier)
    .then(getGoodReadsBookInfo)
    .then(sortResultsBySuccess)
    .then(cacheResults)
    .catch(error => console.warn(error));
}
