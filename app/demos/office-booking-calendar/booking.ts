/**
 * Pure booking rules for the office booking demo. No React, no module state: every function takes
 * a BookingState and returns a result carrying the next state (the same object when nothing
 * changed). The in-memory store (./store.ts) and the component build on this.
 *
 * Rules
 * - A desk/day slot is either free, held by "you" (the demo user) or held by "other" (a fictional
 *   person from the fixtures).
 * - Slots held by others can never be reserved over or cancelled.
 * - The demo user can hold ONE desk per day. Reserving a second desk on a day you already have a
 *   desk MOVES the reservation (the old desk is released, the new one taken) rather than failing.
 * - Reserving a desk you already hold is a no-op failure ("already-yours"); cancelling a free slot
 *   is a no-op failure ("not-reserved").
 */
import {
  DAYS,
  DEMO_USER_NAME,
  DESKS,
  INITIAL_RESERVATIONS,
  type DayId,
  type DeskId,
} from "~/fixtures/office-booking-calendar";

export type Owner = "you" | "other";

export interface Reservation {
  deskId: DeskId;
  dayId: DayId;
  owner: Owner;
  /** Display name: the demo user or a fictional colleague. */
  holder: string;
}

export interface BookingState {
  readonly reservations: readonly Reservation[];
}

export type ReserveResult =
  | {
      ok: true;
      state: BookingState;
      outcome: "reserved";
      deskId: DeskId;
      dayId: DayId;
    }
  | {
      ok: true;
      state: BookingState;
      outcome: "moved";
      deskId: DeskId;
      dayId: DayId;
      fromDeskId: DeskId;
    }
  | {
      ok: false;
      state: BookingState;
      reason: "unknown-slot" | "taken" | "already-yours";
      deskId: string;
      dayId: string;
    };

export type CancelResult =
  | { ok: true; state: BookingState; deskId: DeskId; dayId: DayId }
  | {
      ok: false;
      state: BookingState;
      reason: "unknown-slot" | "not-reserved" | "not-yours";
      deskId: string;
      dayId: string;
    };

const isDeskId = (id: string): id is DeskId => DESKS.some((d) => d.id === id);
const isDayId = (id: string): id is DayId => DAYS.some((d) => d.id === id);

export function getDeskName(deskId: string): string {
  return DESKS.find((d) => d.id === deskId)?.name ?? deskId;
}
export function getDay(dayId: string) {
  return DAYS.find((d) => d.id === dayId);
}

/** The state the demo starts in and returns to on reset. Frozen so every consumer shares one value. */
export const INITIAL_STATE: BookingState = Object.freeze({
  reservations: Object.freeze(
    INITIAL_RESERVATIONS.map((r): Reservation =>
      Object.freeze({
        deskId: r.deskId,
        dayId: r.dayId,
        owner: "other",
        holder: r.holder,
      }),
    ),
  ),
});

export function findReservation(
  state: BookingState,
  deskId: string,
  dayId: string,
): Reservation | undefined {
  return state.reservations.find(
    (r) => r.deskId === deskId && r.dayId === dayId,
  );
}

export function yourReservations(state: BookingState): Reservation[] {
  return state.reservations.filter((r) => r.owner === "you");
}

export function yourReservationOnDay(
  state: BookingState,
  dayId: string,
): Reservation | undefined {
  return state.reservations.find((r) => r.owner === "you" && r.dayId === dayId);
}

export function reserve(
  state: BookingState,
  deskId: string,
  dayId: string,
): ReserveResult {
  if (!isDeskId(deskId) || !isDayId(dayId))
    return { ok: false, state, reason: "unknown-slot", deskId, dayId };

  const existing = findReservation(state, deskId, dayId);
  if (existing) {
    return {
      ok: false,
      state,
      reason: existing.owner === "you" ? "already-yours" : "taken",
      deskId,
      dayId,
    };
  }

  const mine = yourReservationOnDay(state, dayId);
  const kept = state.reservations.filter((r) => r !== mine);
  const next: BookingState = {
    reservations: [
      ...kept,
      { deskId, dayId, owner: "you", holder: DEMO_USER_NAME },
    ],
  };
  return mine
    ? {
        ok: true,
        state: next,
        outcome: "moved",
        deskId,
        dayId,
        fromDeskId: mine.deskId,
      }
    : { ok: true, state: next, outcome: "reserved", deskId, dayId };
}

export function cancel(
  state: BookingState,
  deskId: string,
  dayId: string,
): CancelResult {
  if (!isDeskId(deskId) || !isDayId(dayId))
    return { ok: false, state, reason: "unknown-slot", deskId, dayId };

  const existing = findReservation(state, deskId, dayId);
  if (!existing)
    return { ok: false, state, reason: "not-reserved", deskId, dayId };
  if (existing.owner !== "you")
    return { ok: false, state, reason: "not-yours", deskId, dayId };

  return {
    ok: true,
    state: { reservations: state.reservations.filter((r) => r !== existing) },
    deskId,
    dayId,
  };
}

/** Restore the fixtures. Always returns the shared initial state object. */
export function reset(): BookingState {
  return INITIAL_STATE;
}

/** Plain-language result for the polite live region. */
export function describeReserve(result: ReserveResult): string {
  const desk = getDeskName(result.deskId);
  const day = getDay(result.dayId)?.weekday ?? result.dayId;
  if (result.ok) {
    return result.outcome === "moved"
      ? `${desk} reserved for ${day}. Your reservation moved from ${getDeskName(result.fromDeskId)}.`
      : `${desk} reserved for ${day}.`;
  }
  switch (result.reason) {
    case "taken":
      return `${desk} on ${day} is already reserved by someone else.`;
    case "already-yours":
      return `You already have ${desk} on ${day}.`;
    default:
      return "That desk and day are not part of this demo.";
  }
}

export function describeCancel(result: CancelResult): string {
  const desk = getDeskName(result.deskId);
  const day = getDay(result.dayId)?.weekday ?? result.dayId;
  if (result.ok) return `Your ${desk} reservation for ${day} was cancelled.`;
  switch (result.reason) {
    case "not-yours":
      return `${desk} on ${day} is reserved by someone else, so it can't be cancelled here.`;
    case "not-reserved":
      return `${desk} on ${day} is not reserved.`;
    default:
      return "That desk and day are not part of this demo.";
  }
}

export const RESET_ANNOUNCEMENT =
  "Demo reset. The sample reservations were restored.";
