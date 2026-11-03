/**
 * Tiny in-memory store for the onboarding demo, shaped for useSyncExternalStore.
 *
 * State lives in module scope, so it survives client-side navigation and is discarded by a full
 * page load. Nothing touches web storage or cookies. `getServerSnapshot` always
 * returns the initial state so the prerendered HTML and the first client render match.
 */
import {
  INITIAL_STATE,
  back as goBack,
  complete as completeFlow,
  next as goNext,
  reset as resetState,
  type CompleteResult,
  type MoveResult,
  type OnboardingState,
} from "./onboarding";

export interface OnboardingStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): OnboardingState;
  getServerSnapshot(): OnboardingState;
  next(): MoveResult;
  back(): MoveResult;
  complete(): CompleteResult;
  reset(): void;
}

export function createOnboardingStore(initial: OnboardingState = INITIAL_STATE): OnboardingStore {
  let state = initial;
  const listeners = new Set<() => void>();

  function commit(nextState: OnboardingState) {
    if (nextState === state) return; // failed actions and no-op resets don't notify
    state = nextState;
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
    next() {
      const result = goNext(state);
      commit(result.state);
      return result;
    },
    back() {
      const result = goBack(state);
      commit(result.state);
      return result;
    },
    complete() {
      const result = completeFlow(state);
      commit(result.state);
      return result;
    },
    reset() {
      commit(resetState());
    },
  };
}

/** The shared instance used by the demo component. */
export const onboardingStore = createOnboardingStore();
