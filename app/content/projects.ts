/**
 * Portfolio projects. Folder names come from the design brief and double as URL slugs.
 * Titles come from the folder names. Optional `summary`/`description` text must stay anonymised: no client or agency names, outcomes or metrics.
 * Keep this module free of Vite-only imports: react-router.config.ts imports it via the registry.
 */

export const PROJECT_IDS = [
  "hybrid-wp-react-intranet",
  "headless-wp-educational-app",
  "legal-doc-wp-ordering-system",
  "multi-location-inventory-sales-system",
] as const;

export type ProjectId = (typeof PROJECT_IDS)[number];

export interface ProjectView {
  /** URL slug and filename stem (filename is `${slug}.html`). Unique within a project only. */
  slug: string;
  /** Human-readable title shown in page headers. */
  title: string;
  /** Interactive demo id when the view is a working demo; omit for placeholder views. */
  demoId?: string;
  /** Real one-line description (search + <meta name="description">). Replaces the generated text when set. */
  description?: string;
}

export interface Project {
  id: ProjectId;
  /** Explorer folder name (same as id). */
  folder: string;
  title: string;
  tags: string[];
  status: "placeholder" | "final";
  /** Real one-line project summary. When set, README and technical-requirements descriptions use it instead of the placeholder suffix. */
  summary?: string;
  views: ProjectView[];
}

export const projects: readonly Project[] = [
  {
    id: "hybrid-wp-react-intranet",
    folder: "hybrid-wp-react-intranet",
    title: "Hybrid WordPress + React Intranet",
    tags: ["WordPress", "React", "Intranet"],
    status: "final",
    summary:
      "An intranet for a healthcare-sector company with a large remote workforce, built as a React single-page app inside a WordPress theme.",
    views: [
      {
        slug: "onboarding-wizard",
        title: "Onboarding Wizard",
        demoId: "onboarding-wizard",
        description:
          "Interactive demo: a step-by-step onboarding flow with a progress bar, Back and Next, and a dashboard navigation that unlocks on completion. Fictional sample data.",
      },
      {
        slug: "notification-center",
        title: "Notification Center",
        demoId: "notification-center",
        description:
          "Interactive demo: notifications targeted to everyone, to teams or to named people, with unseen and seen lists, mark as read and peer kudos. Fictional sample data.",
      },
      {
        slug: "interactive-remote-employee-map",
        title: "Interactive Remote Employee Map",
        demoId: "interactive-remote-employee-map",
        description:
          "Interactive demo: a keyboard-friendly map of approximate staff locations with a department filter, profile cards and a table alternative. Fictional sample data.",
      },
      { slug: "office-booking-calendar", title: "Office Booking Calendar", demoId: "office-booking-calendar" },
      { slug: "employee-directory", title: "Employee Directory" },
      { slug: "documentation-system", title: "Documentation System" },
    ],
  },
  {
    id: "headless-wp-educational-app",
    folder: "headless-wp-educational-app",
    title: "Headless WordPress Educational App",
    tags: ["WordPress", "Headless", "Education"],
    status: "placeholder",
    views: [
      { slug: "lms-scorm-integration", title: "LMS / SCORM Integration" },
      { slug: "integrated-point-system", title: "Integrated Point System" },
      { slug: "trackable-award-system", title: "Trackable Award System" },
      { slug: "challenge-interface", title: "Challenge Interface" },
    ],
  },
  {
    id: "legal-doc-wp-ordering-system",
    folder: "legal-doc-wp-ordering-system",
    title: "Legal Document WordPress Ordering System",
    tags: ["WordPress", "WooCommerce", "Gravity Forms"],
    status: "placeholder",
    views: [
      { slug: "conditional-gf-woo-order-system", title: "Conditional Gravity Forms + WooCommerce Order System" },
      { slug: "custom-woo-extension-plugin", title: "Custom WooCommerce Extension Plugin" },
      { slug: "custom-notification-system", title: "Custom Notification System" },
      { slug: "custom-user-dashboard", title: "Custom User Dashboard" },
    ],
  },
  {
    id: "multi-location-inventory-sales-system",
    folder: "multi-location-inventory-sales-system",
    title: "Multi-Location Inventory & Sales System",
    tags: ["WordPress", "WooCommerce", "Inventory"],
    status: "placeholder",
    views: [
      { slug: "multi-location-inventory-sync", title: "Multi-Location Inventory Sync" },
      { slug: "custom-woo-extension-plugin", title: "Custom WooCommerce Extension Plugin" },
      { slug: "custom-order-management", title: "Custom Order Management" },
      { slug: "user-profile-completion-wizard", title: "User Profile Completion Wizard" },
      { slug: "location-gated-products", title: "Location-Gated Products" },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
