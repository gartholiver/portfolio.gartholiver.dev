/**
 * Tiny in-memory store for the notification centre demo, shaped for useSyncExternalStore.
 *
 * State lives in module scope, so it survives client-side navigation and is discarded by a full
 * page load. Nothing touches web storage or cookies. `getServerSnapshot` always
 * returns the initial state so the prerendered HTML and the first client render match.
 */
import {
  INITIAL_STATE,
  markAllRead as markAll,
  markRead as markOne,
  reset as resetState,
  sendKudos as sendKudosRule,
  setViewer as setViewerRule,
  type MarkAllResult,
  type MarkReadResult,
  type NotificationState,
  type SendKudosResult,
  type SetViewerResult,
} from "./notifications";

export interface NotificationStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): NotificationState;
  getServerSnapshot(): NotificationState;
  setViewer(viewerId: string): SetViewerResult;
  markRead(notificationId: string): MarkReadResult;
  markAllRead(): MarkAllResult;
  sendKudos(toId: string, presetId: string): SendKudosResult;
  reset(): void;
}

export function createNotificationStore(initial: NotificationState = INITIAL_STATE): NotificationStore {
  let state = initial;
  const listeners = new Set<() => void>();

  function commit(next: NotificationState) {
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
    setViewer(viewerId) {
      const result = setViewerRule(state, viewerId);
      commit(result.state);
      return result;
    },
    markRead(notificationId) {
      const result = markOne(state, notificationId);
      commit(result.state);
      return result;
    },
    markAllRead() {
      const result = markAll(state);
      commit(result.state);
      return result;
    },
    sendKudos(toId, presetId) {
      const result = sendKudosRule(state, toId, presetId);
      commit(result.state);
      return result;
    },
    reset() {
      commit(resetState());
    },
  };
}

/** The shared instance used by the demo component. */
export const notificationStore = createNotificationStore();
