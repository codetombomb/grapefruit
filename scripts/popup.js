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

const handleEditHistoryLink = (link) => {
  const linkId = link.text.split("-")[0];
  const currentText = link.text.split("-")[1].trim();
  const input = createEl("input");
  input.type = "text";
  input.value = currentText;
  input.className = "edit-input";

  link.replaceWith(input);

  const saveEdit = () => {
    input.removeEventListener("blur", saveEdit);
    input.removeEventListener("keydown", saveEditOnEnter);

    link.textContent = `${linkId} - ${input.value.trim()}`;
    input.replaceWith(link);

    chrome.storage.local.get("grapefruit", (results) => {
      const parsedId = linkId.split(" ")[1];
      const index = results.grapefruit.findIndex(
        (item) => item.id === parsedId
      );
      results.grapefruit[index].siteTitle = input.value;
      chrome.storage.local.set({ grapefruit: results.grapefruit });
    });
  };

  const saveEditOnEnter = (event) => {
    if (event.key === "Enter") {
      saveEdit();
    }
  };

  input.addEventListener("blur", saveEdit);
  input.addEventListener("keydown", saveEditOnEnter);

  input.focus();
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
    const editIcon = createEl("img");
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
      textContent: `ID: ${data.id} - ${data.siteTitle}`,
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
    const editIconConfig = {
      dataset: { indexId: `data-edit-${index}-${data.id}` },
      src: "icons/edit-icon.svg",
      alt: "Edit icon",
      className: "history-icon",
      events: {
        click: () => handleEditHistoryLink(siteLink),
      },
    };
    configEl(pinIcon, pinIconConfig);
    configEl(deleteIcon, deleteIconConfig);
    configEl(editIcon, editIconConfig);
    configEl(siteLink, siteLinkConfig);
    li.append(pinIcon, deleteIcon, editIcon, siteLink);
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
    if (target.dataset.setting === "displayIdBadge" && target.checked) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          settingsChange: "displayIdBadge",
        });
      });
    }
    if (target.dataset.setting === "displayIdBadge" && !target.checked) {
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
