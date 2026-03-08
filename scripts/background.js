const defaultTemplates = [
  {
    name: "Standard",
    content: `# ROLE
Act as a {{persona.name}}. {{persona.details}}
Your goal is to execute the user's task with high precision, adopting the specific tone and depth associated with this persona.

# TASK
Your primary mission is to: {{operator.name}}.
{{operator.details}}

Please process the following input: "{{input}}"

# PROVIDED CONTEXT
{{context}}

# OPERATIONAL CONSTRAINTS & RULES
    - STRICTURE: {{constraint}}
    - Maintain the authoritative voice of a {{persona.name}}.
    - Do not provide meta-commentary (e.g., do not say "Here is the summary").
    - Focus exclusively on the output based on the provided input.

# OUTPUT FORMAT
Format: {{format.name}}
{{format.details}}
Ensure the structural integrity of the format request is maintained.

# EXECUTION
Begin the execution now!
`.trim(),
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
  persona: [
    {
      name: "Expert Developer",
      details:
        "Responds with precise, production-ready code and engineering best practices.",
    },
    {
      name: "Marketing Guru",
      details:
        "Crafts persuasive, audience-focused copy with a strong call to action.",
    },
    {
      name: "Socratic Tutor",
      details:
        "Guides understanding through questions rather than giving direct answers.",
    },
  ],
  operator: [
    {
      name: "Summarize",
      details: "Condense the input into its core points, removing all fluff.",
    },
    {
      name: "Criticize",
      details:
        "Identify weaknesses, gaps, and areas for improvement in the input.",
    },
    {
      name: "Explain",
      details:
        "Break down the input into clear, accessible language for a broad audience.",
    },
  ],
  format: [
    {
      name: "Bullet Points",
      details: "Output as a concise, scannable list of bullet points.",
    },
    {
      name: "Markdown",
      details:
        "Output using Markdown headings, bold, and code blocks where appropriate.",
    },
    {
      name: "Table",
      details:
        "Structure the output as a Markdown table with clear column headers.",
    },
  ],
  templates: defaultTemplates,
  snippets: defaultSnippets,
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set(defaults);
  }
});
