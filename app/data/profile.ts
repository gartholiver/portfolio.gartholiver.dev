/** About page data. Every field is a clearly-marked placeholder until supplied in phase 2. */
export interface Profile {
  name: string;
  headline: string;
  status: "placeholder";
  biography: string[];
  experience: { period: string; role: string; summary: string }[];
}

export const profile: Profile = {
  name: "Garth Oliver",
  headline: "[Placeholder] Headline to be supplied.",
  status: "placeholder",
  biography: ["[Placeholder] Biography to be supplied in phase 2."],
  experience: [
    { period: "[Placeholder]", role: "[Placeholder] Role", summary: "[Placeholder] Experience summary to be supplied." },
  ],
};
