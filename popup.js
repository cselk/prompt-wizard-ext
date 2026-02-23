const promptData = {};

const defaultTemplate = `
# SYSTEM INSTRUCTIONS
Act as an expert {{persona}}. Your goal is to execute the user's task with high precision, adopting the specific tone and depth associated with this persona.

# TASK OBJECTIVE
Your primary mission is to: {{operator}}.
Please process the following input: "{{input}}"

# PROVIDED CONTEXT
{{context}}

# OPERATIONAL CONSTRAINTS & RULES
- STRICTURE: {{constraint}}
- Maintain the authoritative voice of a {{persona}}.
- Do not provide meta-commentary (e.g., do not say "Here is the summary").
- Focus exclusively on the output based on the provided input.

# OUTPUT SPECIFICATION
- FORMAT: {{format}}
- Ensure the structural integrity of the {{format}} request is maintained.

# EXECUTION
Begin the response now.
`.trim();

document.addEventListener("DOMContentLoaded", () => {
  // 1. Explicitly list the categories as they appear in storage
  const categories = ["persona", "operator", "format"];

  chrome.storage.sync.get(categories, (data) => {
    categories.forEach((cat) => {
      // Get the list from storage or use a temporary fallback if empty
      const list = data[cat] || [];

      // Find the container based on data-id
      const container = document.querySelector(
        `[data-id="${cat}"] .custom-options`,
      );
      const triggerSpan = document.querySelector(
        `[data-id="${cat}"] .select-trigger span`,
      );

      if (container && list.length > 0) {
        // Clear existing and inject new options
        container.innerHTML = list
          .map(
            (item, i) => `
                    <div class="custom-option ${i === 0 ? "selected" : ""}" data-value="${item}">
                        ${item}
                    </div>
                `,
          )
          .join("");

        // Update the trigger text to the first item in the list
        triggerSpan.textContent = list[0];
        promptData[cat] = list[0];
      } else {
        console.warn(`No data or container found for category: ${cat}`);
      }
    });

    // 3. Initialize the click listeners AFTER the elements are injected
    initCustomSelects();
  });
});

function initCustomSelects() {
  // Dropdown Toggles
  document.querySelectorAll(".select-trigger").forEach((trigger) => {
    // Remove existing listeners to prevent double-firing
    trigger.replaceWith(trigger.cloneNode(true));
  });

  // Re-select triggers after clone
  document.querySelectorAll(".select-trigger").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      const parent = trigger.parentElement;
      // Close others
      document.querySelectorAll(".custom-select").forEach((s) => {
        if (s !== parent) s.classList.remove("open");
      });
      parent.classList.toggle("open");
      e.stopPropagation();
    });
  });

  // Option Clicks (using Event Delegation)
  document.querySelectorAll(".custom-options").forEach((menu) => {
    menu.addEventListener("click", (e) => {
      const option = e.target.closest(".custom-option");
      if (!option) return;

      const val = option.getAttribute("data-value");
      const cat = option.closest(".custom-select").getAttribute("data-id");
      const triggerSpan = option
        .closest(".custom-select")
        .querySelector(".select-trigger span");

      // Update UI
      triggerSpan.textContent = val;
      menu
        .querySelectorAll(".custom-option")
        .forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");

      // Update Data
      promptData[cat] = val;

      option.closest(".custom-select").classList.remove("open");
    });
  });
}

// Close on outside click
document.addEventListener("click", () => {
  document
    .querySelectorAll(".custom-select")
    .forEach((s) => s.classList.remove("open"));
});

document.getElementById("generateBtn").addEventListener("click", () => {
  // 1. Collect current input values
  const currentInput = {
    persona: promptData.persona || "Expert",
    operator: promptData.operator || "Assist",
    format: promptData.format || "Plain Text",
    input: document.getElementById("input").value || "",
    context:
      document.getElementById("context").value || "No additional context.",
    constraint: document.getElementById("constraint").value || "None.",
  };

  // 3. Fetch from storage
  chrome.storage.sync.get(["template"], (data) => {
    // Use the saved template or the default string
    let templateText = data.template || defaultTemplate;

    // 4. Safely Replace Placeholders
    const keys = [
      "persona",
      "operator",
      "input",
      "context",
      "constraint",
      "format",
    ];

    keys.forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      // Ensure the value exists and is a string before calling .replace
      const replacementValue = String(currentInput[key] || "");
      templateText = templateText.replace(regex, replacementValue);
    });

    // 5. Send to Tab (The variable is now definitely defined in this scope)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (textToInject) => {
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
            document.execCommand("insertText", false, textToInject);
          } else {
            alert("Could not find an AI input field on this page.");
          }
        },
        args: [templateText], // Pass the finished text here
      });
    });
  });
});
