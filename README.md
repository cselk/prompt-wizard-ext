# Cito — AI Prompt Manager

**Version 1.6.4** · Chrome / Chromium extension (Manifest V3)

Cito is a browser extension that eliminates repetitive prompt writing on ChatGPT, Claude, and Gemini. Build structured prompts from reusable building blocks, inject them into any chat with one click, and keep a library of snippets just a bubble-click away — all without ever leaving the page.

---

## How it works

Cito has two main surfaces:

| Surface | How to open | What it does |
|---|---|---|
| **Popup (Prompt Builder)** | Click the Cito toolbar icon | Assembles a full prompt from your saved building blocks and injects it into the active chat |
| **Floating bubble** | Appears automatically on ChatGPT, Claude, and Gemini | Opens your snippet library so you can insert a saved fragment at the cursor |

---

## Features

### Prompt Builder
The popup combines five selectable building blocks with three free-text fields to produce a finished prompt:

- **Template** — the structural scaffold, written with `{{token}}` placeholders
- **Persona** — the role the AI should adopt (e.g. *Senior Architect*, *UX Copywriter*)
- **Operator** — the task to perform (e.g. *Debug Code*, *Write a Summary*)
- **Format** — the desired output structure (e.g. *Bullet Points*, *JSON*, *Plain Text*)
- **Input** — the core request (required)
- **Context** *(optional)* — background information for the AI
- **Constraint** *(optional)* — limits or rules to follow

Click **Craft Prompt** and Cito substitutes every token and injects the result directly into the chat input field.  
When **AI Enhancement** is enabled, Cito first sends the assembled prompt to your configured OpenAI-compatible provider (`/chat/completions`) and injects the improved result.

#### Template token syntax

| Token | Replaced with |
|---|---|
| `{{persona.name}}` | Display name of the selected persona |
| `{{persona.details}}` | Full instruction text of the selected persona |
| `{{operator.name}}` / `{{operator.details}}` | Same for the selected operator |
| `{{format.name}}` / `{{format.details}}` | Same for the selected format |
| `{{input}}` | The Input field value |
| `{{context}}` | The Context field value |
| `{{constraint}}` | The Constraint field value |

### Floating Snippet Bubble
A small **Cito bubble** is injected next to the send button on every supported page. Click it to open a menu of your saved snippets — click any snippet to insert its content at the cursor, then dismiss the menu by clicking outside.

### Settings Page
Manage all your reusable content from one place (`chrome://extensions` → Cito → *Options*, or right-click the toolbar icon):

- **AI Settings** — save your OpenAI-compatible provider config (**API key**, **Base URL**, **Model**) with a masked show/hide key input. Values are stored in `chrome.storage.local` only (device-local, never synced). The popup **AI Enhancement** toggle is disabled until a key is present.
- **CRUD for Personas, Operators, and Formats** — create, rename, and delete items; each has a *Name* and a *Details* (instruction) field
- **Template Library** — write templates with `{{token}}` placeholders; both *Name* and *Content* fields are required
- **Snippet Library** — short reusable fragments; both *Name* and *Content* fields are required
- **Export / Import** — download all settings as `cito-settings.json` or restore them from a file; the importer validates structure before writing anything
- **Toast notifications** — every create, update, and delete action surfaces a brief success or error banner in the lower-right corner

---

## Installation

Cito is loaded as an unpacked extension. You'll need Chrome or any Chromium-based browser (Edge, Brave, Arc, etc.).

1. Download or clone this repository
2. Go to `chrome://extensions` in your browser
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the repository root (the folder containing `manifest.json`)
5. The Cito icon appears in your toolbar

> **Tip:** Pin the extension via the puzzle-piece icon for quick access.

---

## Quick-start

1. Open **Settings** and create at least one Persona, Operator, Format, and Template
2. Navigate to ChatGPT, Claude, or Gemini
3. Click the **Cito** toolbar icon
4. Choose your building blocks from the dropdowns, fill in the Input field, and click **Craft Prompt**
5. Cito injects the assembled prompt — review it and hit Send

---

## Default content

Cito ships with the following defaults so you can use it immediately:

| Type | Name | Description |
|---|---|---|
| Template | Standard | Structured system-prompt with persona, task, context, constraints, and output format sections |
| Snippet | Fix Grammar | Asks the AI to correct grammar and improve flow |
| Snippet | Review Code | Asks the AI to analyse code for bugs and efficiency |
| Snippet | Summarize | Requests a concise 3-bullet-point summary |

All defaults can be edited or deleted from the Settings page.

---

## Supported platforms

| Platform | Prompt Builder | Floating Bubble |
|---|---|---|
| ChatGPT (`chatgpt.com`) | ✅ | ✅ |
| Claude (`claude.ai`) | ✅ | ✅ |
| Gemini (`gemini.google.com`) | ✅ | ✅ |
