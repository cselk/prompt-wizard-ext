const promptData = {};

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
