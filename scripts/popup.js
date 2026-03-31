/**
 * @file popup.js
 * @description Controls the Cito Builder popup UI. Loads persona, operator,
 * format, and template data from chrome.storage.sync, renders custom dropdown
 * menus, and handles prompt generation by substituting template tokens with
 * the user's selections and free-text inputs before injecting the result into
 * the active tab's chat input field.
 *
 * Template token syntax
 * ─────────────────────
 * Object categories (persona, operator, format) expose two tokens each:
 *   {{persona.name}}     — the short display name of the selected persona
 *   {{persona.details}}  — the full instruction text of the selected persona
 *   (same pattern for operator and format)
 *
 * Scalar inputs use plain tokens:
 *   {{input}}      — the user's main input textarea value
 *   {{context}}    — the context textarea value
 *   {{constraint}} — the constraint input value
 */

/**
 * Accumulated selections from all custom dropdowns, keyed by category id.
 * - persona / operator / format: `{name: string, details: string}`
 * - templates: `string` (template name, used only for lookup)
 *
 * @type {Object}
 */
const promptData = {};

/** Full list of template objects loaded from storage, kept for name→content lookup. @type {Array<{name: string, content: string}>} */
let allTemplates = [];

/** Content string of the currently selected template. @type {string} */
let selectedTemplateContent = "";

/** Storage key used in chrome.storage.local for AI settings. @type {string} */
const AI_SETTINGS_LOCAL_KEY = "aiSettings";

/** Storage key used in chrome.storage.sync for popup enhancement toggle. @type {string} */
const AI_ENHANCEMENT_SYNC_KEY = "aiEnhancementEnabled";

/** Default OpenAI-compatible provider base URL used when none is configured. @type {string} */
const DEFAULT_AI_BASE_URL = "https://api.openai.com/v1";

/** Default model used for enhancement requests when none is configured. @type {string} */
const DEFAULT_AI_MODEL = "gpt-4o-mini";

/** Tooltip shown when AI features are unavailable without an API key. @type {string} */
const AI_ENHANCEMENT_TOOLTIP =
  "Add your API key in Settings to enable AI features";

/** Whether an API key is currently configured. @type {boolean} */
let hasAiApiKey = false;

/** Persisted user preference for AI enhancement toggle. @type {boolean} */
let isAiEnhancementEnabled = false;

/** AI provider settings loaded from local storage. */
let aiSettings = {
  apiKey: "",
  baseUrl: DEFAULT_AI_BASE_URL,
  model: DEFAULT_AI_MODEL,
};

/** System guidance used for prompt-enhancement requests. @type {string} */
const PROMPT_ENHANCEMENT_SYSTEM_PROMPT =
  "You are a prompt optimization assistant. Preserve the original intent and overall structure of the prompt. Improve only phrasing, specificity, and instruction quality. Do not rewrite it into a different format, do not remove constraints, and do not change the requested outcome. Return only the improved prompt text.";

/**
 * Normalizes base URL by trimming whitespace and trailing slashes.
 *
 * @param {string} baseUrl
 * @returns {string}
 */
function normalizeBaseUrl(baseUrl) {
  return (baseUrl || "").trim().replace(/\/+$/, "");
}

/**
 * Reads message text from OpenAI-compatible chat completion responses.
 *
 * @param {any} responseData
 * @returns {string}
 */
function extractEnhancedPrompt(responseData) {
  const message = responseData?.choices?.[0]?.message;
  if (!message) return "";

  if (typeof message.content === "string") {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

/**
 * Requests prompt enhancement from the configured OpenAI-compatible provider.
 * Returns the original prompt on failure to preserve existing behavior.
 *
 * @param {string} assembledPrompt
 * @returns {Promise<string>}
 */
async function enhancePromptWithAi(assembledPrompt) {
  const endpoint = `${normalizeBaseUrl(aiSettings.baseUrl)}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiSettings.apiKey}`,
      },
      body: JSON.stringify({
        model: aiSettings.model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: PROMPT_ENHANCEMENT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: assembledPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("AI enhancement request failed:", response.status, errorBody);
      alert("AI enhancement failed. Injecting original prompt instead.");
      return assembledPrompt;
    }

    const responseData = await response.json();
    const improvedPrompt = extractEnhancedPrompt(responseData);
    if (!improvedPrompt) {
      console.error("AI enhancement response did not include prompt text.");
      alert("AI enhancement returned an invalid response. Using original prompt.");
      return assembledPrompt;
    }

    return improvedPrompt;
  } catch (error) {
    console.error("AI enhancement request error:", error);
    alert("Could not reach AI provider. Injecting original prompt instead.");
    return assembledPrompt;
  }
}

/**
 * Injects text into the active tab's detected chat input field.
 *
 * @param {string} textToInject
 */
function injectPromptIntoActiveTab(textToInject) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (injectedText) => {
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
          document.execCommand("insertText", false, injectedText);
        } else {
          alert("Could not find an AI input field on this page.");
        }
      },
      args: [textToInject],
    });
  });
}

