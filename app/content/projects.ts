/**
 * Portfolio projects. Folder names come from the design brief and double as URL slugs.
 * Titles are expanded from the folder names only — no client names, outcomes or metrics.
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
}

export interface Project {
  id: ProjectId;
  /** Explorer folder name (same as id). */
  folder: string;
  title: string;
  tags: string[];
  status: "placeholder";
  views: ProjectView[];
}

export const projects: readonly Project[] = [
  {
    id: "hybrid-wp-react-intranet",
    folder: "hybrid-wp-react-intranet",
    title: "Hybrid WordPress + React Intranet",
    tags: ["WordPress", "React", "Intranet"],
    status: "placeholder",
    views: [
      { slug: "office-booking-calendar", title: "Office Booking Calendar", demoId: "office-booking-calendar" },
      { slug: "interactive-remote-employee-map", title: "Interactive Remote Employee Map" },
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
