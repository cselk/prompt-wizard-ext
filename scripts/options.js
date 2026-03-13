/**
 * @file options.js
 * @description Controls the Cito Preferences page (options.html). Handles
 * rendering and CRUD operations for the three prompt-builder categories
 * (persona, operator, format) as well as the template gallery and snippet
 * manager. All category mutations go through a shared modal that supports
 * both "create" and "edit" modes.
 */

/** Category keys that use the shared `{name, details}` item schema. @type {string[]} */
const categories = ["persona", "operator", "format"];

/**
 * Reads all settings from chrome.storage.sync and triggers a browser download
 * of the data as a formatted JSON file named `cito-settings.json`.
 */
function exportSettings() {
  const allKeys = [...categories, "templates", "snippets"];
  chrome.storage.sync.get(allKeys, (data) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cito-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  });
}

/**
 * Validates and imports settings from a parsed JSON object, writing all
 * recognised keys to chrome.storage.sync and re-rendering every list.
 * Unknown keys are ignored; malformed arrays are rejected with an error alert.
 *
 * Expected shape mirrors the storage schema in background.js:
 *   persona/operator/format — Array<{name: string, details: string}>
 *   templates/snippets      — Array<{name: string, content: string}>
 *
 * @param {object} data - Parsed JSON object from the imported file.
 */
function importSettings(data) {
  const categorySchema = (item) =>
    item && typeof item.name === "string" && typeof item.details === "string";
  const contentSchema = (item) =>
    item && typeof item.name === "string" && typeof item.content === "string";

  const validators = {
    persona: categorySchema,
    operator: categorySchema,
    format: categorySchema,
    templates: contentSchema,
    snippets: contentSchema,
  };

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    alert("Import failed: no recognisable settings found in the file.");
    return;
  }

  const toSave = {};
  for (const [key, validate] of Object.entries(validators)) {
    if (!(key in data)) continue;
    const list = data[key];
    if (!Array.isArray(list) || list.length === 0 || !list.every(validate)) {
      alert(`Import failed: "${key}" is missing or has an invalid format.`);
      return;
    }
    toSave[key] = list;
  }

  if (Object.keys(toSave).length === 0) {
    alert("Import failed: no recognisable settings found in the file.");
    return;
  }

  chrome.storage.sync.set(toSave, () => {
    chrome.storage.sync.get(
      [...categories, "templates", "snippets"],
      (saved) => {
        categories.forEach((cat) => {
          if (saved[cat]) renderList(cat, saved[cat]);
        });
        if (saved.templates) renderTemplateList(saved.templates);
        if (saved.snippets) renderSnippetList(saved.snippets);
      },
    );
  });
}

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

  document
    .getElementById("export-btn")
    .addEventListener("click", exportSettings);

  const importFileInput = document.getElementById("import-file-input");
  document.getElementById("import-btn").addEventListener("click", () => {
    importFileInput.value = "";
    importFileInput.click();
  });
  importFileInput.addEventListener("change", () => {
    const file = importFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        importSettings(data);
      } catch {
        alert("Import failed: the file is not valid JSON.");
      }
    };
    reader.readAsText(file);
  });
});

/**
 * Renders the item list for a single category into its corresponding
 * `#<category>-list` container. Each item gets an edit button (which opens
 * the shared modal pre-filled with the item's current values) and a remove
 * button. All text is set via `textContent` / `dataset` to prevent XSS.
 *
 * @param {string} category - One of "persona", "operator", or "format".
 * @param {Array<{name: string, details: string}>} items - Items to render.
 */
function renderList(category, items) {
  const container = document.getElementById(`${category}-list`);
  if (!container) return;

  container.innerHTML = "";
  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    // use textContent for untrusted text to avoid HTML injection
    const label = document.createElement("span");
    label.textContent = item.name;

    const controls = document.createElement("div");

    const editBtn = document.createElement("span");
    editBtn.className = "edit-btn";
    editBtn.dataset.index = String(index);
    editBtn.dataset.category = String(category);
    editBtn.dataset.details = item.details || "";

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
      const itemName = e.currentTarget
        .closest(".item")
        .querySelector("span").textContent;
      const itemDetails = e.currentTarget.dataset.details || "";
      openEditModal(category, index, itemName, itemDetails);
    });
  });
}

/**
 * Removes the item at `index` from the given category in storage and
 * re-renders the list. Refuses to remove the last remaining item.
 *
 * @param {string} category - Category key in chrome.storage.sync.
 * @param {number} index    - Zero-based index of the item to remove.
 */
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

/**
 * Renders the template gallery list with edit and remove icon buttons,
 * matching the same hover-reveal style as the category lists.
 *
 * @param {Array<{name: string, content: string}>} items - Templates to render.
 */
