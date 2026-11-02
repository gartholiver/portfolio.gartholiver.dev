/**
 * Curated stack content shown on /stack (package.json). This is presentation data, separate from
 * the application's real package manifest. AI preferences stay "pending" until supplied.
 */
export interface StackGroup {
  key: string;
  /** Plain-language explanation for non-developers. */
  explanation: string;
  items: Record<string, string>;
}

export interface StackData {
  name: string;
  description: string;
  groups: StackGroup[];
  aiPreferences: { status: "pending"; note: string };
}

export const stack: StackData = {
  name: "garth-oliver",
  description: "[Placeholder] Curated stack summary to be supplied.",
  groups: [
    {
      key: "languages",
      explanation: "[Placeholder] The programming languages used most often.",
      items: { "[placeholder]": "to be supplied" },
    },
    {
      key: "frameworks",
      explanation: "[Placeholder] Frameworks and platforms used to build projects.",
      items: { "[placeholder]": "to be supplied" },
    },
  ],
  aiPreferences: { status: "pending", note: "AI preferences will be added once supplied." },
};
