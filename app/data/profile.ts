/** About page data. Every field is a clearly-marked placeholder until supplied in phase 2. */
export interface Profile {
  name: string;
  headline: string;
  status: "placeholder" | "final";
  biography: string[];
  experience: { period: string; role: string; summary: string }[];
}

export const profile: Profile = {
  name: "Garth Oliver",
  headline: "[Placeholder] Headline to be supplied.",
  status: "placeholder",
  biography: [
    "[Placeholder] Biography to be supplied in phase 2. This paragraph will introduce who Garth is and what he does.",
    "[Placeholder] A second paragraph about working style and interests, to be supplied.",
  ],
  experience: [
    {
      period: "[Placeholder] Dates",
      role: "[Placeholder] Role",
      summary: "[Placeholder] Experience summary to be supplied.",
    },
    {
      period: "[Placeholder] Dates",
      role: "[Placeholder] Role",
      summary: "[Placeholder] Experience summary to be supplied.",
    },
    {
      period: "[Placeholder] Dates",
      role: "[Placeholder] Role",
      summary: "[Placeholder] Experience summary to be supplied.",
    },
  ],
};
