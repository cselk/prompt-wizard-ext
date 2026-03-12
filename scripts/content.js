/**
 * @file content.js
 * @description Content script injected into AI chat pages (e.g. ChatGPT).
 * Renders a floating bubble that opens a snippet picker, and provides a
 * shared text-insertion helper used by both the bubble and the popup.
 */

/**
 * Positions the floating bubble and its snippet menu relative to the chat
 * input's action buttons. Tries several well-known selectors so it works
 * across ChatGPT UI versions. Hides the bubble when no anchor is found
 * (e.g. when the user navigates away from the chat view).
 */
function repositionCito() {
  const bubble = document.querySelector(".cito-floating-bubble");
  const menu = document.getElementById("snippet-window");

  // Anchor to Voice or Send button
  let anchor =
    document.querySelector('[aria-label="Start Voice"]') || // ChatGPT
    document.querySelector('[aria-label="Send Prompt"]') || // ChatGPT
    document.querySelector('button[data-testid="send-button"]') || // ChatGPT
    document.querySelector(".input-buttons-wrapper-bottom") || // Gemini
    document.querySelector(".\\!box-content"); // Claude

  if (anchor && bubble && menu) {
    const rect = anchor.getBoundingClientRect();
    const offsetX = 25;
    const offsetY = 8;

    bubble.style.position = "fixed";
    bubble.style.left = `${rect.left + anchor.clientWidth + offsetX}px`;
    bubble.style.top = `${rect.top + offsetY}px`;
    bubble.style.display = "flex";

    menu.style.position = "fixed";
    menu.style.left = bubble.style.left;
    menu.style.top = `${rect.top + 45}px`;
  } else if (bubble) {
    // Hide bubble if the chatbox is gone (e.g., navigating to settings)
    bubble.style.display = "none";
  }
}

/**
 * Creates the floating bubble and snippet-picker menu and appends them to
 * the page body. Loads snippets from chrome.storage.sync and builds a menu
 * item for each one. Clicking a snippet item inserts its content into the
 * active chat input and closes the menu. Guards against double-initialisation
 * so it is safe to call repeatedly from the polling interval.
 */
function initCitoBubble() {
  if (document.querySelector(".cito-floating-bubble")) return;

  const bubble = document.createElement("div");
  bubble.className = "cito-floating-bubble";
  bubble.title = "Open Snippets";

  const menu = document.createElement("div");
  menu.id = "snippet-window";
  menu.style.display = "none";

  chrome.storage.sync.get(["snippets"], (data) => {
    const snippets = data.snippets;
    menu.innerHTML = "";
    snippets.forEach((s) => {
      const item = document.createElement("div");
      item.className = "snippet-item";
      item.innerText = s.name;
      item.onclick = (e) => {
        e.stopPropagation();
        insertText(s.content);
        menu.style.display = "none";
      };
      menu.appendChild(item);
    });
  });

  document.body.appendChild(bubble);
  document.body.appendChild(menu);

  bubble.onclick = (e) => {
    e.stopPropagation();
    const isVisible = menu.style.display === "flex";
    menu.style.display = isVisible ? "none" : "flex";
  };

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== bubble) {
      menu.style.display = "none";
    }
  });

  repositionCito();
}

/**
 * Inserts the given text into the first recognised chat input field on the
 * page. Uses `execCommand("insertText")` so the host application's input
 * listeners (React synthetic events, etc.) fire correctly.
 *
 * @param {string} text - Plain text to insert at the current cursor position.
 */
function insertText(text) {
  const selectors = [
    "#prompt-textarea",
    ".ProseMirror",
    '[contenteditable="true"]',
    "textarea",
  ];
  let inputField = null;
  for (const s of selectors) {
    inputField = document.querySelector(s);
    if (inputField) break;
  }
  if (inputField) {
    inputField.focus();
    document.execCommand("insertText", false, text);
  }
}

if (document.readyState === "complete") {
  initCitoBubble();
} else {
  window.addEventListener("load", initCitoBubble);
}

// Poll to keep the bubble positioned (handles resizes and DOM changes)
setInterval(repositionCito, 10);

// Re-inject on React re-renders
setInterval(initCitoBubble, 2000);
