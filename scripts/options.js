const categories = ["persona", "operator", "format"];

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get([...categories, "templates", "snippets"], (data) => {
    categories.forEach((cat) => {
      const list = data[cat];
      renderList(cat, list);
    });

    const templateList = data.templates;
    renderTemplateList(templateList);

    const snippetList = data.snippets;
    renderSnippetList(snippetList);
  });

  document.querySelectorAll(".add-btn[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.getAttribute("data-category");
      openModal({ mode: "create", category });
    });
  });

  document.getElementById("save-template-btn").addEventListener("click", () => {
    const name = document.getElementById("template-name").value.trim();
    const content = document.getElementById("template-content").value.trim();

    if (!name || !content)
      return alert("Please provide both a name and content.");

    chrome.storage.sync.get(["templates"], (data) => {
      const list = data.templates;
      list.push({ name, content });
      chrome.storage.sync.set({ templates: list }, () => {
        renderTemplateList(list);
        document.getElementById("template-name").value = "";
        document.getElementById("template-content").value = "";
      });
    });
  });
});

// Save Snippet
document.getElementById("save-snippet-btn").addEventListener("click", () => {
  const name = document.getElementById("snippet-name").value.trim();
  const content = document.getElementById("snippet-content").value.trim();

  if (!name || !content)
    return alert("Please provide both a name and content.");

  chrome.storage.sync.get(["snippets"], (data) => {
    const list = data.snippets;
    list.push({ name, content });
    chrome.storage.sync.set({ snippets: list }, () => {
      renderSnippetList(list);
      document.getElementById("snippet-name").value = "";
      document.getElementById("snippet-content").value = "";
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

    // use textContent for untrusted text to avoid HTML injection
    const label = document.createElement("span");
    label.textContent = item;

    const controls = document.createElement("div");

    const editBtn = document.createElement("span");
    editBtn.className = "edit-btn";
    editBtn.dataset.index = String(index);
    editBtn.dataset.category = String(category);

    const editImg = document.createElement("img");
    editImg.src = "assets/edit.svg";
    editImg.className = "icon";
    editImg.alt = "";
    editBtn.appendChild(editImg);

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-btn";
    removeBtn.dataset.index = String(index);
    removeBtn.dataset.category = String(category);

    const removeImg = document.createElement("img");
    removeImg.src = "assets/trash.svg";
    removeImg.className = "icon";
    removeImg.alt = "";
    removeBtn.appendChild(removeImg);

    controls.appendChild(editBtn);
    controls.appendChild(removeBtn);

    div.appendChild(label);
    div.appendChild(controls);

    container.appendChild(div);
  });

  container.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const cat = e.currentTarget.getAttribute("data-category");
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      removeItem(cat, idx);
    });
  });

  container.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const category = e.currentTarget.getAttribute("data-category");
      const index = parseInt(e.currentTarget.getAttribute("data-index"));
      const itemText = e.currentTarget
        .closest(".item")
        .querySelector("span").textContent;
      openEditModal(category, index, itemText);
    });
  });
}

function removeItem(category, index) {
  chrome.storage.sync.get(category, (data) => {
    const list = data[category];

    if (list.length <= 1) {
      alert("At least one item needs to remain!");
      return;
    }

    list.splice(index, 1);
    chrome.storage.sync.set({ [category]: list }, () => {
      renderList(category, list);
    });
  });
}

function renderTemplateList(items) {
  const container = document.getElementById("template-list");
  container.innerHTML = "";
  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    const nameSpan = document.createElement("span");
    const nameBold = document.createElement("b");

    nameBold.textContent = item.name;
    nameSpan.appendChild(nameBold);

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "\u00D7";
    removeBtn.onclick = () => removeSnippet(index);

    div.appendChild(nameSpan);
    div.appendChild(removeBtn);
    container.appendChild(div);
  });
}

function removeTemplate(index) {
  chrome.storage.sync.get(["templates"], (data) => {
    const list = data.templates;
    list.splice(index, 1);
    chrome.storage.sync.set({ templates: list }, () =>
      renderTemplateList(list),
    );
  });
}

function renderSnippetList(items) {
  const container = document.getElementById("snippet-list");
  container.innerHTML = "";
  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    const nameSpan = document.createElement("span");
    const nameBold = document.createElement("b");

    nameBold.textContent = item.name;
    nameSpan.appendChild(nameBold);

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "\u00D7";
    removeBtn.onclick = () => removeSnippet(index);

    div.appendChild(nameSpan);
    div.appendChild(removeBtn);
    container.appendChild(div);
  });
}

function removeSnippet(index) {
  chrome.storage.sync.get(["snippets"], (data) => {
    const list = data.snippets;
    list.splice(index, 1);
    chrome.storage.sync.set({ snippets: list }, () => renderSnippetList(list));
  });
}

// ── Modal (shared for create & edit) ─────────────────────────
const editModal = document.getElementById("edit-modal");
const modalInput = document.getElementById("modal-input");
const modalDetails = document.getElementById("modal-details");
const modalTitle = document.getElementById("modal-title");
const modalSaveBtn = document.getElementById("modal-save-btn");

let _modalMode = null; // "create" | "edit"
let _editCategory = null;
let _editIndex = null;

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function openModal({ mode, category, index = null, currentValue = "", currentDetails = "" }) {
  _modalMode = mode;
  _editCategory = category;
  _editIndex = index;

  modalTitle.textContent =
    mode === "create"
      ? `New ${capitalize(category)}`
      : `Edit ${capitalize(category)}`;

  modalSaveBtn.textContent = mode === "create" ? "Create" : "Save";

  modalInput.value = currentValue;
  modalDetails.value = currentDetails;
  editModal.classList.add("is-open");
  editModal.setAttribute("aria-hidden", "false");
  modalInput.focus();
  if (mode === "edit") modalInput.select();
}

// Keep backward-compatible alias used by renderList
function openEditModal(category, index, currentValue) {
  openModal({ mode: "edit", category, index, currentValue });
}

function closeEditModal() {
  editModal.classList.remove("is-open");
  editModal.setAttribute("aria-hidden", "true");
  modalInput.value = "";
  modalDetails.value = "";
  _modalMode = null;
  _editCategory = null;
  _editIndex = null;
}

function saveModal() {
  const value = modalInput.value.trim();
  if (!value || !_editCategory) return;

  if (_modalMode === "create") {
    chrome.storage.sync.get(_editCategory, (data) => {
      const list = data[_editCategory];
      list.push(value);
      chrome.storage.sync.set({ [_editCategory]: list }, () => {
        renderList(_editCategory, list);
        closeEditModal();
      });
    });
  } else {
    if (_editIndex === null) return;
    chrome.storage.sync.get(_editCategory, (data) => {
      const list = data[_editCategory];
      list[_editIndex] = value;
      chrome.storage.sync.set({ [_editCategory]: list }, () => {
        renderList(_editCategory, list);
        closeEditModal();
      });
    });
  }
}

document
  .getElementById("modal-cancel-btn")
  .addEventListener("click", closeEditModal);
modalSaveBtn.addEventListener("click", saveModal);

modalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveModal();
});

editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && editModal.classList.contains("is-open"))
    closeEditModal();
});
