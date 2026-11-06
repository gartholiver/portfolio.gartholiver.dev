import { describe, expect, it } from "vitest";
import {
  INITIAL_STATE,
  describeAudience,
  describeKudos,
  describeMarkAll,
  describeMarkRead,
  describeViewer,
  feedItemText,
  getNotification,
  isTargeted,
  markAllRead,
  markRead,
  reset,
  sendKudos,
  setViewer,
  unreadCount,
  unreadPhrase,
  unseenFor,
  seenFor,
  validateKudos,
} from "./notifications";

const n = (id: string) => getNotification(id)!;
const ids = (list: { id: string }[]) => list.map((x) => x.id);

describe("targeting", () => {
  it("addresses everyone", () => {
    for (const v of ["p-jordan", "p-lena", "p-noah"] as const) expect(isTargeted(n("n-all-hands"), v)).toBe(true);
  });
  it("addresses a team", () => {
    expect(isTargeted(n("n-support-rota"), "p-jordan")).toBe(true);
    expect(isTargeted(n("n-support-rota"), "p-lena")).toBe(false);
    expect(isTargeted(n("n-support-rota"), "p-noah")).toBe(false);
  });
  it("addresses a named person", () => {
    expect(isTargeted(n("n-equipment-lena"), "p-lena")).toBe(true);
    expect(isTargeted(n("n-equipment-lena"), "p-jordan")).toBe(false);
    expect(isTargeted(n("n-equipment-lena"), "p-noah")).toBe(false);
  });
  it("addresses two teams", () => {
    expect(isTargeted(n("n-security-refresher"), "p-jordan")).toBe(true);
    expect(isTargeted(n("n-security-refresher"), "p-lena")).toBe(true);
    expect(isTargeted(n("n-security-refresher"), "p-noah")).toBe(false);
  });
});

describe("unseen and seen lists", () => {
  it("starts with the expected unread counts and lists", () => {
    expect(unreadCount(INITIAL_STATE, "p-jordan")).toBe(4);
    expect(unreadCount(INITIAL_STATE, "p-lena")).toBe(3);
    expect(unreadCount(INITIAL_STATE, "p-noah")).toBe(2);
    expect(ids(unseenFor(INITIAL_STATE, "p-jordan"))).toEqual([
      "n-all-hands",
      "n-support-rota",
      "n-security-refresher",
      "n-welcome-jordan",
    ]);
    expect(ids(seenFor(INITIAL_STATE, "p-jordan"))).toEqual(["n-wellbeing"]);
  });
});

describe("mark as read", () => {
  it("marks one notification immutably and per viewer", () => {
    const r = markRead(INITIAL_STATE, "n-support-rota");
    expect(r).toMatchObject({ ok: true, unread: 3 });
    expect(r.state.seen["p-jordan"]).toContain("n-support-rota");
    expect(r.state.seen["p-lena"]).toBe(INITIAL_STATE.seen["p-lena"]);
    expect(INITIAL_STATE.seen["p-jordan"]).not.toContain("n-support-rota");
    expect(describeMarkRead(r)).toBe("Marked as read: New weekend rota for the Support Desk. 3 unread notifications left.");
  });

  it("reports each failure and keeps the same state", () => {
    const already = markRead(INITIAL_STATE, "n-wellbeing");
    expect(already).toMatchObject({ ok: false, reason: "already-read" });
    expect(already.state).toBe(INITIAL_STATE);
    expect(describeMarkRead(already)).toBe("New wellbeing guides is already marked as read.");

    const notTargeted = markRead(INITIAL_STATE, "n-design-tokens");
    expect(notTargeted).toMatchObject({ ok: false, reason: "not-targeted" });
    expect(notTargeted.state).toBe(INITIAL_STATE);
    expect(describeMarkRead(notTargeted)).toBe("That notification isn't addressed to the person you're viewing as.");

    const unknown = markRead(INITIAL_STATE, "n-nope");
    expect(unknown).toMatchObject({ ok: false, reason: "unknown-notification" });
    expect(unknown.state).toBe(INITIAL_STATE);
    expect(describeMarkRead(unknown)).toBe("That notification is not part of this demo.");
  });

  it("marks all as read, then reports nothing unread", () => {
    const r = markAllRead(INITIAL_STATE);
    expect(r).toMatchObject({ ok: true, count: 4 });
    expect(unreadCount(r.state, "p-jordan")).toBe(0);
    expect(describeMarkAll(r, "p-jordan")).toBe("Marked 4 notifications as read. No unread notifications left.");

    const again = markAllRead(r.state);
    expect(again).toMatchObject({ ok: false, reason: "nothing-unread" });
    expect(again.state).toBe(r.state);
    expect(describeMarkAll(again, "p-jordan")).toBe("There are no unread notifications for Jordan Reyes.");
  });

  it("singularises the mark-all announcement", () => {
    let state = INITIAL_STATE;
    for (const id of ["n-all-hands", "n-support-rota", "n-security-refresher"]) {
      const r = markRead(state, id);
      if (r.ok) state = r.state;
    }
    expect(describeMarkAll(markAllRead(state), "p-jordan")).toBe(
      "Marked 1 notification as read. No unread notifications left.",
    );
  });

  it("keeps read state per viewer", () => {
    const all = markAllRead(INITIAL_STATE);
    const lena = setViewer(all.state, "p-lena");
    expect(lena.ok && lena.unread).toBe(3);
  });
});

