/**
 * Demo registry. Interactive demos live in app/demos/<demo-id>/ (components + CSS Modules);
 * their sample data lives separately in app/fixtures/<demo-id>/. A registry entry with
 * `content: { type: "demo", demoId }` maps to a key here. Implemented in a later task.
 */
export const DEMO_IDS = ["office-booking-calendar"] as const;
export type DemoId = (typeof DEMO_IDS)[number];
