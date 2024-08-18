const getPageId = () => {
  return document.body.getAttribute("data-pageid");
};

const isFinalsite = () => {
  return !!getPageId();
};

const storeId = (id) => {
  const newPageId = { id: id, siteURL: document.title, pinned: false };

  chrome.storage.local.get("grapefruit", (results) => {
    const currentIds = results.grapefruit || [];
    const filterPinned = currentIds.filter((cId) => cId.pinned);
    const filterUnpinned = currentIds.filter((cId) => !cId.pinned);

    if (
      filterPinned.length + filterUnpinned.length >= 10 &&
      !filterPinned[filterPinned.length - 1].pinned
    ) {
      currentIds.pop();
    }
    if (!filterPinned.find((cId) => cId.id === id)) {
      filterUnpinned.unshift(newPageId);
    }

    chrome.storage.local.set({
      grapefruit: [...filterPinned, ...filterUnpinned],
    });
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.query === "getPageId") {
    const id = getPageId();
    storeId(id);
    sendResponse(id);
  } else if (request.query === "isFinalsite") {
    sendResponse({ pageChecksOut: isFinalsite() });
  } else if (request.query === "getHistory") {
    chrome.storage.local.get("grapefruit", (results) => {
      sendResponse(results.grapefruit);
    });
  }
});

(async () => {
  if (isFinalsite()) {
    chrome.runtime.sendMessage({ disableIcon: false });
  } else {
    chrome.runtime.sendMessage({ disableIcon: true });
  }
})();
