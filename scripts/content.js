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

    if (currentIds.length < 10 && currentIds[0] !== newPageId) {
      currentIds.push(newPageId);
    }

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

// (async () => {
//   const site = isFinalsite();
//   const response = await chrome.runtime.sendMessage({
//     isFinalsite: site,
//   });
// })();
