(function () {
  'use strict';

  const BTN_ATTR = 'data-quote-reply-injected';

  function getQuill() {
    const all = Array.from(document.querySelectorAll('[data-qa="message_input"]'));

    const active = document.activeElement?.closest('[data-qa="message_input"]');
    if (active?.__quill) return active.__quill;

    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].__quill) return all[i].__quill;
    }
    return null;
  }

  function getMessageInfo(actionsContainer) {
    const message =
      actionsContainer.closest('[data-qa="message_container"]') ??
      actionsContainer.closest('[role="listitem"]');

    if (!message) return { text: null, sender: null };

    const sections = message.querySelectorAll('.p-rich_text_section');
    const text = Array.from(sections).map((s) => s.innerText).join('\n').trim();

    const senderEl = message.querySelector('[data-qa="message_sender_name"]');
    const sender = senderEl?.innerText?.trim() ?? null;

    return { text, sender };
  }

  function getSettings() {
    try {
      return JSON.parse(document.documentElement.dataset.quoteReplySettings || '{}');
    } catch {
      return {};
    }
  }

  function insertQuote(text, sender) {
    const quill = getQuill();
    if (!quill) {
      console.warn('[quote-reply] Quill instance not found');
      return;
    }

    const { showName = true, truncateEnabled = false, truncateChars = 200 } = getSettings();

    const displaySender = showName ? sender : null;
    let displayText = text;
    if (truncateEnabled && text.length > truncateChars) {
      displayText = text.slice(0, truncateChars).trimEnd() + '…';
    }

    const senderPart = displaySender ? `<strong>${displaySender}</strong><br>` : '';
    const bodyPart = displayText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    const html = `<blockquote>${senderPart}${bodyPart}</blockquote><p><br></p>`;

    quill.focus();
    // dangerouslyPasteHTML(index, html) inserts at position 0 — before any existing text
    quill.clipboard.dangerouslyPasteHTML(0, html);
  }

  function makeButton(actionsContainer) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'c-button-unstyled c-icon_button c-icon_button--size_smedium quote-reply-btn';
    btn.setAttribute('aria-label', 'Quote reply');
    btn.setAttribute('title', 'Quote reply');

    // Re-use Slack's own blockquote icon SVG path
    btn.innerHTML = `<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
      <path fill-rule="evenodd" d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0zM6.75 3a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zM6 10.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75m.75 5.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5z" clip-rule="evenodd"/>
    </svg>`;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const { text, sender } = getMessageInfo(actionsContainer);
      if (!text) {
        console.warn('[quote-reply] Message text not found');
        return;
      }

      insertQuote(text, sender);
    });

    return btn;
  }

  function injectButton(actionsContainer) {
    if (actionsContainer.hasAttribute(BTN_ATTR)) return;
    actionsContainer.setAttribute(BTN_ATTR, '1');

    const btn = makeButton(actionsContainer);

    // Insert right after the "Reply in thread" button if present
    const replyBtn =
      actionsContainer.querySelector('[data-qa="reply_action_button"]') ??
      actionsContainer.querySelector('[aria-label="Reply in thread"]') ??
      actionsContainer.querySelector('[data-qa="threads-reply"]');

    if (replyBtn?.parentNode) {
      replyBtn.parentNode.insertBefore(btn, replyBtn.nextSibling);
    } else {
      actionsContainer.appendChild(btn);
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const { addedNodes } of mutations) {
      for (const node of addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('.c-message_actions__container')) {
          injectButton(node);
        } else {
          node.querySelectorAll?.('.c-message_actions__container').forEach(injectButton);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
