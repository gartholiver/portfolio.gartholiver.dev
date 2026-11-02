/**
 * Curated stack content shown on /stack (package.json). This is presentation data, separate from
 * the application's real package manifest. Every item is a placeholder and AI preferences stay
 * "pending" until supplied — nothing here states a real tool or preference.
 */
export interface StackItem {
  /** JSON key. */
  name: string;
  /** JSON string value. */
  value: string;
  /** Plain-language note shown beside the line. */
  note: string;
}

export interface StackGroup {
  /** JSON key for the group, e.g. "languages". */
  key: string;
  /** Plain-language explanation for non-developers. */
  explanation: string;
  items: StackItem[];
}

export interface StackData {
  name: string;
  description: string;
  /** Plain-language notes for the top-level keys and the enclosing braces. */
  notes: { root: string; name: string; description: string; stack: string; ai: string };
  groups: StackGroup[];
  aiPreferences: { status: "pending"; note: string; statusNote: string; noteNote: string };
}

export const stack: StackData = {
  name: "garth-oliver",
  description: "[Placeholder] Curated stack summary to be supplied.",
  notes: {
    root: "This whole file is one JSON object: a list of labelled settings between curly braces.",
    name: "The name of this profile.",
    description: "[Placeholder] What this file is for. Final summary to be supplied.",
    stack: "The tools I build with, sorted into groups.",
    ai: "How I work with AI tools. Still to be supplied.",
  },
  groups: [
    {
      key: "languages",
      explanation: "[Placeholder] The programming languages used most often.",
      items: [
        {
          name: "[placeholder]",
          value: "to be supplied",
          note: "[Placeholder] Real languages will replace this entry.",
        },
      ],
    },
    {
      key: "frameworks",
      explanation: "[Placeholder] Frameworks and platforms used to build projects.",
      items: [
        {
          name: "[placeholder]",
          value: "to be supplied",
          note: "[Placeholder] Real frameworks and platforms will replace this entry.",
        },
      ],
    },
    {
      key: "tools",
      explanation: "[Placeholder] Everyday tools for editing, testing and shipping work.",
      items: [
        {
          name: "[placeholder]",
          value: "to be supplied",
          note: "[Placeholder] Real tools will replace this entry.",
        },
      ],
    },
  ],
  aiPreferences: {
    status: "pending",
    note: "AI preferences will be added once supplied.",
    statusNote: "Pending: nothing has been decided or published here yet.",
    noteNote: "A reminder that this section is waiting on input from Garth.",
  },
};
