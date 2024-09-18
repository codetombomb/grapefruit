const getPageId = () => {
  return document.body.getAttribute("data-pageid");
};

const isFinalsite = () => {
  return !!getPageId();
};

const openPage = async (pageId, fallbackHostname, proxyUrl) => {
  const previewUrl = `${window.location.protocol}//${window.location.hostname}/admin/fs`;

  try {
    const response = await fetch(`${proxyUrl}?previewUrl=${previewUrl}`, {
      method: "GET",
      redirect: "follow",
    });
    const data = await response.json();
    const siteUrl = `/fs/admin/site/pages/${pageId}`;
    const domain = data.finalUrl === "https://staff.finalsite.com"
      ? `${window.location.protocol}//${window.location.hostname}`
      : data.finalUrl;
    const redirectUrl = domain + siteUrl;

    window.open(redirectUrl, "_blank");
  } catch (error) {
    console.error("Error fetching final URL: ", error);
    window.open(
      `${window.location.protocol}//${fallbackHostname}/fs/admin/site/pages/${pageId}`,
      "_blank"
    );
  }
};

const createContainer = (pageId) => {
  const container = document.createElement("div");
  container.id = "id-container";
  container.classList.add("page-id-container");

  const id = document.createElement("span");
  id.classList.add("page-id");
  id.textContent = pageId;

  container.appendChild(id);
  document.body.appendChild(container);

  return container;
};

const getGrapefruitSettings = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("grapefruitSettings", (results) => {
      if (results.grapefruitSettings) {
        resolve(results.grapefruitSettings);
      } else {
        reject("No grapefruit settings found");
      }
    });
  });
};

const createIdDisplay = async (pageId) => {
  const handleClick = async () => {
    storeId(pageId);
    const fallbackHostname = `www.${window.location.hostname.split(".").slice(1).join(".")}`;
    const proxyUrl = "https://zesty-redirector.onrender.com/redirect-url";

    await openPage(pageId, fallbackHostname, proxyUrl);
  };

  try {
    const grapefruitSettings = await getGrapefruitSettings();

    if (grapefruitSettings.displayIdOnContentPage.value) {
      const container = createContainer(pageId);
      container.addEventListener("click", handleClick);
    } else {
      const existingContainer = document.getElementById("id-container");
      if (existingContainer) {
        existingContainer.remove();
      }
    }
  } catch (error) {
    console.error("Error fetching grapefruit settings: ", error);
  }
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
