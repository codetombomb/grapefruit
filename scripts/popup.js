const pageIdDisplay = document.getElementById("page-id");
const copyButton = document.getElementById("copy");
const copyMessage = document.querySelector(".copy-message");
const pageHistoryLink = document.querySelector(".page-history-link");
const pageHistoryUl = document.querySelector(".page-history-display");

const renderNotFinalsite = () => {
  document.body.textContent = "";
  const message = document.createElement("h1");
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

const renderHistory = (history) => {
  history.map((data) => {
    const linkName = data.siteURL.split("//")[1].slice(0, 20);
    const li = document.createElement("li");
    const siteLink = document.createElement("a");
    siteLink.classList.add("history-link");
    siteLink.href = data.siteURL;
    siteLink.target = "_blank";
    siteLink.textContent = `ID: ${data.id}, ${linkName}...`;
    li.appendChild(siteLink);
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
