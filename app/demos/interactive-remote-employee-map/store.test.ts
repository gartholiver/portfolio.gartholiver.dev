import { describe, expect, it, vi } from "vitest";
import { INITIAL_STATE } from "./employee-map";
import { createEmployeeMapStore } from "./store";

describe("employee map store", () => {
  it("serves the initial state as both client and server snapshot", () => {
    const store = createEmployeeMapStore();
    expect(store.getSnapshot()).toBe(INITIAL_STATE);
    expect(store.getServerSnapshot()).toBe(INITIAL_STATE);
  });

  it("does not notify on no-ops", () => {
    const store = createEmployeeMapStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setDepartment("all");
    store.setDepartment("finance");
    store.closeProfile();
    store.selectPerson("p-nobody");
    store.reset();
    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies on select, filter and close", () => {
    const store = createEmployeeMapStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.selectPerson("p-avery")).toMatchObject({ ok: true });
    expect(listener).toHaveBeenCalledTimes(1);
    store.setDepartment("engineering");
    expect(listener).toHaveBeenCalledTimes(2);
    store.closeProfile();
    expect(listener).toHaveBeenCalledTimes(3);
    expect(store.getSnapshot()).toEqual({ department: "engineering", selectedId: null });
    store.reset();
    expect(listener).toHaveBeenCalledTimes(4);
    expect(store.getSnapshot()).toBe(INITIAL_STATE);
  });

  it("stops notifying after unsubscribe and keeps stores independent", () => {
    const a = createEmployeeMapStore();
    const b = createEmployeeMapStore();
    const listener = vi.fn();
    const unsubscribe = a.subscribe(listener);
    unsubscribe();
    a.selectPerson("p-avery");
    expect(listener).not.toHaveBeenCalled();
    expect(b.getSnapshot()).toBe(INITIAL_STATE);
  });
});
