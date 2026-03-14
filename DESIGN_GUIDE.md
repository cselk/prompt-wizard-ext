# Cito — Design Guide

This document is the single source of truth for Cito's visual language. All UI surfaces — popup, options page, and content script — must follow these rules. When in doubt, refer here before writing any CSS.

---

## 1. Core Aesthetic

Cito is a **dark, minimal productivity tool**. The visual language should feel calm, focused, and professional — not flashy. Avoid decorative effects. Every element should earn its place.

- Dark zinc-gray backgrounds with a single blue accent
- Flat surfaces — no gradients, no shadows on content elements
- Subtle borders that define structure without demanding attention
- Motion only where it communicates state change, never for decoration

---

## 2. Color Tokens

These are the canonical token names. All CSS files must use these variables — never hardcode color values.

```css
:root {
  /* Backgrounds / Surfaces */
  --surface-base:    #242424;   /* Page background, input backgrounds */
  --surface-raised:  #303030;   /* Cards, list items, modals */
  --surface-overlay: #27272a;   /* Dropdowns, floating menus */

  /* Text */
  --text-primary:    #f4f4f5;   /* Body text, headings */
  --text-muted:      #a1a1aa;   /* Labels, placeholders, secondary info */

  /* Accent */
  --accent:          #6aacea;   /* Buttons, links, focus rings, section headings */
  --accent-hover:    #97cbfb;   /* Hover state for interactive accent elements */

  /* Borders */
  --border:          #3f3f46;   /* All borders and dividers */

  /* Status */
  --status-success-bg:     #166534;
  --status-success-border: #16a34a;
  --status-error-bg:       #7f1d1d;
  --status-error-border:   #dc2626;
  --status-destructive:    #ef4444;  /* Delete/remove actions */
}
```

### Surface Hierarchy

| Layer | Token | Use case |
|---|---|---|
| Base | `--surface-base` | Page background, all input fields |
| Raised | `--surface-raised` | Cards, list items, modals, drawers |
| Overlay | `--surface-overlay` | Dropdowns, floating menus, tooltips |

Never use a surface token on a layer below it — overlays sit on top of raised surfaces, raised surfaces sit on top of base. Reversing this flattens the hierarchy.

### Accent Usage

`--accent` is the interactive color. Use it for:
- Primary buttons
- Focus rings
- Section headings (`h2`)
- The floating bubble
- Active/selected states

Do **not** use it for decorative purposes or large background fills. It should signal "you can interact with this."

---

## 3. Typography

**Font stack:** `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### Type Scale

| Name | Size | Weight | Use |
|---|---|---|---|
| `--text-xs` | `0.6875rem` (11px) | 700 | All-caps labels, field labels |
| `--text-sm` | `0.8125rem` (13px) | 400 | Input values, option list items |
| `--text-base` | `0.875rem` (14px) | 400 | Body text, descriptions |
| `--text-md` | `1rem` (16px) | 600 | Subheadings, item names |
| `--text-lg` | `1.125rem` (18px) | 600 | Popup heading (`h3`) |
| `--text-section` | `1rem` (16px) | 700 | Section headings (`h2`, uppercase) |

### Rules

- Use `rem` for all font sizes — never `px` in type declarations
- Labels above inputs are **always uppercase + letter-spaced** at `--text-xs`, `font-weight: 700`, color `--text-muted`
- `h2` section headings use `--accent`, uppercase, `--text-section`
- Monospace font (`font-family: monospace`) is only permitted on fields that accept template syntax with `{{tokens}}` — not on general text areas like snippets or persona details

---

## 4. Spacing

No magic numbers. Use this scale for all padding, margin, and gap values:

| Token | Value | Common use |
|---|---|---|
| `--space-1` | `4px` | Icon padding, tight gaps |
| `--space-2` | `6px` | Button padding (vertical), small gaps |
| `--space-3` | `8px` | Gap between related elements |
| `--space-4` | `12px` | List item padding, input padding |
| `--space-5` | `14px` | Field group margin-bottom |
| `--space-6` | `16px` | Modal gap, standard padding |
| `--space-8` | `20px` | Section padding |
| `--space-10` | `24px` | Modal padding, page section vertical padding |
| `--space-12` | `40px` | Page-level padding |

---

## 5. Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `4px` | Chips, small badges |
| `--radius-md` | `6px` | Buttons, inputs, list items |
| `--radius-lg` | `8px` | Popup inputs, dropdown options |
| `--radius-xl` | `10px` | Modals |
| `--radius-2xl` | `12px` | Snippet menu, floating cards |
| `--radius-full` | `50%` | Circular elements (floating bubble) |

Do not mix radii arbitrarily. Inputs and buttons always use `--radius-md` or `--radius-lg`. Containers (modals, menus) use `--radius-xl` or `--radius-2xl`.

---

## 6. Interactive States

Every interactive element must implement all four states:

| State | Treatment |
|---|---|
| Default | As defined |
| Hover | `--accent-hover` for accent elements; lightened surface for neutral elements |
| Focus | `border-color: --accent` + `box-shadow: 0 0 0 2px rgba(106, 172, 234, 0.2)` |
| Active | `transform: scale(0.98)` on buttons |
| Disabled | `opacity: 0.5`, `cursor: not-allowed` |

Focus styles must **never be removed** without a visible replacement — keyboard accessibility is non-negotiable.

---

## 7. Buttons

### Primary Button
- Background: `--accent`
- Text: `--text-primary`, `font-weight: 600`
- Padding: `10px 15px`
- Border radius: `--radius-md`
- Hover: `--accent-hover`
- Active: `transform: scale(0.98)`

### Ghost Button (export, cancel, secondary actions)
- Background: `transparent`
- Border: `1px solid --border`
- Text: `--text-muted`
- Hover: border becomes `--accent`, text becomes `--accent`

### Destructive (remove/delete)
- No background, no border
- Text/icon color: `--status-destructive`
- Only visible on parent hover (use opacity reveal pattern — see Section 9)

---

## 8. Inputs and Textareas

All inputs share these base styles:

```css
background: var(--surface-base);
border: 1px solid var(--border);
color: var(--text-primary);
padding: 10px 12px;
border-radius: var(--radius-lg);
font-size: var(--text-sm);
font-family: inherit;
outline: none;
transition: border-color 150ms ease, box-shadow 150ms ease;
```

On focus:
```css
border-color: var(--accent);
box-shadow: 0 0 0 2px rgba(106, 172, 234, 0.2);
```

### Width rules
- Inputs inside a flex row with a sibling button: use `flex: 1` — never a hardcoded percentage
- Standalone inputs and textareas: `width: 100%; box-sizing: border-box`

### Textareas
- `resize: vertical` is allowed
- `scrollbar-width: thin` — **never hide scrollbars** on resizable or long-content textareas
- Monospace font only on template-content fields (not snippets, not persona/operator/format details)
- Minimum height: `80px` for short fields, `200px` for template content fields

---

## 9. List Items and Hover-Reveal Actions

List items (personas, operators, formats, templates, snippets) follow this pattern:

- Background: `--surface-raised`
- Padding: `8px 12px`
- Border radius: `--radius-md`
- Margin between items: `5px`

Action buttons (edit, delete) are **hidden by default** and revealed on parent hover:

```css
/* Default: hidden */
opacity: 0;
visibility: hidden;
pointer-events: none;
transform: translateY(4px);
transition: opacity 150ms ease, visibility 150ms ease, transform 150ms ease;

