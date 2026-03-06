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
      addItem(category);
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
    div.innerHTML = `
            <span>${item}</span>
            <div>
              <span class="edit-btn" data-index="${index}" data-category="${category}">
                <img src="assets/edit.svg" class="icon" alt="">
              </span>
              <span class="remove-btn" data-index="${index}" data-category="${category}">
                <img src="assets/trash.svg" class="icon" alt="">
              </span>
            </div>
        `;
    container.appendChild(div);
  });

  container.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const cat = e.target.getAttribute("data-category");
      const idx = parseInt(e.target.getAttribute("data-index"));
      removeItem(cat, idx);
    });
  });

  container.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const item = e.currentTarget.closest(".item");
      const itemText = item.querySelector("span").textContent;
      openEditModal(itemText);
    });
  });
}

function addItem(category) {
  const input = document.getElementById(`new-${category}`);
  const newItem = input.value.trim();
  if (!newItem) return;

  chrome.storage.sync.get(category, (data) => {
    const list = data[category];
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

// ── Edit Modal ────────────────────────────────────────────────
const editModal = document.getElementById("edit-modal");
const modalInput = document.getElementById("modal-input");

function openEditModal(currentValue) {
  modalInput.value = currentValue ?? "";
  editModal.classList.add("is-open");
  editModal.setAttribute("aria-hidden", "false");
  modalInput.focus();
}

function closeEditModal() {
  editModal.classList.remove("is-open");
  editModal.setAttribute("aria-hidden", "true");
}

document.getElementById("modal-cancel-btn").addEventListener("click", closeEditModal);
document.getElementById("modal-save-btn").addEventListener("click", closeEditModal);

editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && editModal.classList.contains("is-open")) closeEditModal();
});
