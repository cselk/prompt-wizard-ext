/**
 * @file background.js
 * @description Service-worker script that runs once on extension install.
 * Defines the default data for all storage keys and writes them to
 * chrome.storage.sync so every other script has a consistent baseline.
 *
 * Storage schema
 * ──────────────
 * persona   {Array<{name: string, details: string}>}  Role/voice items
 * operator  {Array<{name: string, details: string}>}  Task-instruction items
 * format    {Array<{name: string, details: string}>}  Output-format items
 * templates {Array<{name: string, content: string}>}  Prompt templates
 * snippets  {Array<{name: string, content: string}>}  Quick-insert snippets
 */

/** @type {Array<{name: string, content: string}>} */
const defaultTemplates = [
  {
    name: "Standard Prompt",
    content: `## Role
{{persona.details}}

## Task
{{operator.details}}

## Input
{{input}}

## Context
{{context}}

## Constraints
{{constraint}}

## Output Format
{{format.details}}`,
  },
  {
    name: "Code Task",
    content: `## Role
{{persona.details}}

## Task
{{operator.details}}

## Code / Input
{{input}}

## Context & Environment
{{context}}

## Constraints
{{constraint}}
Only return code that is complete and ready to run. Include inline comments where the logic is non-obvious. If multiple approaches exist, briefly note the tradeoffs before presenting your preferred solution.

## Output Format
{{format.details}}`,
  },
  {
    name: "Content Brief",
    content: `## Role
{{persona.details}}

## Task
{{operator.details}}

## Topic / Input
{{input}}

## Background & Context
{{context}}

## Constraints & Guidelines
{{constraint}}
Match the tone and style to the intended audience. Avoid filler content — every sentence should add value.

## Output Format
{{format.details}}`,
  },
];

/** @type {Array<{name: string, content: string}>} */
const defaultSnippets = [
  {
    name: "Fix Grammar",
    content:
      "Please correct any grammar, spelling, and punctuation mistakes in the text below. Improve the flow where needed but preserve the original meaning and tone.",
  },
  {
    name: "Summarize",
    content:
      "Please summarize the following into a concise overview. Capture the key points and main takeaways. Keep it brief and easy to scan.",
  },
  {
    name: "Simplify",
    content:
      "Please rewrite the following in plain, simple language. Aim for clarity over complexity — as if explaining to someone unfamiliar with the topic. Avoid jargon and keep sentences short.",
  },
  {
    name: "Give Feedback",
    content:
      "Please review the following and provide honest, structured feedback. Highlight what works well, what could be improved, and any specific suggestions you have. Be direct but constructive.",
  },
  {
    name: "Brainstorm",
    content:
      "Please brainstorm a diverse list of ideas on the following topic. Prioritize variety and creativity — don't filter too early. Present the ideas as a concise bullet list.",
  },
];

/**
 * Default values written to chrome.storage.sync on first install.
 * @type {Object}
 */
const defaults = {
  persona: [
    {
      name: "Senior Developer",
      details:
        "You are a senior software engineer with 15+ years of experience across multiple languages and paradigms. You write clean, efficient, and well-documented code. You prioritize correctness, maintainability, and performance. When reviewing or writing code, you proactively flag potential issues and suggest improvements. You communicate technical concepts clearly and concisely.",
    },
    {
      name: "Professional Writer",
      details:
        "You are an experienced professional writer and editor with a strong command of tone, structure, and clarity. You adapt your style to the context — formal for business documents, conversational for blogs, persuasive for marketing. You avoid unnecessary jargon, prefer active voice, and always write with the reader in mind.",
    },
    {
      name: "Analytical Thinker",
      details:
        "You are a sharp analytical thinker with a background in research and structured reasoning. You approach problems methodically, weigh evidence objectively, and present findings in a clear, logical manner. You highlight assumptions, identify gaps, and offer balanced perspectives rather than jumping to conclusions.",
    },
  ],
  operator: [
    {
      name: "Explain",
      details:
        "Explain the following clearly and concisely. Tailor the depth of the explanation to the complexity of the topic. Use examples where they aid understanding. Avoid unnecessary jargon unless the context calls for it.",
    },
    {
      name: "Improve",
      details:
        "Review the following and improve it. Focus on clarity, quality, and effectiveness. Point out what was changed and why. Preserve the original intent unless there is a clear reason to deviate from it.",
    },
    {
      name: "Generate",
      details:
        "Generate the following from scratch based on the provided input. Be creative where appropriate, but stay grounded in the context and constraints given. Aim for quality over quantity.",
    },
  ],
  format: [
    {
      name: "Step-by-Step",
      details:
        "Present your response as a numbered sequence of clear, actionable steps. Each step should be self-contained and easy to follow. Add brief explanations where a step may not be immediately obvious.",
    },
    {
      name: "Bullet Summary",
      details:
        "Present your response as a concise set of bullet points. Each bullet should capture one distinct idea. Prioritize clarity and brevity — avoid full paragraphs. Aim for 5–10 bullets unless the topic demands otherwise.",
    },
    {
      name: "Structured Report",
      details:
        "Present your response as a structured report with clearly labelled sections. Use headings to separate distinct parts of the content. Each section should be focused and logically flow into the next. Conclude with a brief summary or recommendation where appropriate.",
    },
  ],
  templates: defaultTemplates,
  snippets: defaultSnippets,
};

/**
 * Writes the default storage values on fresh install.
 * Does not run on update or reload, so existing user data is never overwritten.
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set(defaults);
  }
});
