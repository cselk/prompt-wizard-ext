const defaultSnippets = [
  {
    name: "Fix Grammar",
    content: "Please correct the grammar and flow of this: ",
  },
  {
    name: "Review Code",
    content: "Analyze this code for bugs and efficiency: ",
  },
  {
    name: "Summarize",
    content: "Summarize the following into 3 key bullet points: ",
  },
];

function repositionWizard() {
  const bubble = document.querySelector(".wizard-floating-bubble");
  const menu = document.getElementById("snippet-window");

  // Anchor to Voice or Send button
  let anchor =
    document.querySelector('[aria-label="Start Voice"]') ||
    document.querySelector('[aria-label="Send Prompt"]') ||
    document.querySelector('button[data-testid="send-button"]');

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

function initWizardBubble() {
  if (document.querySelector(".wizard-floating-bubble")) return;

  const bubble = document.createElement("div");
  bubble.className = "wizard-floating-bubble";
  bubble.title = "Open Snippets";

  const menu = document.createElement("div");
  menu.id = "snippet-window";
  menu.style.display = "none";

  chrome.storage.sync.get(["snippets"], (data) => {
    const snippets = data.snippets || defaultSnippets;
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

  repositionWizard();
}

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
  initWizardBubble();
} else {
  window.addEventListener("load", initWizardBubble);
}

// Poll to keep the bubble positioned (handles resizes and DOM changes)
setInterval(repositionWizard, 10);

// Re-inject on React re-renders
setInterval(initWizardBubble, 2000);
