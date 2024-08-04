const pageIdDisplay = document.getElementById("page-id");
const copyButton = document.getElementById("copy");
const copyMessage = document.querySelector(".copy-message");

copyButton.addEventListener("click", () => {
  navigator.clipboard.writeText(pageIdDisplay.textContent);
  copyMessage.textContent = "ID copied to clipboard!";
  setTimeout(() => {
    copyMessage.textContent = "";
  }, 2000);
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    chrome.tabs.sendMessage(tabs[0].id, { query: "getPageId" }, (response) => {
      console.log("Received response:", response);

      if (pageIdDisplay && response) {
        pageIdDisplay.textContent = response;
      }
    });
  }
});
