chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.disableIcon) {
    chrome.action.disable(sender.tab.id);
    chrome.action.setIcon({
      path: "../icons/disable-grapefruit-logo-32.png",
      tabId: sender.tab.id,
    });
    sendResponse({ message: "Icon disabled" });
  } else {
    chrome.action.enable(sender.tab.id);
    chrome.action.setIcon({
      path: "../icons/grapefruit-logo-32.png",
      tabId: sender.tab.id,
    });
    sendResponse({ error: "Icon enabled" });
  }
});
