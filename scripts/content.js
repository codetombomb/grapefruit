const getPageId = () => {
  return document.body.getAttribute("data-pageid");
};

const createIdDisplay = (pageId) => {
  chrome.storage.local.get("grapefruitSettings", (results) => {
    if (results.grapefruitSettings) {
      if (results.grapefruitSettings.displayIdOnContentPage.value) {
        const container = document.createElement("div");
        container.id = "id-container";
        const id = document.createElement("span");
        container.classList.add("page-id-container");
        container.addEventListener("click", async () => {
          storeId(pageId);

          const previewUrl =
            window.location.protocol +
            "//" +
            window.location.hostname +
            `/admin/fs`;
          const axiosUrl = "https://zesty-redirector.onrender.com/redirect-url";

          try {
            const response = await fetch(
              `${axiosUrl}?previewUrl=${previewUrl}`,
              {
                method: "GET",
                redirect: "follow",
              }
            );
            const data = await response.json();
            console.log("Final URL from server: ", data.finalUrl);
            const siteUrl = `/fs/admin/site/pages/${pageId}`;
            const redirectUrl = data.finalUrl + siteUrl;

            window.open(redirectUrl, "_blank");
          } catch (error) {
            console.error("Error fetching final URL: ", error);
            const fallbackHostname =
              "www." + window.location.hostname.split(".").slice(1).join(".");
            window.open(
              window.location.protocol +
                "//" +
                fallbackHostname +
                `/fs/admin/site/pages/${pageId}`,
              "_blank"
            );
          }
        });
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
    if (!found) {
      const newPageId = {
        id: id,
        siteURL: window.location.href,
        siteTitle: document.title,
        pinned: false,
      };
      currentIds.unshift(newPageId);
    } else {
      currentIds.splice(currentIds.indexOf(found), 1);
      currentIds.unshift(found);
    }
    currentIds = currentIds.sort((a, b) => b.pinned - a.pinned);
    if (currentIds.length > 15) {
      currentIds.pop();
    }
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
    if (isFinalsite()) {
      createIdDisplay(getPageId());
    }
  } else if (request.settingsChange === "displayIdBadge") {
    chrome.runtime.sendMessage({ type: "setBadgeText", text: getPageId() });
  } else if (request.settingsChange === "removeBadgeText") {
    chrome.runtime.sendMessage({ type: "removeBadgeText" });
  }
});

const checkBadgeSettings = () => {
  chrome.storage.local.get("grapefruitSettings", (results) => {
    if (results.grapefruitSettings.displayIdBadge.value) {
      chrome.runtime.sendMessage({ type: "setBadgeText", text: getPageId() });
    } else {
      chrome.runtime.sendMessage({ type: "removeBadgeText" });
    }
  });
};

(async () => {
  if (isFinalsite()) {
    chrome.runtime.sendMessage({ type: "isFinalsite" });
    checkBadgeSettings();
    createIdDisplay(getPageId());
  } else {
    chrome.runtime.sendMessage({ type: "notFinalsite" });
  }
})();
