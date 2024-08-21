const getPageId = () => {
  return document.body.getAttribute("data-pageid");
};

const createIdDisplay = (pageId) => {
  chrome.storage.local.get("grapefruitSettings", (results) => {
    if (results.grapefruitSettings) {
      if (results.grapefruitSettings.displayIdOnContentPage.value) {
        const container = document.createElement("div");
        container.id = "id-container";
        const id = document.createElement("p");
        container.classList.add("page-id-container");
        id.classList.add("page-id");
        id.textContent = pageId;
        container.appendChild(id);
        document.body.appendChild(container);
      } else {
        document.getElementById("id-container").remove();
      }
    }
  });
};

const isFinalsite = () => {
  return !!getPageId();
};

const storeId = (id) => {
  chrome.storage.local.get("grapefruit", (results) => {
    let currentIds = results.grapefruit || [];
    const found = currentIds.find((data) => data.id === id);
    console.log("we gonna store?", !found);
    if (!found) {
      const newPageId = {
        id: id,
        siteURL: window.location.href,
        siteTitle: document.title,
        pinned: false,
      };
      currentIds.push(newPageId);
    }
    currentIds = currentIds.sort((a, b) => b.pinned - a.pinned);
    if (currentIds.length > 15) {
      currentIds = currentIds.slice(-15);
    }
    console.log("we storing: ", currentIds);
    chrome.storage.local.set({
      grapefruit: [...currentIds],
    });
  });
};

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
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
  } else if (request.settingsChange === "displayIdOnContentPage") {
    createIdDisplay(getPageId());
  }
});

(async () => {
  if (isFinalsite()) {
    chrome.runtime.sendMessage({ disableIcon: false });
    createIdDisplay(getPageId());
  } else {
    chrome.runtime.sendMessage({ disableIcon: true });
  }
})();
