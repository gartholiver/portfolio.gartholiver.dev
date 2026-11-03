import { describe, expect, it, vi } from "vitest";
import { INITIAL_STATE, unreadCount } from "./notifications";
import { createNotificationStore } from "./store";

describe("notification store", () => {
  it("serves the initial state as both client and server snapshot", () => {
    const store = createNotificationStore();
    expect(store.getSnapshot()).toBe(INITIAL_STATE);
    expect(store.getServerSnapshot()).toBe(INITIAL_STATE);
  });

  it("does not notify on failed actions", () => {
    const store = createNotificationStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.markRead("n-wellbeing");
    store.setViewer("p-jordan");
    store.setViewer("p-sam");
    store.sendKudos("", "");
    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies once per successful mark as read", () => {
    const store = createNotificationStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.markRead("n-support-rota")).toMatchObject({ ok: true });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(unreadCount(store.getSnapshot(), "p-jordan")).toBe(3);
    store.markAllRead();
    expect(listener).toHaveBeenCalledTimes(2);
    store.markAllRead(); // nothing unread
    expect(listener).toHaveBeenCalledTimes(2);
    store.setViewer("p-lena");
    store.sendKudos("p-noah", "great-job");
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("reset is quiet when pristine", () => {
    const store = createNotificationStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.reset();
    expect(listener).not.toHaveBeenCalled();
    store.markAllRead();
    listener.mockClear();
    store.reset();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(INITIAL_STATE);
  });

  it("stops notifying after unsubscribe and keeps stores independent", () => {
    const a = createNotificationStore();
    const b = createNotificationStore();
    const listener = vi.fn();
    const unsubscribe = a.subscribe(listener);
    unsubscribe();
    a.markAllRead();
    expect(listener).not.toHaveBeenCalled();
    expect(b.getSnapshot()).toBe(INITIAL_STATE);
  });
});
