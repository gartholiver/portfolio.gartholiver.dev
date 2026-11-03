/** Fictional notifications, viewers, kudos presets and activity feed for the notification centre demo. */
import type { PersonId, TeamId } from "./people";

export const NOTIFICATIONS_WEEK_LABEL = "Week of 2 Nov 2026";
export type NotificationKind = "news" | "notification";

export interface NotificationAudience {
  everyone: boolean;
  teamIds: readonly TeamId[];
  personIds: readonly PersonId[];
}

export interface IntranetNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Authoring team label (fictional). */
  from: string;
  /** Hard-coded display date, e.g. "Mon 2 Nov". */
  dateLabel: string;
  audience: NotificationAudience;
}

export const NOTIFICATIONS: readonly IntranetNotification[] = [
  {
    id: "n-all-hands",
    kind: "news",
    title: "All-hands call moved to Thursday",
    body: "The company all-hands call on Thursday now starts an hour later. The agenda is on the News page.",
    from: "Internal Communications",
    dateLabel: "Mon 2 Nov",
    audience: { everyone: true, teamIds: [], personIds: [] },
  },
  {
    id: "n-support-rota",
    kind: "notification",
    title: "New weekend rota for the Support Desk",
    body: "Check the team calendar for your weekend shifts before Friday.",
    from: "Customer Support",
    dateLabel: "Mon 2 Nov",
    audience: { everyone: false, teamIds: ["support-desk"], personIds: [] },
  },
  {
    id: "n-design-tokens",
    kind: "notification",
    title: "Design tokens update ships Wednesday",
    body: "Pull the latest component library before starting new pages.",
    from: "Engineering",
    dateLabel: "Mon 2 Nov",
    audience: { everyone: false, teamIds: ["web"], personIds: [] },
  },
  {
    id: "n-onboarding-buddies",
    kind: "notification",
    title: "Onboarding buddies needed",
    body: "Volunteer to welcome a new starter during their first weeks.",
    from: "People & Culture",
    dateLabel: "Fri 30 Oct",
    audience: { everyone: false, teamIds: ["talent"], personIds: [] },
  },
  {
    id: "n-security-refresher",
    kind: "notification",
    title: "Complete the security refresher",
    body: "A short refresher module is now in Training. Please finish it by the end of the month.",
    from: "Workplace & IT",
    dateLabel: "Fri 30 Oct",
    audience: { everyone: false, teamIds: ["support-desk", "web"], personIds: [] },
  },
  {
    id: "n-equipment-lena",
    kind: "notification",
    title: "Your equipment request was approved",
    body: "Your new monitor will be shipped to your home address.",
    from: "Workplace & IT",
    dateLabel: "Fri 30 Oct",
    audience: { everyone: false, teamIds: [], personIds: ["p-lena"] },
  },
  {
    id: "n-welcome-jordan",
    kind: "notification",
    title: "Welcome to the team, Jordan",
    body: "Your manager has added you to the Support Desk team space.",
    from: "People & Culture",
    dateLabel: "Thu 29 Oct",
    audience: { everyone: false, teamIds: [], personIds: ["p-jordan"] },
  },
  {
    id: "n-wellbeing",
    kind: "news",
    title: "New wellbeing guides",
    body: "Updated wellbeing guides are now under Resources.",
    from: "People & Culture",
    dateLabel: "Thu 29 Oct",
    audience: { everyone: true, teamIds: [], personIds: [] },
  },
];

export const VIEWER_IDS = ["p-jordan", "p-lena", "p-noah"] as const;
export type ViewerId = (typeof VIEWER_IDS)[number];

/** Notifications each viewer has already read when the demo loads. */
export const INITIAL_SEEN: Readonly<Record<ViewerId, readonly string[]>> = {
  "p-jordan": ["n-wellbeing"],
  "p-lena": ["n-design-tokens", "n-wellbeing"],
  "p-noah": ["n-wellbeing"],
};

export const KUDOS_PRESETS = [
  { id: "high-five", label: "High Five" },
  { id: "great-job", label: "Great Job" },
  { id: "thank-you", label: "Thank You" },
] as const;
export type KudosPresetId = (typeof KUDOS_PRESETS)[number]["id"];
export type KudosPreset = (typeof KUDOS_PRESETS)[number];

export interface KudosFeedItem {
  id: string;
  kind: "kudos";
  fromId: PersonId;
  toId: PersonId;
  presetId: KudosPresetId;
  dateLabel: string;
}
export interface AnnouncementFeedItem {
  id: string;
  kind: "announcement";
  text: string;
  dateLabel: string;
}
export type FeedItem = KudosFeedItem | AnnouncementFeedItem;

export const INITIAL_FEED: readonly FeedItem[] = [
  { id: "f-welcome-support", kind: "announcement", text: "Welcome to everyone who joined Customer Support this week.", dateLabel: "Mon 2 Nov" },
  { id: "f-kudos-avery-sam", kind: "kudos", fromId: "p-avery", toId: "p-sam", presetId: "great-job", dateLabel: "Fri 30 Oct" },
  { id: "f-office-hub", kind: "announcement", text: "Desk booking for next week is open in the Office Hub.", dateLabel: "Thu 29 Oct" },
  { id: "f-kudos-grace-noah", kind: "kudos", fromId: "p-grace", toId: "p-noah", presetId: "thank-you", dateLabel: "Thu 29 Oct" },
];
