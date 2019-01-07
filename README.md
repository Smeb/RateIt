# RateIt!

Web-extension / hobby project to provide ratings for books, movies, and games

# Use case
Some sites (in particular Netflix, HumbleBundle) sell or offer digital media.
The products offered on these sites often don't include useful ratings. Large
databases of rating information such as the international movie database (imdb),
Rotten Tomatoes, and GoodReads offer aggregated crowd sourced ratings which
typically provide a good estimate for the quality of an offering. These services
typically offer RESTful web APIs to retrieve ratings, or a means of obtaining
ratings. To solve the lack of good ratings for some services, RateIt sources
rating information from these APIs, and adds the rating metadata to products
without ratings, using a browser extension.

# Books
## Implementation plan
The only book source currently considered is HumbleBundle, which offers bundles
of books. I want the following features

- Rating clickthrough - click to navigate to a rating page for a given book
- Rating display - show the rating of a book near the book listing

To get the book ratings we can use GoodReads which provides an API.
- GoodReads API uses a developer key, and is rate limited to 1 request a second
- Requests can be batched by ISBN, so one request can source ratings for many
  books

To get the book rating from GoodReads we need to translate the book name to its
ISBN. Google Books is capable of performing this translation.
- To query, Books doesn't require an API key, but will typically provide lots of
  matches per query. Therefore each match result needs to be checked to find the
  book.
- Only one book can be queried at once

The total requests for a bundle B with n books is n GoogleBooks requests and 1
GoodReads request

## Status
MVP for books querying API completed with some caveats:
- no tests
- no alternative approach for when Google returns faulty book ISBNs
- dummy data is still in the books_api file

# TODO
- Film api, get film ratings
  - Implementation plan
  - MVP draft
  - Tests

- Game api, get game ratings
  - Implementation plan
  - MVP draft
  - Tests
