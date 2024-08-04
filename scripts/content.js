const getPageId = () => {
  return document.body.getAttribute("data-pageid");
};

const isFinalsite = () => {
  return !!getPageId();
};

(async () => {
  const response = await chrome.runtime.sendMessage({
    isFinalsite: isFinalsite(),
  });
  console.log(response);
})();
