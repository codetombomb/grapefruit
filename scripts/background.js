chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.isFinalsite) {
    chrome.action.enable();
    sendResponse({ confirmation: "This is finalsite!" });
  } else {
    chrome.action.disable();
    sendResponse({ error: "This is not finalsite" });
  }
});
