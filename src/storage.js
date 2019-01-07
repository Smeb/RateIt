function retrieve(key, retrievalFn) {
  const item = window.localStorage.getItem(key);
  if (item === undefined) {
    item = retrievalFn(key);
    window.localStorage.setItem(key, item);
    store(key, item);
  }
  return item;
}

