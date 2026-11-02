import { describe, expect, it, vi } from "vitest";
import { INITIAL_STATE, findReservation, yourReservations } from "./booking";
import { createBookingStore } from "./store";

describe("booking store", () => {
  it("serves the fixtures as both client and server snapshot", () => {
    const store = createBookingStore();
    expect(store.getSnapshot()).toBe(INITIAL_STATE);
    expect(store.getServerSnapshot()).toBe(INITIAL_STATE);
  });

  it("notifies subscribers when state changes, and not on failed actions", () => {
    const store = createBookingStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.reserve("A1", "mon");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(findReservation(store.getSnapshot(), "A1", "mon")?.owner).toBe(
      "you",
    );

    store.reserve("A2", "mon"); // held by someone else: rejected
    store.cancel("A2", "mon");
    store.cancel("B1", "tue"); // free slot
    expect(listener).toHaveBeenCalledTimes(1);

    store.cancel("A1", "mon");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(yourReservations(store.getSnapshot())).toEqual([]);
  });

  it("reset restores the fixtures, notifies once, and is quiet when already pristine", () => {
    const store = createBookingStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.reset();
    expect(listener).not.toHaveBeenCalled();

    store.reserve("B2", "thu");
    listener.mockClear();
    store.reset();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(INITIAL_STATE);
  });

  it("stops notifying after unsubscribe, and keeps stores independent", () => {
    const a = createBookingStore();
    const b = createBookingStore();
    const listener = vi.fn();
    const unsubscribe = a.subscribe(listener);
    unsubscribe();
    a.reserve("A1", "mon");
    expect(listener).not.toHaveBeenCalled();
    expect(yourReservations(b.getSnapshot())).toEqual([]);
  });

  it("returns action results for announcements", () => {
    const store = createBookingStore();
    expect(store.reserve("A1", "mon")).toMatchObject({
      ok: true,
      outcome: "reserved",
    });
    expect(store.reserve("A2", "mon")).toMatchObject({
      ok: false,
      reason: "taken",
    });
  });
});
