# Cito — AI Prompt Manager

Cito is a browser extension that helps you craft better prompts and reuse your best ones — without ever leaving ChatGPT, Claude, or Gemini.

Instead of typing the same context over and over, Cito lets you build structured prompts from reusable building blocks (personas, operators, formats) and fire them directly into the AI chat input with one click. A floating snippet button also lets you insert saved prompt fragments on the fly.

---

## Features

- **Prompt Builder** — Compose prompts using a template + persona + operator + format structure, with input, context, and constraint fields
- **Template Gallery** — Save and reuse your own prompt templates with `{{variable}}` placeholders
- **Snippet Menu** — A floating button inside ChatGPT, Claude, and Gemini that lets you click-to-insert saved prompt snippets
- **Custom Personas, Operators & Formats** — Build up your own library of reusable prompt components in settings
- Works across **ChatGPT**, **Claude**, and **Gemini**

---

## Installation

Cito is a Chrome extension loaded manually (unpacked). You'll need Chrome or any Chromium-based browser (Edge, Brave, Arc, etc.).

1. Download or clone this repository to your computer
2. Open your browser and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the root folder of this repository (the one containing `manifest.json`)
6. The Cito icon will appear in your browser toolbar

> **Tip:** Pin the extension for easy access by clicking the puzzle-piece icon in the toolbar and pinning Cito.

---

## Setup

Before using the Prompt Builder, add your reusable building blocks via the **Settings** page:

1. Click the Cito icon in your toolbar
2. Open **Settings** (or right-click the extension icon → *Options*)
3. Add your **Personas** — the role you want the AI to adopt (e.g. *Senior Architect*, *UX Copywriter*)
4. Add your **Operators** — the action you want performed (e.g. *Debug Code*, *Write a Summary*)
5. Add your **Formats** — how you want the output structured (e.g. *Bullet Points*, *JSON*, *Plain Text*)
6. Optionally create custom **Templates** using `{{persona}}`, `{{operator}}`, `{{input}}`, `{{context}}`, `{{constraint}}`, and `{{format}}` as placeholders
7. Add **Snippets** — short, reusable prompt fragments you want to insert quickly while chatting

A default *Standard* template and a few starter snippets are included out of the box.

---

## Usage

### Building a Prompt

1. Navigate to ChatGPT, Claude, or Gemini (or open the popup from any tab)
2. Click the **Cito** icon in your toolbar
3. Select a **Template**, **Persona**, **Operator**, and **Format** from the dropdowns
4. Fill in the **Input** (what you want done) and optionally add **Context** and a **Constraint**
5. Click **Craft Prompt** — Cito will inject the fully assembled prompt directly into the chat input
6. Review and hit Send

### Using the Snippet Menu

While you're on ChatGPT, Claude, or Gemini, a small **Cito bubble** floats near the send button:

1. Click the bubble to open your snippet menu
2. Click any snippet to instantly insert it into the chat input
3. Click anywhere else to dismiss the menu

---

## Default Content

Cito ships with a few defaults to get you started:

| Type | Name | Description |
|------|------|-------------|
| Template | Standard | A structured system-prompt template with persona, task, context, constraints, and output format sections |
| Snippet | Fix Grammar | Prompts the AI to correct grammar and flow |
| Snippet | Review Code | Asks the AI to analyze code for bugs and efficiency |
| Snippet | Summarize | Requests a 3-bullet-point summary |

All defaults can be replaced or extended from the Settings page.
