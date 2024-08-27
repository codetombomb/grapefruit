const pageIdDisplay = document.getElementById("page-id");
const copyButton = document.getElementById("copy");
const copyMessage = document.querySelector(".copy-message");
const pageHistoryLink = document.querySelector(".page-history-link");
const pageHistoryUl = document.querySelector(".page-history-display");
const pageTitle = document.getElementById("grapefruit-title");
const settingsIcon = document.getElementById("settings-icon");
const settingsPanel = document.getElementById("settings-panel");
let grapefruitSettings = {};

chrome.storage.local.get("grapefruitSettings", (results) => {
  if (!results.grapefruitSettings) {
    chrome.storage.local.set({ grapefruitSettings });
  } else {
    grapefruitSettings = { ...results.grapefruitSettings };
  }
});

settingsIcon.addEventListener("click", (e) => {
  settingsPanel.classList.toggle("active");
  if (settingsPanel.classList.contains("active")) {
    e.target.src = "icons/delete.svg";
    document.body.style.height = "300px";
  } else {
    e.target.src = "icons/settings-icon.svg";
    document.body.style.height = "100%";
  }
});

const renderNotFinalsite = () => {
  pageTitle.textContent = "This is not a Finalsite page";
  copyButton.style.display = "none";
};

const getPageId = (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { query: "getPageId" }, (response) => {
    if (pageIdDisplay && response) {
      pageIdDisplay.textContent = response;
    }
  });
};

const handleDeleteHistoryLi = ({ target }) => {
  const deleteIndex = parseInt(target.dataset.indexId.split("-")[1]);
  chrome.storage.local.get("grapefruit", (results) => {
    results.grapefruit.splice(deleteIndex, 1);
    chrome.storage.local.set({ grapefruit: results.grapefruit });
    renderHistory(results.grapefruit);
  });
};

const handlePinHistoryLi = ({ target }) => {
  const pinIndex = parseInt(target.dataset.indexId.split("-")[2]);
  chrome.storage.local.get("grapefruit", (results) => {
    if (results.grapefruit[pinIndex].pinned) {
      target.src = "icons/unpin-icon.svg";
      results.grapefruit[pinIndex].pinned = false;
    } else {
      target.src = "icons/pin-icon.svg";
      results.grapefruit[pinIndex].pinned = true;
    }
    chrome.storage.local.set({ grapefruit: results.grapefruit });
  });
};

const createEl = (el) => document.createElement(el);

const configEl = (el, config) => {
  if (config.dataset) {
    for (const key in config.dataset) {
      el.dataset[key] = config.dataset[key];
    }
  }
  for (const key in config) {
    if (key !== "dataset" && key !== "events") {
      el[key] = config[key];
    }
  }

  if (config.events) {
    for (const event in config.events) {
      el.addEventListener(event, config.events[event]);
    }
  }

  if (config.classList) {
    el.classList.add(...config.classList);
  }
};

const renderHistory = (history) => {
  pageHistoryUl.textContent = "";
  history.map((data, index) => {
    const li = createEl("li");
    const siteLink = createEl("a");
    const deleteIcon = createEl("img");
    const pinIcon = createEl("img");
    li.className = "history-li";
    const deleteIconConfig = {
      dataset: { indexId: `data-${index}-${data.id}` },
      src: "icons/delete.svg",
      alt: "X delete icon",
      className: "history-icon",
      events: {
        click: handleDeleteHistoryLi,
      },
    };
    const siteLinkConfig = {
      href: data.siteURL,
      target: "_blank",
      textContent: `${index + 1}.)  ID: ${data.id} - ${data.siteTitle}`,
      classList: ["history-link"],
    };
    const pinIconConfig = {
      dataset: { indexId: `data-pin-${index}-${data.id}` },
      src: data.pinned ? "icons/pin-icon.svg" : "icons/unpin-icon.svg",
      alt: "Pin icon",
      className: "history-icon",
      events: {
        click: handlePinHistoryLi,
      },
    };
    configEl(pinIcon, pinIconConfig), configEl(deleteIcon, deleteIconConfig);
    configEl(siteLink, siteLinkConfig);
    li.append(pinIcon, deleteIcon, siteLink);
    pageHistoryUl.appendChild(li);
  });
};

const handleSettingsChange = ({ target }) => {
  chrome.storage.local.get("grapefruitSettings", (results) => {
    const settingsCopy = { ...results.grapefruitSettings };
    settingsCopy[target.dataset.setting].value = target.checked;
    saveSettings(settingsCopy);
    if (target.dataset.setting === "displayIdOnContentPage") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          settingsChange: "displayIdOnContentPage",
        });
      });
    }
    debugger;
    if (target.dataset.setting === "displayIdBadge" && target.checked) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          settingsChange: "displayIdBadge",
        });
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          settingsChange: "removeBadgeText",
        });
      });
    }
  });
};

const renderSettings = (settings) => {
  Object.entries(settings).map((setting) => {
    const p = createEl("p");
    const input = createEl("input");
    p.textContent = setting[1].name;
    input.type = setting[1].type;
    input.dataset.setting = setting[0];
    input.checked = setting[1].value;
    input.addEventListener("change", handleSettingsChange);
    p.appendChild(input);
    settingsPanel.appendChild(p);
  });
};

const saveSettings = (settings) => {
  chrome.storage.local.set({ grapefruitSettings: settings });
};

pageHistoryLink.addEventListener("click", (e) => {
  if (e.target.textContent === "ID History") {
    e.target.textContent = "Close History";
    chrome.storage.local.get("grapefruit", (results) => {
      if (results.grapefruit) {
        renderHistory(results.grapefruit);
      }
    });
  } else {
    pageHistoryUl.textContent = "";
    e.target.textContent = "ID History";
  }
});

copyButton.addEventListener("click", () => {
  navigator.clipboard.writeText(pageIdDisplay.textContent);
  copyMessage.textContent = "ID copied to clipboard!";
  setTimeout(() => {
    copyMessage.textContent = "";
  }, 2000);
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { query: "isFinalsite" },
      (response) => {
        if (response?.pageChecksOut) {
          getPageId(tabs);
        } else {
          renderNotFinalsite();
        }
      }
    );
  }
});

(() => {
  chrome.storage.local.get("grapefruitSettings", (results) => {
    if (!results.grapefruitSettings) {
      const defaultSettings = {
        displayIdOnContentPage: {
          name: "Display ID on Page",
          value: false,
          checked: false,
          type: "checkbox",
        },
        displayIdBadge: {
          name: "Display ID on Badge",
          value: false,
          checked: false,
          type: "checkbox",
        },
      };
      chrome.storage.local.set({ grapefruitSettings: defaultSettings });
      grapefruitSettings = defaultSettings;
      renderSettings(grapefruitSettings);
    } else {
      grapefruitSettings = { ...results.grapefruitSettings };
      renderSettings(grapefruitSettings);
    }
  });
})();
