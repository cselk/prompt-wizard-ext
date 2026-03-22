# Copilot instructions for Cito

## Build, test, and lint commands

- This repository has no package manager/test runner config (`package.json`, `Makefile`, `pytest`, etc.), so there are no built-in build/lint/test CLI commands.
- Validation workflow is manual:
  - Load unpacked extension from repo root in `chrome://extensions` (Developer mode).
  - Use the extension card's **Reload** button after changes.
  - Verify behavior in:
    - `popup.html` (Prompt Builder)
    - `options.html` (Preferences CRUD/import/export)
    - Supported hosts: `chatgpt.com`, `claude.ai`, `gemini.google.com`
- Single-test command: not available (no automated test suite in this repo).

## High-level architecture

- Manifest V3 extension (`manifest.json`) with three runtime surfaces:
  - Background service worker: `scripts/background.js`
  - Popup UI: `popup.html` + `scripts/popup.js`
  - Options UI: `options.html` + `scripts/options.js`
  - Content script on AI chat sites: `scripts/content.js`
- `background.js` seeds default storage only on first install via `chrome.runtime.onInstalled` (`details.reason === "install"`).
- `popup.js` reads stored building blocks, performs template token substitution, then injects final text into the active tab using `chrome.scripting.executeScript` and `document.execCommand("insertText")`.
- `content.js` renders a floating snippet bubble/menu, loads snippets from storage, and inserts snippet text into detected chat inputs using the same `execCommand("insertText")` approach.
- `options.js` is the source of truth for CRUD + import/export. It validates imported JSON shape before saving and re-renders lists after mutations.

## Key conventions specific to this codebase

- Storage schema is fixed and shared across scripts:
  - `persona` / `operator` / `format`: `Array<{name, details}>`
  - `templates` / `snippets`: `Array<{name, content}>`
- Keep schema changes synchronized across:
  - `scripts/background.js` defaults
  - `scripts/options.js` import validators and CRUD mapping
  - `scripts/popup.js` readers/token replacement
  - `scripts/content.js` snippet consumption
- Template token contract in popup:
  - Object tokens: `{{persona.name}}`, `{{persona.details}}` (same pattern for operator/format)
  - Scalar tokens: `{{input}}`, `{{context}}`, `{{constraint}}`
- Input insertion convention for host AI pages is selector-fallback + `execCommand("insertText")` (not direct `.value = ...`) to trigger host app listeners.
- For DOM built from user-controlled storage data, use safe DOM APIs (`createElement`, `textContent`, `dataset`) rather than HTML string injection.
- UI styling must follow `DESIGN_GUIDE.md`; always use CSS custom properties from `css/tokens.css` (no hardcoded colors).
- `content.css` relies on token variables and is loaded after `css/tokens.css` in `manifest.json` content script CSS order.