function renderTemplateList(items) {
  const container = document.getElementById("template-list");
  container.innerHTML = "";
  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    const label = document.createElement("span");
    label.textContent = item.name;

    const controls = document.createElement("div");

    const editBtn = document.createElement("span");
    editBtn.className = "edit-btn";
    editBtn.dataset.index = String(index);
    editBtn.dataset.category = "template";
    editBtn.dataset.content = item.content || "";

    const editImg = document.createElement("img");
    editImg.src = "assets/edit.svg";
    editImg.className = "icon";
    editImg.alt = "";
    editBtn.appendChild(editImg);

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-btn";
    removeBtn.dataset.index = String(index);

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
      if (items.length <= 1) {
        return;
      }

      const idx = parseInt(e.currentTarget.dataset.index);
      removeTemplate(idx);
    });
  });

  container.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      const itemName = e.currentTarget
        .closest(".item")
        .querySelector("span").textContent;
      const itemContent = e.currentTarget.dataset.content || "";
      openModal({
        mode: "edit",
        category: "template",
        index,
        currentValue: itemName,
        currentDetails: itemContent,
      });
    });
  });
}

/**
 * Removes the template at `index` from storage and re-renders the gallery.
 *
 * @param {number} index - Zero-based index of the template to remove.
 */
function removeTemplate(index) {
  chrome.storage.sync.get(["templates"], (data) => {
    const list = data.templates;
    list.splice(index, 1);
    chrome.storage.sync.set({ templates: list }, () =>
      renderTemplateList(list),
    );
  });
}

/**
 * Renders the snippet manager list with edit and remove icon buttons,
 * matching the same hover-reveal style as the category lists.
 *
 * @param {Array<{name: string, content: string}>} items - Snippets to render.
 */
function renderSnippetList(items) {
  const container = document.getElementById("snippet-list");
  container.innerHTML = "";
  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    const label = document.createElement("span");
    label.textContent = item.name;

    const controls = document.createElement("div");

    const editBtn = document.createElement("span");
    editBtn.className = "edit-btn";
    editBtn.dataset.index = String(index);
    editBtn.dataset.category = "snippet";
    editBtn.dataset.content = item.content || "";

    const editImg = document.createElement("img");
    editImg.src = "assets/edit.svg";
    editImg.className = "icon";
    editImg.alt = "";
    editBtn.appendChild(editImg);

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-btn";
    removeBtn.dataset.index = String(index);

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
      if (items.length <= 1) {
        return;
      }

      const idx = parseInt(e.currentTarget.dataset.index);
      removeSnippet(idx);
    });
  });

  container.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      const itemName = e.currentTarget
        .closest(".item")
        .querySelector("span").textContent;
      const itemContent = e.currentTarget.dataset.content || "";
      openModal({
        mode: "edit",
        category: "snippet",
        index,
        currentValue: itemName,
        currentDetails: itemContent,
      });
    });
  });
}

/**
 * Removes the snippet at `index` from storage and re-renders the list.
 *
 * @param {number} index - Zero-based index of the snippet to remove.
 */
function removeSnippet(index) {
  chrome.storage.sync.get(["snippets"], (data) => {
    const list = data.snippets;
    list.splice(index, 1);
    chrome.storage.sync.set({ snippets: list }, () => renderSnippetList(list));
  });
}

// ── Modal (shared for create & edit) ─────────────────────────

/** @type {HTMLElement} The modal overlay element. */
const editModal = document.getElementById("edit-modal");
/** @type {HTMLInputElement} The name text input inside the modal. */
const modalInput = document.getElementById("modal-input");
/** @type {HTMLTextAreaElement} The details/content textarea inside the modal. */
const modalDetails = document.getElementById("modal-details");
/** @type {HTMLElement} The label element for the details/content textarea. */
const modalDetailsLabel = document.getElementById("modal-details-label");
/** @type {HTMLElement} The modal's `<h3>` title element. */
const modalTitle = document.getElementById("modal-title");
/** @type {HTMLButtonElement} The modal's primary action button. */
const modalSaveBtn = document.getElementById("modal-save-btn");

/** @type {"create"|"edit"|null} Current modal mode. */
let _modalMode = null;
/** @type {string|null} Category key the modal is currently operating on. */
let _editCategory = null;
/** @type {number|null} Index of the item being edited, or null in create mode. */
let _editIndex = null;

/**
 * Capitalises the first character of a string.
 *
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Per-category placeholder text shown in the modal's name and details/content
 * fields. Placeholders are concrete examples that illustrate the expected
 * input, making clear that `details`/`content` is the text later injected
 * into the template.
 *
 * @type {Object.<string, {name: string, details: string}>}
 */
