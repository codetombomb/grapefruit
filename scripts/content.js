const getPageId = () => {
  return document.body.getAttribute("data-pageid");
};

const isFinalsite = () => {
  return !!getPageId();
};

const storeId = (id) => {
  const newPageId = { id: id, siteURL: window.location.href };
  chrome.storage.local.get("grapefruit", (results) => {
    const currentIds = results.grapefruit || [];

    if (currentIds.length >= 10) {
      currentIds.pop();
    }
    currentIds.unshift(newPageId);

    chrome.storage.local.set({ grapefruit: currentIds });
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
