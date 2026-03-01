const promptData = {};

const defaultTemplates = [
  {
    name: "Standard",
    content: `
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
    `.trim(),
  },
];

let allTemplates = [];
let selectedTemplateContent = "";

document.addEventListener("DOMContentLoaded", () => {
  const categories = ["persona", "operator", "format"];

  chrome.storage.sync.get(
    ["persona", "operator", "format", "templates"],
    (data) => {
      categories.forEach((cat) => {
        const list = data[cat] || [];
        const container = document.querySelector(
          `[data-id="${cat}"] .custom-options`,
        );
        const triggerSpan = document.querySelector(
          `[data-id="${cat}"] .select-trigger span`,
        );

        if (container && list.length > 0) {
          container.innerHTML = list
            .map(
              (item, i) => `
                    <div class="custom-option ${i === 0 ? "selected" : ""}" data-value="${item}">
                        ${item}
                    </div>
                `,
            )
            .join("");

          triggerSpan.textContent = list[0];
          promptData[cat] = list[0];
        } else {
          console.warn(`No data or container found for category: ${cat}`);
        }
      });

      const templateList = data.templates || defaultTemplates;
      allTemplates = templateList;

      const container = document.querySelector(
        `[data-id="templates"] .custom-options`,
      );
      const triggerSpan = document.querySelector(
        `[data-id="templates"] .select-trigger span`,
      );

      container.innerHTML = templateList
        .map(
          (t, i) => `
                  <div class="custom-option ${i === 0 ? "selected" : ""}" data-value="${t.name}">
                      ${t.name}
                  </div>
              `,
        )
        .join("");

      triggerSpan.textContent = templateList[0].name;
      selectedTemplateContent = templateList[0].content;

      // Initialize click listeners after elements are injected
      initCustomSelects();
    },
  );
});

function initCustomSelects() {
  // Replace triggers to remove any existing listeners before re-attaching
  document.querySelectorAll(".select-trigger").forEach((trigger) => {
    trigger.replaceWith(trigger.cloneNode(true));
  });

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

      if (cat === "templates") {
        const found = allTemplates.find((t) => t.name === val);
        selectedTemplateContent = found ? found.content : "";
      }

      triggerSpan.textContent = val;
      menu
        .querySelectorAll(".custom-option")
        .forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");

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
  const currentInput = {
    persona: promptData.persona || "Expert",
    operator: promptData.operator || "Assist",
    format: promptData.format || "Plain Text",
    input: document.getElementById("input").value || "",
    context:
      document.getElementById("context").value || "No additional context.",
    constraint: document.getElementById("constraint").value || "None.",
  };

  let templateText = selectedTemplateContent;

  if (!templateText) {
    alert("Please select a template first.");
    return;
  }

  const keys = ["persona", "operator", "input", "context", "constraint", "format"];

  keys.forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    templateText = templateText.replace(regex, String(currentInput[key] || ""));
  });

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
      args: [templateText],
    });
  });
});
