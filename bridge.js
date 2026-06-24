// Isolated world — has chrome.storage access.
// Writes settings to a DOM dataset attr that the MAIN world content script reads.

const ATTR = 'quoteReplySettings';
const DEFAULTS = { showName: true, truncateEnabled: false, truncateChars: 200 };

function push(settings) {
  document.documentElement.dataset[ATTR] = JSON.stringify({ ...DEFAULTS, ...settings });
}

chrome.storage.local.get(DEFAULTS, push);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  chrome.storage.local.get(DEFAULTS, push);
});
