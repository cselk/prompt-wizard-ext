console.log("🪄 Wizard Bubble Active");

const mockSnippets = [
  {
    name: "✨ Fix Grammar",
    text: "Please correct the grammar and flow of this: ",
  },
  {
    name: "💻 Review Code",
    text: "Analyze this code for bugs and efficiency: ",
  },
  {
    name: "📝 Summarize",
    text: "Summarize the following into 3 key bullet points: ",
  },
];

function initWizardBubble() {
  // Prevent duplicate injection
  if (document.querySelector(".wizard-floating-bubble")) return;

  // 1. Create the Bubble
  const bubble = document.createElement("div");
  bubble.className = "wizard-floating-bubble";
  bubble.title = "Open Snippets";

  // 2. Create the Menu
  const menu = document.createElement("div");
  menu.id = "snippet-window";

  mockSnippets.forEach((s) => {
    const item = document.createElement("div");
    item.className = "snippet-item";
    item.innerText = s.name;
    item.onclick = (e) => {
      e.stopPropagation();
      insertText(s.text);
      menu.style.display = "none";
    };
    menu.appendChild(item);
  });

  // 3. Add to Body
  document.body.appendChild(bubble);
  document.body.appendChild(menu);

  // 4. Interaction
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
  // Find the chatbox (same logic as before)
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
  } else {
    console.error("Wizard: Could not find input field to paste snippet.");
  }
}

// Since the body always exists, we can run this almost immediately
if (document.readyState === "complete") {
  initWizardBubble();
} else {
  window.addEventListener("load", initWizardBubble);
}

// Safety check: if the AI site does a full page transition without a reload
setInterval(initWizardBubble, 3000);
