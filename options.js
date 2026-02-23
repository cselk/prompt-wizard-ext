const categories = ["persona", "operator", "format"];

const defaults = {
  persona: ["Expert Developer", "Marketing Guru", "Socratic Tutor"],
  operator: ["Summarize", "Critizise", "Explain"],
  format: ["Bulletpoints", "Markdown", "Table"],
};

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
  // Load data
  chrome.storage.sync.get(categories, (data) => {
    categories.forEach((cat) => {
      const list = data[cat] || defaults[cat];
      renderList(cat, list);
    });
  });

  // Load template
  chrome.storage.sync.get(["template"], (data) => {
    document.getElementById("master-template").value =
      data.template || defaultTemplate;
  });

  // Handle "Add" clicks via Event Listener (No more CSP error)
  document.querySelectorAll(".add-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.getAttribute("data-category");
      addItem(category);
    });
  });

  // Save Template Logic
  document.getElementById("save-template-btn").addEventListener("click", () => {
    const newTemplate = document.getElementById("master-template").value;
    chrome.storage.sync.set({ template: newTemplate }, () => {
      alert("Template saved successfully!");
    });
  });
});

function renderList(category, items) {
  const container = document.getElementById(`${category}-list`);
  if (!container) return;

  container.innerHTML = "";
  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
            <span>${item}</span>
            <span class="remove-btn" data-index="${index}" data-category="${category}">&#x00D7</span>
        `;
    container.appendChild(div);
  });

  // Handle "Remove" clicks via Event Listener
  container.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const cat = e.target.getAttribute("data-category");
      const idx = parseInt(e.target.getAttribute("data-index"));
      removeItem(cat, idx);
    });
  });
}

function addItem(category) {
  const input = document.getElementById(`new-${category}`);
  const newItem = input.value.trim();
  if (!newItem) return;

  chrome.storage.sync.get(category, (data) => {
    const list = data[category] || defaults[category];
    list.push(newItem);
    chrome.storage.sync.set({ [category]: list }, () => {
      renderList(category, list);
      input.value = "";
    });
  });
}

function removeItem(category, index) {
  chrome.storage.sync.get(category, (data) => {
    const list = data[category];
    list.splice(index, 1);
    chrome.storage.sync.set({ [category]: list }, () => {
      renderList(category, list);
    });
  });
}
