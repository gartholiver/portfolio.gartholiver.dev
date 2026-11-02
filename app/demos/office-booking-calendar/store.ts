/**
 * Tiny in-memory store for the booking demo, shaped for useSyncExternalStore.
 *
 * State lives in module scope, so it survives client-side navigation (the module stays loaded)
 * and is discarded by a full page load — exactly the "kept while browsing, reset on refresh"
 * behaviour the demo promises. Nothing touches localStorage/sessionStorage/cookies.
 *
 * `getServerSnapshot` always returns the fixture state, so the prerendered HTML and the first
 * client render match; React then re-renders if the live snapshot differs.
 */
import {
  INITIAL_STATE,
  cancel as cancelSlot,
  reserve as reserveSlot,
  reset as resetState,
  type BookingState,
  type CancelResult,
  type ReserveResult,
} from "./booking";

export interface BookingStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): BookingState;
  getServerSnapshot(): BookingState;
  reserve(deskId: string, dayId: string): ReserveResult;
  cancel(deskId: string, dayId: string): CancelResult;
  reset(): void;
}

export function createBookingStore(
  initial: BookingState = INITIAL_STATE,
): BookingStore {
  let state = initial;
  const listeners = new Set<() => void>();

  function commit(next: BookingState) {
    if (next === state) return; // failed actions and no-op resets don't notify
    state = next;
    for (const listener of [...listeners]) listener();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_STATE,
    reserve(deskId, dayId) {
      const result = reserveSlot(state, deskId, dayId);
      commit(result.state);
      return result;
    },
    cancel(deskId, dayId) {
      const result = cancelSlot(state, deskId, dayId);
      commit(result.state);
      return result;
    },
    reset() {
      commit(resetState());
    },
  };
}

/** The shared instance used by the demo component. */
export const bookingStore = createBookingStore();
