import { describe, expect, it } from "vitest";
import { INITIAL_RESERVATIONS } from "~/fixtures/office-booking-calendar";
import {
  INITIAL_STATE,
  cancel,
  describeCancel,
  describeReserve,
  findReservation,
  reserve,
  reset,
  yourReservations,
} from "./booking";

// Fixture facts these tests rely on: Desk A2 is taken by someone else on Monday; A1/B1/B2 are free.
describe("booking rules", () => {
  it("starts with only the fictional fixture reservations", () => {
    expect(INITIAL_STATE.reservations).toHaveLength(
      INITIAL_RESERVATIONS.length,
    );
    expect(INITIAL_STATE.reservations.every((r) => r.owner === "other")).toBe(
      true,
    );
    expect(yourReservations(INITIAL_STATE)).toEqual([]);
  });

  it("reserves an available slot for the demo user without mutating the previous state", () => {
    const result = reserve(INITIAL_STATE, "A1", "mon");
    expect(result).toMatchObject({
      ok: true,
      outcome: "reserved",
      deskId: "A1",
      dayId: "mon",
    });
    expect(findReservation(result.state, "A1", "mon")).toMatchObject({
      owner: "you",
    });
    expect(findReservation(INITIAL_STATE, "A1", "mon")).toBeUndefined();
    expect(describeReserve(result)).toBe("Desk A1 reserved for Monday.");
  });

  it("cannot reserve a slot held by someone else", () => {
    const result = reserve(INITIAL_STATE, "A2", "mon");
    expect(result).toMatchObject({ ok: false, reason: "taken" });
    expect(result.state).toBe(INITIAL_STATE);
    expect(findReservation(result.state, "A2", "mon")?.owner).toBe("other");
  });

  it("cannot cancel a reservation held by someone else", () => {
    const result = cancel(INITIAL_STATE, "A2", "mon");
    expect(result).toMatchObject({ ok: false, reason: "not-yours" });
    expect(result.state).toBe(INITIAL_STATE);
    expect(describeCancel(result)).toMatch(/can't be cancelled/);
  });

  it("rejects reserving your own slot again and cancelling a free slot", () => {
    const { state } = reserve(INITIAL_STATE, "A1", "mon");
    expect(reserve(state, "A1", "mon")).toMatchObject({
      ok: false,
      reason: "already-yours",
      state,
    });
    expect(cancel(INITIAL_STATE, "A1", "mon")).toMatchObject({
      ok: false,
      reason: "not-reserved",
    });
  });

  it("rejects unknown desks and days", () => {
    expect(reserve(INITIAL_STATE, "Z9", "mon")).toMatchObject({
      ok: false,
      reason: "unknown-slot",
    });
    expect(reserve(INITIAL_STATE, "A1", "sun")).toMatchObject({
      ok: false,
      reason: "unknown-slot",
    });
    expect(cancel(INITIAL_STATE, "Z9", "mon")).toMatchObject({
      ok: false,
      reason: "unknown-slot",
    });
  });

  it("allows one desk per day: a second desk the same day moves the reservation", () => {
    const first = reserve(INITIAL_STATE, "A1", "mon");
    const second = reserve(first.state, "B1", "mon");
    expect(second).toMatchObject({
      ok: true,
      outcome: "moved",
      fromDeskId: "A1",
      deskId: "B1",
    });
    expect(findReservation(second.state, "A1", "mon")).toBeUndefined();
    expect(findReservation(second.state, "B1", "mon")?.owner).toBe("you");
    expect(yourReservations(second.state)).toHaveLength(1);
    expect(describeReserve(second)).toBe(
      "Desk B1 reserved for Monday. Your reservation moved from Desk A1.",
    );
  });

  it("allows a desk on different days", () => {
    const a = reserve(INITIAL_STATE, "A1", "mon");
    const b = reserve(a.state, "A1", "wed" as const);
    const c = reserve(b.state, "B2", "mon");
    expect(c.ok).toBe(true);
    expect(
      yourReservations(c.state)
        .map((r) => `${r.deskId}-${r.dayId}`)
        .sort(),
    ).toEqual(["A1-wed", "B2-mon"]);
  });

  it("cancels your own reservation and leaves others alone", () => {
    const { state } = reserve(INITIAL_STATE, "A1", "mon");
    const result = cancel(state, "A1", "mon");
    expect(result).toMatchObject({ ok: true });
    expect(result.state.reservations).toHaveLength(
      INITIAL_STATE.reservations.length,
    );
    expect(yourReservations(result.state)).toEqual([]);
    expect(describeCancel(result)).toBe(
      "Your Desk A1 reservation for Monday was cancelled.",
    );
  });

  it("reset restores the fixtures", () => {
    const { state } = reserve(INITIAL_STATE, "A1", "mon");
    expect(state).not.toBe(INITIAL_STATE);
    expect(reset()).toBe(INITIAL_STATE);
  });
});
