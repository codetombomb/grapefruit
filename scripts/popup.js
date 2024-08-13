const pageIdDisplay = document.getElementById("page-id");
const copyButton = document.getElementById("copy");
const copyMessage = document.querySelector(".copy-message");
const pageHistoryLink = document.querySelector(".page-history-link");
const pageHistoryUl = document.querySelector(".page-history-display");
const pageTitle = document.getElementById("grapefruit-title");

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

const createSiteUrl = (url) => url.split("//")[1].slice(0, 20);

const renderHistory = (history) => {
  pageHistoryUl.textContent = "";
  history.map((data, index) => {
    const linkName = createSiteUrl(data.siteURL);
    const li = createEl("li");
    const siteLink = createEl("a");
    const deleteIcon = createEl("img");
    li.className = "history-li";
    const deleteIconConfig = {
      dataset: { indexId: `data-${index}-${data.id}` },
      src: "icons/delete.svg",
      alt: "X delete icon",
      className: "delete-icon",
      events: {
        click: handleDeleteHistoryLi,
      },
    };
    const siteLinkConfig = {
      href: data.siteURL,
      target: "_blank",
      textContent: `ID: ${data.id}, ${linkName}...`,
      classList: ["history-link"],
    };
    configEl(deleteIcon, deleteIconConfig);
    configEl(siteLink, siteLinkConfig);
    li.append(deleteIcon, siteLink);
    pageHistoryUl.appendChild(li);
  });
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
