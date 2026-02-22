const categories = ["persona", "operator", "format"];

const defaults = {
  persona: ["Expert Developer", "Marketing Guru", "Socratic Tutor"],
  operator: ["Summarize", "Critizise", "Explain"],
  format: ["Bulletpoints", "Markdown", "Table"],
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. Load data
  chrome.storage.sync.get(categories, (data) => {
    categories.forEach((cat) => {
      const list = data[cat] || defaults[cat];
      renderList(cat, list);
    });
  });

  // 2. Handle "Add" clicks via Event Listener (No more CSP error)
  document.querySelectorAll(".add-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.getAttribute("data-category");
      addItem(category);
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
            <span class="remove-btn" data-index="${index}" data-category="${category}">×</span>
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