/**
 * Updates Craft Prompt button state for async enhancement progress.
 *
 * @param {boolean} isLoading
 */
function setCraftButtonLoadingState(isLoading) {
  const generateBtn = document.getElementById("generateBtn");
  if (!generateBtn) return;

  if (!generateBtn.dataset.defaultLabel) {
    generateBtn.dataset.defaultLabel = generateBtn.textContent || "Craft Prompt";
  }

  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading
    ? "Enhancing prompt..."
    : generateBtn.dataset.defaultLabel;
}

/**
 * Initializes AI enhancement toggle state from storage and wires persistence.
 * The toggle is disabled when no API key is configured in local settings.
 *
 * @param {boolean} initialEnabled - Persisted toggle state from sync storage.
 */
function initAiEnhancementToggle(initialEnabled) {
  const toggle = document.getElementById("aiEnhancementToggle");
  const row = document.getElementById("aiEnhancementRow");
  if (!toggle || !row) return;

  isAiEnhancementEnabled = Boolean(initialEnabled);
  toggle.checked = isAiEnhancementEnabled;

  toggle.addEventListener("change", () => {
    isAiEnhancementEnabled = toggle.checked;
    chrome.storage.sync.set({
      [AI_ENHANCEMENT_SYNC_KEY]: isAiEnhancementEnabled,
    });
  });

  chrome.storage.local.get([AI_SETTINGS_LOCAL_KEY], (data) => {
    const storedAiSettings = data[AI_SETTINGS_LOCAL_KEY] || {};
    const apiKey =
      typeof storedAiSettings.apiKey === "string"
        ? storedAiSettings.apiKey.trim()
        : "";
    const baseUrl =
      typeof storedAiSettings.baseUrl === "string" &&
      storedAiSettings.baseUrl.trim()
        ? normalizeBaseUrl(storedAiSettings.baseUrl)
        : DEFAULT_AI_BASE_URL;
    const model =
      typeof storedAiSettings.model === "string" && storedAiSettings.model.trim()
        ? storedAiSettings.model.trim()
        : DEFAULT_AI_MODEL;

    // Keep provider settings cached for the enhancement request.
    // API key remains optional for settings persistence, but required for toggle enablement.
    aiSettings = { apiKey, baseUrl, model };

    hasAiApiKey = Boolean(apiKey);

    if (!hasAiApiKey) {
      toggle.disabled = true;
      toggle.checked = false;
      row.setAttribute("title", AI_ENHANCEMENT_TOOLTIP);
      toggle.setAttribute("title", AI_ENHANCEMENT_TOOLTIP);
    } else {
      toggle.disabled = false;
      row.removeAttribute("title");
      toggle.removeAttribute("title");
      toggle.checked = isAiEnhancementEnabled;
    }
  });
}

/**
 * Creates a single `.custom-option` div element using safe DOM APIs so that
 * user-controlled strings are never parsed as HTML.
 *
 * @param {number} index   - Position in the list; index 0 receives the "selected" class.
 * @param {string} value   - Value stored in `data-value` (the item's name).
 * @param {string} label   - Visible text content of the option.
 * @param {string} [details] - Optional value stored in `data-details` (omitted for templates).
 * @returns {HTMLDivElement}
 */
function createOptionEl(index, value, label, details) {
  const div = document.createElement("div");
  div.className = "custom-option" + (index === 0 ? " selected" : "");
  div.setAttribute("data-value", value);
  div.setAttribute("tabindex", "0");
  div.setAttribute("role", "option");
  div.setAttribute("aria-selected", index === 0 ? "true" : "false");
  if (details !== undefined) div.setAttribute("data-details", details);
  div.textContent = label;
  return div;
}

document.addEventListener("DOMContentLoaded", () => {
  const categories = ["persona", "operator", "format"];

  chrome.storage.sync.get(
    ["persona", "operator", "format", "templates", AI_ENHANCEMENT_SYNC_KEY],
    (data) => {
      initAiEnhancementToggle(data[AI_ENHANCEMENT_SYNC_KEY]);

      categories.forEach((cat) => {
        const list = data[cat] || [];
        const container = document.querySelector(
          `[data-id="${cat}"] .custom-options`,
        );
        const triggerSpan = document.querySelector(
          `[data-id="${cat}"] .select-trigger span`,
        );

        if (container && list.length > 0) {
          container.innerHTML = "";
          list.forEach((item, i) => {
            container.appendChild(
              createOptionEl(i, item.name, item.name, item.details || ""),
            );
          });

          triggerSpan.textContent = list[0].name;
          promptData[cat] = {
            name: list[0].name,
            details: list[0].details || "",
          };
        } else {
          console.warn(`No data or container found for category: ${cat}`);
        }
      });

      const templateList = data.templates;
      allTemplates = templateList;

      const container = document.querySelector(
        `[data-id="templates"] .custom-options`,
      );
      const triggerSpan = document.querySelector(
        `[data-id="templates"] .select-trigger span`,
      );

      container.innerHTML = "";
      templateList.forEach((t, i) => {
        container.appendChild(createOptionEl(i, t.name, t.name));
      });

      triggerSpan.textContent = templateList[0].name;
      selectedTemplateContent = templateList[0].content;

      // Initialize click listeners after elements are injected
      initCustomSelects();
    },
  );
});

