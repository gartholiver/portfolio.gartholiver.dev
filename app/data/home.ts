import type { ProjectId } from "~/content/projects";

/**
 * Home page copy. Anything marked "[Placeholder]" is not final; the four project links come from
 * the registry, the short descriptions below are placeholders keyed by project id.
 */
export const home = {
  eyebrow: "index.html",
  heading: "Garth Oliver — Portfolio",
  intro: "[Placeholder] A short portfolio introduction will go here.",
  introNote:
    "This site is laid out like a code editor: a file explorer, open documents, and a small terminal. The case studies, sample-data demos and contact flow are all explorable files.",
  placeholderCallout:
    "The introduction and project descriptions are placeholders. Final copy will be supplied in phase 2. No client names, outcomes or metrics are stated anywhere on this site yet.",
  projectsIntro: "Four case studies. Each has a README (overview), technical requirements, and example views.",
  projectBlurbs: {
    "hybrid-wp-react-intranet":
      "[Placeholder] One-sentence summary of this WordPress + React intranet project, to be supplied.",
    "headless-wp-educational-app":
      "[Placeholder] One-sentence summary of this headless WordPress educational app, to be supplied.",
    "legal-doc-wp-ordering-system":
      "[Placeholder] One-sentence summary of this WordPress ordering system, to be supplied.",
    "multi-location-inventory-sales-system":
      "[Placeholder] One-sentence summary of this inventory and sales system, to be supplied.",
  } satisfies Record<ProjectId, string>,
  exploreHeading: "How to explore",
  exploreSteps: [
    {
      title: "Use the explorer",
      body: "The file tree works like a code editor's sidebar. Open a project folder to find its README.md (the overview), technical-requirements.md (the details) and a views folder of example screens. On a phone or narrow window, use the Explorer button at the top to open it.",
    },
    {
      title: "Try the views",
      body: "Files in each views folder are example screens built with made-up sample data. One is a working interactive demo; the rest are clearly labelled placeholder panels for now.",
    },
    {
      title: "Open contact.bash",
      body: "In the docs folder, contact.bash opens a small terminal below the page that asks a few questions. It is a demo: nothing is sent.",
    },
    {
      title: "Search or read the stack",
      body: "search.tsx finds pages by title, filename, project, tag or text. package.json lists tools and preferences in plain language.",
    },
  ],
  contactHeading: "Get in touch",
  contactBody:
    "The contact terminal asks for a name, an email address and a short message. It is a front-end demo for now, so nothing leaves your browser.",
} as const;
