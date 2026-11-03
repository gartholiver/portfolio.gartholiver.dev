/**
 * Pure notification rules for the notification centre demo. No React, no module state: every
 * function takes a NotificationState and returns a result carrying the next state (the same object
 * when nothing changed). The in-memory store (./store.ts) and the component build on this.
 *
 * Rules
 * - A notification is addressed to everyone, to whole teams or to named people.
 * - Each viewer has their own seen list; marking one as read never affects other viewers.
 * - Kudos are sent by the current viewer to one other colleague with a preset message, and are
 *   prepended to the activity feed. Only the first validation error is reported.
 */
import {
  INITIAL_FEED,
  INITIAL_SEEN,
  KUDOS_PRESETS,
  NOTIFICATIONS,
  VIEWER_IDS,
  fullName,
  getPerson,
  getTeam,
  type FeedItem,
  type IntranetNotification,
  type KudosFeedItem,
  type KudosPresetId,
  type PersonId,
  type ViewerId,
} from "~/fixtures/intranet";

export interface NotificationState {
  readonly viewerId: ViewerId;
  readonly seen: Readonly<Record<ViewerId, readonly string[]>>;
  readonly feed: readonly FeedItem[];
  readonly kudosSent: number;
}

export const INITIAL_STATE: NotificationState = Object.freeze({
  viewerId: "p-jordan",
  seen: INITIAL_SEEN,
  feed: INITIAL_FEED,
  kudosSent: 0,
});

export function isViewerId(id: string): id is ViewerId {
  return (VIEWER_IDS as readonly string[]).includes(id);
}

export function getNotification(id: string): IntranetNotification | undefined {
  return NOTIFICATIONS.find((n) => n.id === id);
}

export function isTargeted(notification: IntranetNotification, personId: PersonId): boolean {
  const a = notification.audience;
  if (a.everyone || a.personIds.includes(personId)) return true;
  const person = getPerson(personId);
  return person !== undefined && a.teamIds.includes(person.teamId);
}

export function notificationsFor(personId: PersonId): IntranetNotification[] {
  return NOTIFICATIONS.filter((n) => isTargeted(n, personId));
}

export function unseenFor(state: NotificationState, viewerId: ViewerId): IntranetNotification[] {
  const seen = state.seen[viewerId];
  return notificationsFor(viewerId).filter((n) => !seen.includes(n.id));
}

export function seenFor(state: NotificationState, viewerId: ViewerId): IntranetNotification[] {
  const seen = state.seen[viewerId];
  return notificationsFor(viewerId).filter((n) => seen.includes(n.id));
}

export function unreadCount(state: NotificationState, viewerId: ViewerId): number {
  return unseenFor(state, viewerId).length;
}

export function describeAudience(notification: IntranetNotification, viewerId: ViewerId): string {
  const a = notification.audience;
  if (a.everyone) return "Everyone";
  const parts: string[] = [];
  for (const teamId of a.teamIds) {
    const team = getTeam(teamId);
    if (team) parts.push(`${team.name} team`);
  }
  for (const personId of a.personIds) {
    const person = getPerson(personId);
    if (person) parts.push(personId === viewerId ? "You" : fullName(person));
  }
  return parts.join(", ");
}

export function unreadPhrase(count: number): string {
  return count === 1 ? "1 unread notification" : `${count} unread notifications`;
}

export type SetViewerResult =
  | { ok: true; state: NotificationState; viewerId: ViewerId; unread: number }
  | { ok: false; state: NotificationState; reason: "unknown-viewer"; viewerId: string };

export function setViewer(state: NotificationState, viewerId: string): SetViewerResult {
  if (!isViewerId(viewerId)) return { ok: false, state, reason: "unknown-viewer", viewerId };
  const next = viewerId === state.viewerId ? state : { ...state, viewerId };
  return { ok: true, state: next, viewerId, unread: unreadCount(next, viewerId) };
}

export type MarkReadResult =
  | { ok: true; state: NotificationState; notificationId: string; title: string; unread: number }
  | {
      ok: false;
      state: NotificationState;
      reason: "unknown-notification" | "not-targeted" | "already-read";
      notificationId: string;
    };

export function markRead(state: NotificationState, notificationId: string): MarkReadResult {
  const notification = getNotification(notificationId);
  if (!notification) return { ok: false, state, reason: "unknown-notification", notificationId };
  if (!isTargeted(notification, state.viewerId)) return { ok: false, state, reason: "not-targeted", notificationId };
  if (state.seen[state.viewerId].includes(notificationId)) {
    return { ok: false, state, reason: "already-read", notificationId };
  }
  const next: NotificationState = {
    ...state,
    seen: { ...state.seen, [state.viewerId]: [...state.seen[state.viewerId], notificationId] },
  };
  return { ok: true, state: next, notificationId, title: notification.title, unread: unreadCount(next, state.viewerId) };
}

export type MarkAllResult =
  | { ok: true; state: NotificationState; count: number }
  | { ok: false; state: NotificationState; reason: "nothing-unread" };

