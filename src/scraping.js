function getItems() {
  const items = {};
  const lookups = [];

  Array.from(document.getElementsByClassName('dd-captions'))
    .forEach((item) => {
      const itemName = item.children[0].lastChild.textContent.trim();
      items[itemName] = { domNode: item };
      lookups.append(itemName);
    });

  return items;
}

