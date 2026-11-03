/**
 * Demo registry. Interactive demos live in app/demos/<demo-id>/ (components + CSS Modules);
 * their sample data lives separately in app/fixtures/<demo-id>.ts (or a folder). A registry entry with
 * `content: { type: "demo", demoId }` maps to a key here, and the view route renders the demo
 * inside <DemoFrame> (title, "Sample data" label, light panel).
 *
 * To add a demo: create app/demos/<demo-id>/ with a default-exported, prop-less component, import
 * it below and add ONE line to `demoDefinitions`. Nothing in the shell or routes changes. (Imports
 * are static so the prerendered HTML contains the demo; swap in React.lazy per demo if one grows
 * heavy.) The demo only renders the panel body — the frame supplies the title and labels.
 */
import type { ComponentType } from "react";
import { NOTIFICATIONS_WEEK_LABEL, ONBOARDING_STEPS, PEOPLE } from "~/fixtures/intranet";
import { FLOOR_LABEL, WEEK_LABEL } from "~/fixtures/office-booking-calendar";
import InteractiveRemoteEmployeeMap from "./interactive-remote-employee-map";
import NotificationCenter from "./notification-center";
import OfficeBookingCalendar from "./office-booking-calendar";
import OnboardingWizard from "./onboarding-wizard";

export interface DemoDefinition {
  /** Panel body. Receives no props. */
  component: ComponentType;
  /** Text on the right of the panel header; defaults to the project title. */
  meta?: string;
  /** Line beside the "Sample data" pill. */
  description: string;
}

const demoDefinitions = {
  "office-booking-calendar": {
    component: OfficeBookingCalendar,
    meta: `${WEEK_LABEL} · ${FLOOR_LABEL}`,
    description: "Interactive example with fictional reservations; nothing is saved",
  },
  "onboarding-wizard": {
    component: OnboardingWizard,
    meta: `New starter tour · ${ONBOARDING_STEPS.length} steps`,
    description: "Interactive example with fictional onboarding steps; nothing is saved",
  },
  "notification-center": {
    component: NotificationCenter,
    meta: NOTIFICATIONS_WEEK_LABEL,
    description: "Interactive example with fictional people and notifications; nothing is saved",
  },
  "interactive-remote-employee-map": {
    component: InteractiveRemoteEmployeeMap,
    meta: `${PEOPLE.length} fictional colleagues · approximate locations`,
    description: "Interactive example with fictional people and approximate locations; nothing is saved",
  },
} satisfies Record<string, DemoDefinition>;

export type DemoId = keyof typeof demoDefinitions;
export const DEMO_IDS = Object.keys(demoDefinitions) as DemoId[];

export function getDemo(demoId: string): DemoDefinition | undefined {
  return Object.hasOwn(demoDefinitions, demoId) ? demoDefinitions[demoId as DemoId] : undefined;
}
