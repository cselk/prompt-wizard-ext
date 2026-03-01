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

function initWizardBubble() {
  // Prevent duplicate injection
  if (document.querySelector(".wizard-floating-bubble")) return;

  // Create Bubble
  const bubble = document.createElement("div");
  bubble.className = "wizard-floating-bubble";
  bubble.title = "Open Snippets";

  // Reposition Bubble next to chatbox
  let voiceBtn = document.querySelector('[aria-label="Start Voice"]');

  if (!voiceBtn) {
    voiceBtn = document.querySelector('[aria-label="Send Prompt"]');
  }

  bubble.style.left =
    voiceBtn.getBoundingClientRect().left + voiceBtn.clientWidth + 25 + "px";

  bubble.style.top = voiceBtn.getBoundingClientRect().top + 8 + "px";

  // Create Menu
  const menu = document.createElement("div");
  menu.id = "snippet-window";

  // Load Snippets
  chrome.storage.sync.get(["snippets"], (data) => {
    const snippets = data.snippets || defaultSnippets;

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

  // Reposition Menu
  menu.style.top = voiceBtn.getBoundingClientRect().top + 40 + "px";
  menu.style.left =
    voiceBtn.getBoundingClientRect().left + voiceBtn.clientWidth + 25 + "px";

  // Add bubble and menu to Body
  document.body.appendChild(bubble);
  document.body.appendChild(menu);

  // Click event on bubble
  bubble.onclick = (e) => {
    e.stopPropagation();
    const isVisible = menu.style.display === "flex";
    menu.style.display = isVisible ? "none" : "flex";
  };

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== bubble) {
      menu.style.display = "none";
    }
  });
}

function insertText(text) {
  // Find the chatbox
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

  // Insert prompt if chatbox found
  if (inputField) {
    inputField.focus();
    document.execCommand("insertText", false, text);
  } else {
    console.error("Wizard: Could not find input field to paste snippet.");
  }
}

// run init when body loaded
if (document.readyState === "complete") {
  initWizardBubble();
} else {
  window.addEventListener("load", initWizardBubble);
}

// Safety check for if the site performs a page transition without reload
setInterval(initWizardBubble, 3000);