const modalPlaceholders = {
  persona: {
    name: "e.g. Senior Developer",
    details:
      "e.g. A senior software engineer specialized in distributed systems. Prioritise clarity, correctness, and idiomatic code.",
  },
  operator: {
    name: "e.g. Summarize",
    details:
      "e.g. Condense the following into the 3 most important points, using plain language suitable for a non-technical audience.",
  },
  format: {
    name: "e.g. Bullet Points",
    details:
      "e.g. Present the output as a concise bulleted list. Each point must be a single sentence and start with a strong action verb.",
  },
  template: {
    name: "e.g. Code Reviewer",
    details:
      'e.g. # ROLE\nYou are a {{persona.name}}. {{persona.details}}\n\n# TASK\n{{operator.details}}\n\nInput: "{{input}}"',
  },
  snippet: {
    name: "e.g. 3-bullet Summary",
    details:
      "e.g. Summarize the following into exactly 3 bullet points, each starting with a bold keyword: ",
  },
};

/**
 * Opens the shared modal in either "create" or "edit" mode and populates it
 * with the correct title, button label, placeholders, and pre-filled values.
 * For templates and snippets the second field is labelled "Content" and given
 * extra height; for categories it is labelled "Details".
 *
 * @param {object}  opts
 * @param {"create"|"edit"} opts.mode          - Whether this is a new item or editing an existing one.
 * @param {string}  opts.category              - Category key (e.g. "persona", "template").
 * @param {number|null} [opts.index=null]      - Index of the item to edit (edit mode only).
 * @param {string}  [opts.currentValue=""]     - Pre-fill value for the name field (edit mode).
 * @param {string}  [opts.currentDetails=""]   - Pre-fill value for the details/content field (edit mode).
 */
function openModal({
  mode,
  category,
  index = null,
  currentValue = "",
  currentDetails = "",
}) {
  _modalMode = mode;
  _editCategory = category;
  _editIndex = index;

  modalTitle.textContent =
    mode === "create"
      ? `New ${capitalize(category)}`
      : `Edit ${capitalize(category)}`;

  modalSaveBtn.textContent = mode === "create" ? "Create" : "Save";

  const isContentType = category === "template" || category === "snippet";
  modalDetailsLabel.textContent = isContentType ? "Content" : "Details";
  modalDetails.style.minHeight = isContentType ? "160px" : "";

  const placeholders = modalPlaceholders[category] || { name: "", details: "" };
  modalInput.placeholder = placeholders.name;
  modalDetails.placeholder = placeholders.details;

  modalInput.value = currentValue;
  modalDetails.value = currentDetails;
  editModal.classList.add("is-open");
  editModal.setAttribute("aria-hidden", "false");
  modalInput.focus();
  if (mode === "edit") modalInput.select();
}

/**
 * Convenience wrapper around `openModal` for edit mode, used by `renderList`.
 *
 * @param {string} category       - Category key.
 * @param {number} index          - Index of the item to edit.
 * @param {string} currentValue   - Current name of the item.
 * @param {string} [currentDetails=""] - Current details of the item.
 */
// Keep backward-compatible alias used by renderList
function openEditModal(category, index, currentValue, currentDetails = "") {
  openModal({ mode: "edit", category, index, currentValue, currentDetails });
}

/** Closes the modal, resets both input fields, and clears modal state. */
function closeEditModal() {
  editModal.classList.remove("is-open");
  editModal.setAttribute("aria-hidden", "true");
  modalInput.value = "";
  modalDetails.value = "";
  modalDetails.style.minHeight = "";
  _modalMode = null;
  _editCategory = null;
  _editIndex = null;
}

/**
 * Reads the modal's name and details/content fields and persists the item to
 * chrome.storage.sync. Templates and snippets are stored under the plural keys
 * "templates"/"snippets" with a `content` field; categories use their own key
 * with a `details` field. The list is re-rendered and the modal closed on success.
 */
function saveModal() {
  const name = modalInput.value.trim();
  const details = modalDetails.value.trim();
  if (!name || !_editCategory) return;

  const isContentType =
    _editCategory === "template" || _editCategory === "snippet";
  if (isContentType && !details) return;
  const storageKey =
    _editCategory === "template"
      ? "templates"
      : _editCategory === "snippet"
        ? "snippets"
        : _editCategory;
  const itemValue = isContentType
    ? { name, content: details }
    : { name, details };

  const rerender = (list) => {
    if (_editCategory === "template") renderTemplateList(list);
    else if (_editCategory === "snippet") renderSnippetList(list);
    else renderList(_editCategory, list);
  };

  if (_modalMode === "create") {
    chrome.storage.sync.get(storageKey, (data) => {
      const list = data[storageKey];
      list.push(itemValue);
      chrome.storage.sync.set({ [storageKey]: list }, () => {
        rerender(list);
        closeEditModal();
      });
    });
  } else {
    if (_editIndex === null) return;
    chrome.storage.sync.get(storageKey, (data) => {
      const list = data[storageKey];
      list[_editIndex] = itemValue;
      chrome.storage.sync.set({ [storageKey]: list }, () => {
        rerender(list);
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
