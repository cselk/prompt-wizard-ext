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

// Reusable function to calculate and apply positions
function repositionWizard() {
  const bubble = document.querySelector(".wizard-floating-bubble");
  const menu = document.getElementById("snippet-window");

  // Try to find a reference anchor (Voice button or Send button)
  let anchor =
    document.querySelector('[aria-label="Start Voice"]') ||
    document.querySelector('[aria-label="Send Prompt"]') ||
    document.querySelector('button[data-testid="send-button"]');

  if (anchor && bubble && menu) {
    const rect = anchor.getBoundingClientRect();
    const offsetX = 25;
    const offsetY = 8;

    // Move Bubble
    bubble.style.position = "fixed";
    bubble.style.left = `${rect.left + anchor.clientWidth + offsetX}px`;
    bubble.style.top = `${rect.top + offsetY}px`;
    bubble.style.display = "flex"; // Ensure it's visible if anchor is found

    // Move Menu (Keep it synced below the bubble)
    menu.style.position = "fixed";
    menu.style.left = bubble.style.left;
    menu.style.top = `${rect.top + 45}px`;
  } else if (bubble) {
    // Hide bubble if the chatbox/anchor is gone (e.g., navigating to settings)
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
  menu.style.display = "none"; // Ensure it starts hidden

  chrome.storage.sync.get(["snippets"], (data) => {
    const snippets = data.snippets || defaultSnippets;
    menu.innerHTML = ""; // Clear mock items
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

  // Run first positioning immediately
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

// 1. Initialize the elements
if (document.readyState === "complete") {
  initWizardBubble();
} else {
  window.addEventListener("load", initWizardBubble);
}

// 2. The Interval for Positioning (Smoothness check)
// 100ms makes the movement look fluid if the user resizes the window or chatbox grows
setInterval(repositionWizard, 10);

// 3. The Interval for Injection (Ensures it survives React re-renders)
setInterval(initWizardBubble, 2000);