/* On .item:hover */
opacity: 1;
visibility: visible;
pointer-events: auto;
transform: translateY(0);   /* Always land at 0, not an intermediate value */
```

Both edit and delete buttons must animate to the **same final transform value** (`translateY(0)`). Inconsistent landing positions are a bug.

Also reveal on `:focus-within` for keyboard accessibility.

---

## 10. Modals

- Overlay: `rgba(0, 0, 0, 0.6)` fixed, full-screen
- Modal panel: `--surface-raised`, `border: 1px solid --border`, `border-radius: --radius-xl`, `padding: --space-10`
- Entry animation: `opacity 0→1` + `translateY(8px → 0)`, `150ms ease`
- Max width: `420px`
- Gap between fields: `--space-6`
- Modal title: `--accent`, uppercase, `--text-section`, letter-spacing `0.05em`

---

## 11. Floating Bubble (Content Script)

- Size: `20×20px`, `border-radius: --radius-full`
- Background: `--accent`
- Hover: `--accent-hover` + `transform: scale(1.1)`
- `z-index: 999999` — must stay above host page content
- `position: fixed`

---

## 12. Snippet Menu (Content Script)

- Width: `240px`
- Background: `--surface-base`
- Border: `1px solid --border`
- Border radius: `--radius-2xl`
- Padding: `8px`
- `z-index: 999999`

Snippet items:
- Padding: `12px`
- Border radius: `--radius-lg`
- Font size: `--text-sm`
- Hover: `--accent-hover` background, `font-weight: bold`

---

## 13. Toast Notifications

- Position: `fixed`, `bottom: 24px`, `right: 24px`
- Border radius: `8px`
- Font size: `--text-base`
- Entry: `opacity 0→1` + `translateY(8px → 0)`, `200ms ease`
- `pointer-events: none` — toasts never block interaction
- `z-index: 9999`

| Variant | Background | Border |
|---|---|---|
| Success | `--status-success-bg` | `--status-success-border` |
| Error | `--status-error-bg` | `--status-error-border` |

---

## 14. Motion Principles

- Transitions: `150ms ease` for state changes (hover, focus, reveal)
- Animations: `200ms ease` for entry/exit (toasts, modals)
- No motion purely for decoration
- All transitions should change exactly one or two properties — avoid animating everything with `transition: all`

---

## 15. What to Avoid

| Don't | Do instead |
|---|---|
| Hardcode hex values in component CSS | Always use a token from Section 2 |
| Use `transition: all` | Enumerate specific properties |
| Hide scrollbars on scrollable content | Use `scrollbar-width: thin` |
| Use `width: 85%` or other magic percentages | Use `flex: 1` or `width: 100%` with `box-sizing: border-box` |
| Apply monospace font to all textareas | Scope it to template-content fields only |
| Duplicate `:root` token declarations across files | Import a single shared `tokens.css` |
| Let hover/focus animations land on a non-zero transform | Always resolve to `translateY(0)` |
| Use `--input-bg` | Use `--surface-base` — they are the same value |

---

## 16. File Architecture (Target State)

```
tokens.css       ← Single source of truth for all CSS custom properties
options.css      ← Options page styles (imports tokens.css)
popup.css        ← Popup styles (imports tokens.css)
content.css      ← Content script styles (imports tokens.css or duplicates tokens
                    only if injection context requires it)
```

Until `tokens.css` is extracted, treat the token names in Section 2 as the canonical reference — any value not found there should be questioned.
