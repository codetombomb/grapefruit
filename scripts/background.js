const updateIconState = ({ disable, sender }) => {
  if (disable) {
    chrome.action.setIcon({
      path: "../icons/disable-grapefruit-logo-32.png",
      tabId: sender.tab.id,
    });
  } else {
    chrome.action.setIcon({
      path: "../icons/grapefruit-logo-32.png",
      tabId: sender.tab.id,
    });
  }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.disableIcon) {
    updateIconState({ disable: true, sender });
    sendResponse({ message: "Icon disabled" });
  } else {
    updateIconState({ disable: false, sender });
    sendResponse({ message: "Icon enabled" });
  }
});