/**
 * Attaches click listeners to all `.select-trigger` and `.custom-options`
 * elements. Existing listeners are removed first by replacing each trigger
 * with a deep clone, preventing duplicate handlers when this function is
 * called after a re-render.
 *
 * For object categories (persona, operator, format) the selected item is
 * stored in `promptData` as `{name, details}`. For the templates category
 * only the name string is stored; the matching content is read from
 * `allTemplates` and assigned to `selectedTemplateContent`.
 */
function initCustomSelects() {
  // Replace triggers to remove any existing listeners before re-attaching
  document.querySelectorAll(".select-trigger").forEach((trigger) => {
    trigger.replaceWith(trigger.cloneNode(true));
  });

  document.querySelectorAll(".select-trigger").forEach((trigger) => {
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("role", "button");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", (e) => {
      const parent = trigger.parentElement;
      // Close others
      document.querySelectorAll(".custom-select").forEach((s) => {
        if (s !== parent) {
          s.classList.remove("open");
          s.querySelector(".select-trigger")?.setAttribute("aria-expanded", "false");
        }
      });
      const isOpen = parent.classList.toggle("open");
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      e.stopPropagation();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        trigger.click();
      }
    });
  });

  // Option Clicks (using Event Delegation)
  document.querySelectorAll(".custom-options").forEach((menu) => {
    menu.setAttribute("role", "listbox");
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
        .forEach((opt) => {
          opt.classList.remove("selected");
          opt.setAttribute("aria-selected", "false");
        });
      option.classList.add("selected");
      option.setAttribute("aria-selected", "true");

      if (cat === "templates") {
        promptData[cat] = val;
      } else {
        promptData[cat] = {
          name: val,
          details: option.getAttribute("data-details") || "",
        };
      }

      option.closest(".custom-select").classList.remove("open");
      option
        .closest(".custom-select")
        .querySelector(".select-trigger")
        ?.setAttribute("aria-expanded", "false");
    });

    menu.addEventListener("keydown", (e) => {
      const option = e.target.closest(".custom-option");
      if (!option) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        option.click();
      }
    });
  });
}

// Close on outside click
document.addEventListener("click", () => {
  document.querySelectorAll(".custom-select").forEach((s) => {
    s.classList.remove("open");
    s.querySelector(".select-trigger")?.setAttribute("aria-expanded", "false");
  });
});

/**
 * Handles the "Craft Prompt" button click. Reads the current selections from
 * `promptData` and the scalar text inputs, then performs two passes of token
 * substitution on `selectedTemplateContent`:
 *
 * 1. `{{category.name}}` / `{{category.details}}` for persona, operator, format.
 * 2. `{{input}}`, `{{context}}`, `{{constraint}}` for free-text fields.
 *
 * The resulting string is injected into the active tab's chat input via
 * `chrome.scripting.executeScript`, using `execCommand("insertText")` so that
 * the host page's input event listeners fire correctly. If AI enhancement is
 * enabled, the assembled prompt is first sent to the configured provider and
 * the improved version is injected.
 */
document.getElementById("generateBtn").addEventListener("click", async () => {
  const persona = promptData.persona || { name: "Expert", details: "" };
  const operator = promptData.operator || { name: "Assist", details: "" };
  const format = promptData.format || { name: "Plain Text", details: "" };

  let templateText = selectedTemplateContent;

  if (!templateText) {
    alert("Please select a template first.");
    return;
  }

  // Substitute {{category.field}} tokens for object-type categories
  [
    ["persona", persona],
    ["operator", operator],
    ["format", format],
  ].forEach(([key, obj]) => {
    templateText = templateText.replace(
      new RegExp(`{{${key}\\.name}}`, "g"),
      obj.name,
    );
    templateText = templateText.replace(
      new RegExp(`{{${key}\\.details}}`, "g"),
      obj.details,
    );
  });

  // Substitute plain {{token}} for scalar inputs
  const scalarInput = {
    input: document.getElementById("input").value || "",
    context:
      document.getElementById("context").value || "No additional context.",
    constraint: document.getElementById("constraint").value || "None.",
  };
  Object.entries(scalarInput).forEach(([key, val]) => {
    templateText = templateText.replace(new RegExp(`{{${key}}}`, "g"), val);
  });

  let promptToInject = templateText;
  const shouldEnhance = hasAiApiKey && isAiEnhancementEnabled;

  if (shouldEnhance) {
    setCraftButtonLoadingState(true);
  }

  try {
    if (shouldEnhance) {
      promptToInject = await enhancePromptWithAi(templateText);
    }
    injectPromptIntoActiveTab(promptToInject);
  } finally {
    if (shouldEnhance) {
      setCraftButtonLoadingState(false);
    }
  }
});
