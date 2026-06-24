const DEFAULTS = { showName: true, truncateEnabled: false, truncateChars: 200 };

const showNameEl      = document.getElementById('showName');
const truncateEnabledEl = document.getElementById('truncateEnabled');
const truncateCharsEl = document.getElementById('truncateChars');
const truncateRowEl   = document.getElementById('truncateRow');

function applyTruncateState(enabled) {
  truncateRowEl.classList.toggle('disabled', !enabled);
}

chrome.storage.local.get(DEFAULTS, (s) => {
  showNameEl.checked        = s.showName;
  truncateEnabledEl.checked = s.truncateEnabled;
  truncateCharsEl.value     = s.truncateChars;
  applyTruncateState(s.truncateEnabled);
});

function save() {
  chrome.storage.local.set({
    showName:        showNameEl.checked,
    truncateEnabled: truncateEnabledEl.checked,
    truncateChars:   Math.max(20, parseInt(truncateCharsEl.value, 10) || 200),
  });
}

showNameEl.addEventListener('change', save);

truncateEnabledEl.addEventListener('change', () => {
  applyTruncateState(truncateEnabledEl.checked);
  save();
});

truncateCharsEl.addEventListener('input', save);
