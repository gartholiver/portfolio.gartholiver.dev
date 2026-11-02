import { contactReducer, createInitialState, type ContactAction, type ContactState } from "./contact-flow";

/**
 * Module-level, in-memory store for the contact draft (values + current step). It survives
 * collapsing the terminal, route changes and component remounts, and is gone on a full page
 * refresh. Nothing is written to localStorage, sessionStorage, cookies or the network.
 */
let state: ContactState = createInitialState();
const listeners = new Set<() => void>();

export const contactStore = {
  getState: (): ContactState => state,
  /** Prerender / hydration always starts from a fresh draft. */
  getServerState: (): ContactState => initialServerState,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  dispatch(action: ContactAction): void {
    const next = contactReducer(state, action);
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener());
  },
  /** Test helper: forget the draft without announcing anything. */
  reset(): void {
    state = createInitialState();
    listeners.forEach((listener) => listener());
  },
};

const initialServerState = createInitialState();