describe("viewer", () => {
  it("switches viewer", () => {
    const r = setViewer(INITIAL_STATE, "p-lena");
    expect(r).toMatchObject({ ok: true, viewerId: "p-lena", unread: 3 });
    expect(describeViewer(r)).toBe("Now viewing as Lena Kowalski (Web team). 3 unread notifications.");
  });
  it("returns the same state for the same viewer", () => {
    const r = setViewer(INITIAL_STATE, "p-jordan");
    expect(r.ok).toBe(true);
    expect(r.state).toBe(INITIAL_STATE);
  });
  it("rejects an unknown viewer", () => {
    const r = setViewer(INITIAL_STATE, "p-sam");
    expect(r).toMatchObject({ ok: false, reason: "unknown-viewer" });
    expect(r.state).toBe(INITIAL_STATE);
    expect(describeViewer(r)).toBe("That person is not part of this demo.");
  });
});

describe("kudos", () => {
  it("reports each validation error in order", () => {
    const cases: [string, string, string, string, string | null, string][] = [
      ["p-jordan", "", "high-five", "missing-recipient", "recipient", "Choose a colleague to send kudos to."],
      ["p-jordan", "p-nobody", "high-five", "unknown-recipient", "recipient", "That colleague isn't part of this demo."],
      ["p-jordan", "p-jordan", "high-five", "self", "recipient", "You can't send kudos to yourself."],
      ["p-jordan", "p-lena", "", "missing-message", "message", "Choose a kudos message."],
      ["p-jordan", "p-lena", "hug", "unknown-message", "message", "That kudos message isn't available."],
      ["p-nobody", "p-lena", "high-five", "unknown-sender", null, "Choose who you are viewing as before sending kudos."],
      ["p-jordan", "", "", "missing-recipient", "recipient", "Choose a colleague to send kudos to."],
    ];
    for (const [from, to, preset, reason, field] of cases) {
      expect(validateKudos(from, to, preset)).toEqual({ ok: false, reason, field });
    }
    const failed = sendKudos(INITIAL_STATE, "", "");
    expect(failed.ok).toBe(false);
    expect(describeKudos(sendKudos(INITIAL_STATE, "p-jordan", "high-five"))).toBe("You can't send kudos to yourself.");
    expect(describeKudos(sendKudos(INITIAL_STATE, "", "high-five"))).toBe("Choose a colleague to send kudos to.");
    expect(describeKudos({ ok: false, state: INITIAL_STATE, reason: "unknown-sender", field: null })).toBe(
      "Choose who you are viewing as before sending kudos.",
    );
  });

  it("prepends a feed item with a counter id", () => {
    const first = sendKudos(INITIAL_STATE, "p-lena", "high-five");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.state.feed[0]).toEqual({
      id: "kudos-1",
      kind: "kudos",
      fromId: "p-jordan",
      toId: "p-lena",
      presetId: "high-five",
      dateLabel: "Just now",
    });
    expect(first.state.kudosSent).toBe(1);
    expect(first.state.feed).toHaveLength(5);
    expect(INITIAL_STATE.feed).toHaveLength(4);
    expect(describeKudos(first)).toBe("Kudos sent: Jordan Reyes gave Lena Kowalski a High Five.");
    expect(feedItemText(first.item)).toBe("Jordan Reyes gave Lena Kowalski kudos: High Five");

    const second = sendKudos(first.state, "p-sam", "thank-you");
    expect(second.ok && second.item.id).toBe("kudos-2");
  });

  it("returns the same state for a failed kudos", () => {
    expect(sendKudos(INITIAL_STATE, "p-jordan", "high-five").state).toBe(INITIAL_STATE);
    expect(sendKudos(INITIAL_STATE, "p-lena", "").state).toBe(INITIAL_STATE);
  });

  it("renders announcement feed items as plain text", () => {
    expect(feedItemText(INITIAL_STATE.feed[0]!)).toBe("Welcome to everyone who joined Customer Support this week.");
  });
});

describe("helpers", () => {
  it("describes audiences", () => {
    expect(describeAudience(n("n-security-refresher"), "p-jordan")).toBe("Support Desk team, Web team");
    expect(describeAudience(n("n-welcome-jordan"), "p-jordan")).toBe("You");
    expect(describeAudience(n("n-all-hands"), "p-jordan")).toBe("Everyone");
    expect(describeAudience(n("n-welcome-jordan"), "p-lena")).toBe("Jordan Reyes");
  });
  it("resets to the initial state object", () => {
    expect(reset()).toBe(INITIAL_STATE);
  });
  it("phrases unread counts", () => {
    expect(unreadPhrase(1)).toBe("1 unread notification");
    expect(unreadPhrase(0)).toBe("0 unread notifications");
    expect(unreadPhrase(3)).toBe("3 unread notifications");
  });
});
