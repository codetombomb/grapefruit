const getPageId = () => {
  return document.body.getAttribute("data-pageid");
};

const isFinalsite = () => {
  return !!getPageId();
};

(async () => {
  const site = isFinalsite();
  const response = await chrome.runtime.sendMessage({
    isFinalsite: site,
  });
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.query === "getPageId") {
    sendResponse(getPageId());
  }
});
