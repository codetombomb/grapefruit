const getPageId = () => {
  return document.body.getAttribute("data-pageid");
};

const isFinalsite = () => {
  return !!getPageId();
};

(async () => {
  if (isFinalsite()) {
    chrome.runtime.sendMessage({ disableIcon: false }, (response) => {
      console.log(response);
    });
  } else {
    chrome.runtime.sendMessage({ disableIcon: true }, (response) => {
      console.log(response);
    });
  }
})();

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
  }
});
