const pageIdDisplay = document.getElementById("page-id");
const copyButton = document.getElementById("copy");
const copyMessage = document.querySelector(".copy-message");
const pageHistoryLink = document.querySelector(".page-history-link");
const pageHistoryUl = document.querySelector(".page-history-display");

const renderNotFinalsite = () => {
  document.body.textContent = "";
  const message = document.createElement("h1");
  message.classList.add("title", "grapefruit");
  message.textContent = "This is not a Finalsite page";
  document.body.appendChild(message);
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
  console.log(deleteIndex);
  chrome.storage.local.get("grapefruit", (results) => {
    results.grapefruit.splice(deleteIndex, 1);
    chrome.storage.local.set({ grapefruit: results.grapefruit });
    renderHistory(results.grapefruit);
  });
};

const renderHistory = (history) => {
  pageHistoryUl.textContent = "";
  history.map((data, index) => {
    const linkName = data.siteURL.split("//")[1].slice(0, 20);
    const li = document.createElement("li");
    const siteLink = document.createElement("a");
    const deleteIcon = document.createElement("img");
    li.className = "history-li";
    deleteIcon.dataset.indexId = `data-${index}-${data.id}`;
    deleteIcon.src = "icons/delete.svg";
    deleteIcon.alt = "X delete icon";
    deleteIcon.className = "delete-icon";
    deleteIcon.addEventListener("click", handleDeleteHistoryLi);
    siteLink.classList.add("history-link");
    siteLink.href = data.siteURL;
    siteLink.target = "_blank";
    siteLink.textContent = `ID: ${data.id}, ${linkName}...`;
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
        if (response.pageChecksOut) {
          getPageId(tabs);
        } else {
          renderNotFinalsite();
        }
      }
    );
  }
});