export function markAllRead(state: NotificationState): MarkAllResult {
  const unseen = unseenFor(state, state.viewerId);
  if (unseen.length === 0) return { ok: false, state, reason: "nothing-unread" };
  const next: NotificationState = {
    ...state,
    seen: { ...state.seen, [state.viewerId]: [...state.seen[state.viewerId], ...unseen.map((n) => n.id)] },
  };
  return { ok: true, state: next, count: unseen.length };
}

export type KudosError =
  | "unknown-sender"
  | "missing-recipient"
  | "unknown-recipient"
  | "self"
  | "missing-message"
  | "unknown-message";
export type KudosField = "recipient" | "message" | null;
export type KudosValidation =
  | { ok: true; fromId: PersonId; toId: PersonId; presetId: KudosPresetId }
  | { ok: false; reason: KudosError; field: KudosField };

export function validateKudos(fromId: string, toId: string, presetId: string): KudosValidation {
  const sender = getPerson(fromId);
  if (!sender) return { ok: false, reason: "unknown-sender", field: null };
  if (toId.trim() === "") return { ok: false, reason: "missing-recipient", field: "recipient" };
  const recipient = getPerson(toId);
  if (!recipient) return { ok: false, reason: "unknown-recipient", field: "recipient" };
  if (recipient.id === sender.id) return { ok: false, reason: "self", field: "recipient" };
  if (presetId.trim() === "") return { ok: false, reason: "missing-message", field: "message" };
  const preset = KUDOS_PRESETS.find((p) => p.id === presetId);
  if (!preset) return { ok: false, reason: "unknown-message", field: "message" };
  return { ok: true, fromId: sender.id, toId: recipient.id, presetId: preset.id };
}

export type SendKudosResult =
  | { ok: true; state: NotificationState; item: KudosFeedItem }
  | { ok: false; state: NotificationState; reason: KudosError; field: KudosField };

export function sendKudos(state: NotificationState, toId: string, presetId: string): SendKudosResult {
  const v = validateKudos(state.viewerId, toId, presetId);
  if (!v.ok) return { ok: false, state, reason: v.reason, field: v.field };
  const item: KudosFeedItem = {
    id: `kudos-${state.kudosSent + 1}`,
    kind: "kudos",
    fromId: v.fromId,
    toId: v.toId,
    presetId: v.presetId,
    dateLabel: "Just now",
  };
  return { ok: true, state: { ...state, feed: [item, ...state.feed], kudosSent: state.kudosSent + 1 }, item };
}

export function reset(): NotificationState {
  return INITIAL_STATE;
}

function presetLabel(presetId: KudosPresetId): string {
  return KUDOS_PRESETS.find((p) => p.id === presetId)?.label ?? presetId;
}

function nameOf(personId: string): string {
  const person = getPerson(personId);
  return person ? fullName(person) : personId;
}

export function feedItemText(item: FeedItem): string {
  if (item.kind === "announcement") return item.text;
  return `${nameOf(item.fromId)} gave ${nameOf(item.toId)} kudos: ${presetLabel(item.presetId)}`;
}

export function describeViewer(result: SetViewerResult): string {
  if (!result.ok) return "That person is not part of this demo.";
  const person = getPerson(result.viewerId)!;
  const team = getTeam(person.teamId)!;
  return `Now viewing as ${fullName(person)} (${team.name} team). ${unreadPhrase(result.unread)}.`;
}

export function describeMarkRead(result: MarkReadResult): string {
  if (result.ok) return `Marked as read: ${result.title}. ${unreadPhrase(result.unread)} left.`;
  switch (result.reason) {
    case "already-read":
      return `${getNotification(result.notificationId)!.title} is already marked as read.`;
    case "not-targeted":
      return "That notification isn't addressed to the person you're viewing as.";
    case "unknown-notification":
      return "That notification is not part of this demo.";
  }
}

export function describeMarkAll(result: MarkAllResult, viewerId: ViewerId): string {
  if (result.ok) {
    return `Marked ${result.count} ${result.count === 1 ? "notification" : "notifications"} as read. No unread notifications left.`;
  }
  return `There are no unread notifications for ${nameOf(viewerId)}.`;
}

export function describeKudos(result: SendKudosResult): string {
  if (result.ok) {
    return `Kudos sent: ${nameOf(result.item.fromId)} gave ${nameOf(result.item.toId)} a ${presetLabel(result.item.presetId)}.`;
  }
  switch (result.reason) {
    case "unknown-sender":
      return "Choose who you are viewing as before sending kudos.";
    case "missing-recipient":
      return "Choose a colleague to send kudos to.";
    case "unknown-recipient":
      return "That colleague isn't part of this demo.";
    case "self":
      return "You can't send kudos to yourself.";
    case "missing-message":
      return "Choose a kudos message.";
    case "unknown-message":
      return "That kudos message isn't available.";
  }
}

export const RESET_ANNOUNCEMENT = "Demo reset. The sample notifications, read states and kudos were restored.";
