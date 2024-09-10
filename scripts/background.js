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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "notFinalsite") {
    updateIconState({ disable: true, sender });
    sendResponse({ status: "Icon disabled" });
  }
  if (request.type === "isFinalsite") {
    updateIconState({ disable: false, sender });
    sendResponse({ status: "Icon enabled" });
  }
  if (request.type === "setBadgeText") {
    chrome.action.setBadgeText({ text: request.text });
    chrome.action.setBadgeBackgroundColor({ color: "#da374b" });
    sendResponse({ status: "Badge text set" });
  }
  if (request.type === "removeBadgeText") {
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ status: "Badge text removed" });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    const url = tab.url;
    if (url && !url.startsWith("chrome://")) {
      chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        func: () => {
          chrome.storage.local.get("grapefruitSettings", (results) => {
            const id = document.body.getAttribute("data-pageid");
            if (results.grapefruitSettings.displayIdBadge.value && id) {
              chrome.runtime.sendMessage({
                type: "setBadgeText",
                text: id || "N/A",
              });
            } else {
              chrome.runtime.sendMessage({ type: "removeBadgeText" });
            }
          });
        },
      });
    }
  });
});
