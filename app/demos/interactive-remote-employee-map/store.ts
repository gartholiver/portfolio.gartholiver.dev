/**
 * Tiny in-memory store for the employee map demo, shaped for useSyncExternalStore.
 *
 * State lives in module scope, so it survives client-side navigation and is discarded by a full
 * page load. Nothing touches web storage or cookies. `getServerSnapshot` always
 * returns the initial state so the prerendered HTML and the first client render match.
 */
import {
  INITIAL_STATE,
  closeProfile as closeRule,
  reset as resetState,
  selectPerson as selectRule,
  setDepartment as setDepartmentRule,
  type FilterResult,
  type MapState,
  type SelectResult,
} from "./employee-map";

export interface EmployeeMapStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): MapState;
  getServerSnapshot(): MapState;
  setDepartment(department: string): FilterResult;
  selectPerson(personId: string): SelectResult;
  closeProfile(): void;
  reset(): void;
}

export function createEmployeeMapStore(initial: MapState = INITIAL_STATE): EmployeeMapStore {
  let state = initial;
  const listeners = new Set<() => void>();

  function commit(next: MapState) {
    if (next === state) return; // failed actions and no-ops don't notify
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
    setDepartment(department) {
      const result = setDepartmentRule(state, department);
      commit(result.state);
      return result;
    },
    selectPerson(personId) {
      const result = selectRule(state, personId);
      commit(result.state);
      return result;
    },
    closeProfile() {
      commit(closeRule(state));
    },
    reset() {
      commit(resetState());
    },
  };
}

/** The shared instance used by the demo component. */
export const employeeMapStore = createEmployeeMapStore();
