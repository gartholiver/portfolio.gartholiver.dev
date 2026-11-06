/**
 * Copy for the placeholder view panels, keyed by registry entry id (`view:<project>:<slug>`).
 * One entry per non-demo view in app/content/projects.ts. Statements are generic unless the project has
 * been reviewed (the intranet's two remaining panels describe the real feature) — no invented
 * workflows, features, clients or metrics.
 * Everything is marked "[Placeholder]" until the real content is supplied in phase 2.
 */

export interface ViewPlaceholder {
  /** What the view will demonstrate (generic, from its name only). */
  summary: string;
}

export const viewPlaceholderCommon = {
  /** Line beside the "Sample data" pill. */
  frameDescription: "Placeholder view — no real data",
  statusLabel: "Status",
  status: "Coming after the project is reviewed.",
  summaryLabel: "What this view will demonstrate",
  readmeLinkLabel: "Back to project README",
} as const;

export const viewPlaceholders: Readonly<Record<string, ViewPlaceholder>> = {
  // hybrid-wp-react-intranet
  "view:hybrid-wp-react-intranet:employee-directory": {
    summary:
      "[Placeholder] This panel will present the intranet's employee directory: staff profiles searchable by name, department and team, each showing a person's title, manager and direct reports. It will be rebuilt with fictional staff.",
  },
  "view:hybrid-wp-react-intranet:documentation-system": {
    summary:
      "[Placeholder] This panel will present the intranet's documentation system: support and training documents grouped by category, searchable, and shown only to the roles allowed to see them. It will be rebuilt with fictional documents.",
  },

  // headless-wp-educational-app
  "view:headless-wp-educational-app:lms-scorm-integration": {
    summary:
      "[Placeholder] This panel will present an illustrative LMS / SCORM integration, using fictional course data.",
  },
  "view:headless-wp-educational-app:integrated-point-system": {
    summary: "[Placeholder] This panel will present an illustrative integrated point system, using fictional point data.",
  },
  "view:headless-wp-educational-app:trackable-award-system": {
    summary: "[Placeholder] This panel will present an illustrative trackable award system, using fictional award data.",
  },
  "view:headless-wp-educational-app:challenge-interface": {
    summary: "[Placeholder] This panel will present an illustrative challenge interface, using fictional challenges.",
  },

  // legal-doc-wp-ordering-system
  "view:legal-doc-wp-ordering-system:conditional-gf-woo-order-system": {
    summary:
      "[Placeholder] This panel will present an illustrative order system that pairs conditional Gravity Forms with WooCommerce, using fictional orders.",
  },
  "view:legal-doc-wp-ordering-system:custom-woo-extension-plugin": {
    summary:
      "[Placeholder] This panel will present an illustrative custom WooCommerce extension plugin for the legal document ordering system, using fictional sample data.",
  },
  "view:legal-doc-wp-ordering-system:custom-notification-system": {
    summary:
      "[Placeholder] This panel will present an illustrative custom notification system, using fictional sample notifications.",
  },
  "view:legal-doc-wp-ordering-system:custom-user-dashboard": {
    summary:
      "[Placeholder] This panel will present an illustrative custom user dashboard, using a fictional user account.",
  },

  // multi-location-inventory-sales-system
  "view:multi-location-inventory-sales-system:multi-location-inventory-sync": {
    summary:
      "[Placeholder] This panel will present an illustrative multi-location inventory sync, using fictional locations and stock figures.",
  },
  "view:multi-location-inventory-sales-system:custom-woo-extension-plugin": {
    summary:
      "[Placeholder] This panel will present an illustrative custom WooCommerce extension plugin for the multi-location inventory and sales system, using fictional sample data.",
  },
  "view:multi-location-inventory-sales-system:custom-order-management": {
    summary:
      "[Placeholder] This panel will present an illustrative custom order management view, using fictional orders.",
  },
  "view:multi-location-inventory-sales-system:user-profile-completion-wizard": {
    summary:
      "[Placeholder] This panel will present an illustrative user profile completion wizard, using a fictional user profile.",
  },
  "view:multi-location-inventory-sales-system:location-gated-products": {
    summary:
      "[Placeholder] This panel will present illustrative location-gated products, using fictional products and locations.",
  },
};

export function getViewPlaceholder(entryId: string): ViewPlaceholder | undefined {
  return viewPlaceholders[entryId];
}
