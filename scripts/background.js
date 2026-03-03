const defaultTemplates = [
  {
    name: "Standard",
    content: `# SYSTEM INSTRUCTIONS
    Act as an expert {{persona}}. Your goal is to execute the user's task with high precision, adopting the specific tone and depth associated with this persona.

    # TASK OBJECTIVE
    Your primary mission is to: {{operator}}.
    Please process the following input: "{{input}}"

    # PROVIDED CONTEXT
    {{context}}

    # OPERATIONAL CONSTRAINTS & RULES
    - STRICTURE: {{constraint}}
    - Maintain the authoritative voice of a {{persona}}.
    - Do not provide meta-commentary (e.g., do not say "Here is the summary").
    - Focus exclusively on the output based on the provided input.

    # OUTPUT SPECIFICATION
    - FORMAT: {{format}}
    - Ensure the structural integrity of the {{format}} request is maintained.

    # EXECUTION
    Begin the response now.`.trim(),
  },
];

const defaultSnippets = [
  {
    name: "Fix Grammar",
    content: "Please correct the grammar and flow of this: ",
  },
  {
    name: "Review Code",
    content: "Analyze this code for bugs and efficiency: ",
  },
  {
    name: "Summarize",
    content: "Summarize the following into 3 key bullet points: ",
  },
];

const defaults = {
  persona: ["Expert Developer", "Marketing Guru", "Socratic Tutor"],
  operator: ["Summarize", "Critizise", "Explain"],
  format: ["Bulletpoints", "Markdown", "Table"],
  templates: defaultTemplates,
  snippets: defaultSnippets,
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set(defaults);
  }
});
