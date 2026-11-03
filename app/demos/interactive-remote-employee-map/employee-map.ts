/**
 * Pure rules for the remote employee map demo. No React, no module state: every function takes a
 * MapState and returns a result carrying the next state (the same object when nothing changed).
 *
 * Rules
 * - The department filter narrows the markers and the people list together.
 * - At most one profile is open; changing the filter never closes it.
 * - Locations are approximate by design: only a fictional town and region are ever shown.
 */
import {
  DEMO_USER_ID,
  MAP_HEIGHT,
  MAP_WIDTH,
  PEOPLE,
  fullName,
  getDepartment,
  getPerson,
  isDepartmentId,
  isPersonId,
  type DepartmentId,
  type Person,
  type PersonId,
} from "~/fixtures/intranet";

export type DepartmentFilter = DepartmentId | "all";

export interface MapState {
  readonly department: DepartmentFilter;
  readonly selectedId: PersonId | null;
}

export const INITIAL_STATE: MapState = Object.freeze({ department: "all", selectedId: null });

export type FilterResult =
  | { ok: true; state: MapState; department: DepartmentFilter; count: number }
  | { ok: false; state: MapState; reason: "unknown-department"; department: string };
export type SelectResult =
  | { ok: true; state: MapState; personId: PersonId }
  | { ok: false; state: MapState; reason: "unknown-person"; personId: string };

export function visiblePeople(state: MapState): readonly Person[] {
  return state.department === "all" ? PEOPLE : PEOPLE.filter((p) => p.departmentId === state.department);
}

export function setDepartment(state: MapState, department: string): FilterResult {
  if (department !== "all" && !isDepartmentId(department)) {
    return { ok: false, state, reason: "unknown-department", department };
  }
  const filter = department as DepartmentFilter;
  const next = filter === state.department ? state : { ...state, department: filter };
  return { ok: true, state: next, department: filter, count: visiblePeople(next).length };
}

export function selectPerson(state: MapState, personId: string): SelectResult {
  if (!isPersonId(personId)) return { ok: false, state, reason: "unknown-person", personId };
  const next = state.selectedId === personId ? state : { ...state, selectedId: personId };
  return { ok: true, state: next, personId };
}

export function closeProfile(state: MapState): MapState {
  return state.selectedId === null ? state : { ...state, selectedId: null };
}

export function reset(): MapState {
  return INITIAL_STATE;
}

export function getManager(person: Person): Person | undefined {
  return person.managerId === null ? undefined : getPerson(person.managerId);
}

export function getDirectReports(person: Person): Person[] {
  return PEOPLE.filter((p) => p.managerId === person.id);
}

export function isDemoUser(person: Person): boolean {
  return person.id === DEMO_USER_ID;
}

export function describeLocation(person: Person): string {
  return `near ${person.city}, ${person.region}`;
}

export function markerLabel(person: Person): string {
  const department = getDepartment(person.departmentId)?.name ?? "";
  return `${isDemoUser(person) ? "You: " : ""}${fullName(person)}, ${department}, near ${person.city}`;
}

export function markerPosition(person: Person): { left: string; top: string } {
  return {
    left: `${Math.round((person.map.x / MAP_WIDTH) * 100000) / 1000}%`,
    top: `${Math.round((person.map.y / MAP_HEIGHT) * 100000) / 1000}%`,
  };
}

export function formatPeople(count: number): string {
  return count === 1 ? "1 person" : `${count} people`;
}

export function summaryLabel(state: MapState): string {
  return `Showing ${visiblePeople(state).length} of ${PEOPLE.length} people`;
}

export function describeFilter(result: FilterResult): string {
  if (!result.ok) return "That department is not part of this demo.";
  if (result.department === "all") return `Showing all ${PEOPLE.length} people.`;
  return `Showing ${formatPeople(result.count)} in ${getDepartment(result.department)!.name}.`;
}

export const RESET_ANNOUNCEMENT = "Demo reset. All departments are shown and no profile is open.";
