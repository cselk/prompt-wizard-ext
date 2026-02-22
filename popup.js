// Central object to store all current selections
const promptData = {
  persona: "Expert Developer",
  operator: "summarize",
  format: "Bulletpoints",
  input: "",
  context: "",
  constraint: "",
};

function initCustomSelects() {
  const selects = document.querySelectorAll(".custom-select");

  selects.forEach((select) => {
    const trigger = select.querySelector(".select-trigger");
    const options = select.querySelectorAll(".custom-option");
    const dataId = select.getAttribute("data-id");

    // 1. Toggle Open/Close
    trigger.addEventListener("click", (e) => {
      // Close other open selects first
      document.querySelectorAll(".custom-select").forEach((s) => {
        if (s !== select) s.classList.remove("open");
      });
      select.classList.toggle("open");
      e.stopPropagation();
    });

    // 2. Handle Option Selection
    options.forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.getAttribute("data-value");
        const label = option.textContent;

        // Update UI
        trigger.querySelector("span").textContent = label;
        options.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");

        // Update Central Data Object
        promptData[dataId] = value;

        select.classList.remove("open");
      });
    });
  });
}

// Close all dropdowns if user clicks anywhere else
document.addEventListener("click", () => {
  document
    .querySelectorAll(".custom-select")
    .forEach((s) => s.classList.remove("open"));
});

// Run the initializer
initCustomSelects();

// Updated "Craft" Button Logic
document.getElementById("generateBtn").addEventListener("click", async () => {
  // Sync the standard text fields into our object
  promptData.input = document.getElementById("input").value;
  promptData.context = document.getElementById("context").value;
  promptData.constraint = document.getElementById("constraint").value;

  const finalPrompt = `Act as a ${promptData.persona}.
Task: ${promptData.operator} the following: "${promptData.input}".
Context: ${promptData.context}.
Constraint: ${promptData.constraint}.
Output Format: ${promptData.format}.`;

  // Send to AI page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text) => {
      const inputField =
        document.querySelector("#prompt-textarea") ||
        document.querySelector('[contenteditable="true"]');
      if (inputField) {
        inputField.focus();
        document.execCommand("insertText", false, text);
      }
    },
    args: [finalPrompt],
  });
});
