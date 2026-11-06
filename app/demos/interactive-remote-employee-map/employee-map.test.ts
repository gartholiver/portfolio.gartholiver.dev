import { describe, expect, it } from "vitest";
import { getPerson } from "~/fixtures/intranet";
import {
  INITIAL_STATE,
  closeProfile,
  describeFilter,
  describeLocation,
  formatPeople,
  getDirectReports,
  getManager,
  markerLabel,
  markerPosition,
  reset,
  selectPerson,
  setDepartment,
  summaryLabel,
  visiblePeople,
} from "./employee-map";

const person = (id: string) => getPerson(id)!;
const idsOf = (list: readonly { id: string }[]) => list.map((p) => p.id);

describe("employee map rules", () => {
  it("shows everyone initially", () => {
    expect(visiblePeople(INITIAL_STATE)).toHaveLength(12);
    expect(summaryLabel(INITIAL_STATE)).toBe("Showing 12 of 12 people");
  });

  it("filters by department", () => {
    const r = setDepartment(INITIAL_STATE, "engineering");
    expect(r).toMatchObject({ ok: true, count: 4, department: "engineering" });
    expect(idsOf(visiblePeople(r.state))).toEqual(["p-priya", "p-marcus", "p-tomas", "p-lena"]);
    expect(describeFilter(r)).toBe("Showing 4 people in Engineering.");
    expect(summaryLabel(r.state)).toBe("Showing 4 of 12 people");
  });

  it("returns to all departments", () => {
    const engineering = setDepartment(INITIAL_STATE, "engineering").state;
    const r = setDepartment(engineering, "all");
    expect(r).toMatchObject({ ok: true, count: 12 });
    expect(describeFilter(r)).toBe("Showing all 12 people.");
  });

  it("rejects an unknown department", () => {
    const r = setDepartment(INITIAL_STATE, "finance");
    expect(r).toMatchObject({ ok: false, reason: "unknown-department" });
    expect(r.state).toBe(INITIAL_STATE);
    expect(describeFilter(r)).toBe("That department is not part of this demo.");
  });

  it("treats the same filter as a no-op", () => {
    const r = setDepartment(INITIAL_STATE, "all");
    expect(r.ok).toBe(true);
    expect(r.state).toBe(INITIAL_STATE);
  });

  it("selects a person", () => {
    const r = selectPerson(INITIAL_STATE, "p-avery");
    expect(r).toMatchObject({ ok: true, personId: "p-avery" });
    expect(r.state.selectedId).toBe("p-avery");
  });

  it("rejects an unknown person", () => {
    const r = selectPerson(INITIAL_STATE, "p-nobody");
    expect(r).toMatchObject({ ok: false, reason: "unknown-person" });
    expect(r.state).toBe(INITIAL_STATE);
  });

  it("treats selecting the open person as a no-op", () => {
    const first = selectPerson(INITIAL_STATE, "p-avery").state;
    const again = selectPerson(first, "p-avery");
    expect(again.ok).toBe(true);
    expect(again.state).toBe(first);
  });

  it("keeps the selection when the filter changes", () => {
    const selected = selectPerson(INITIAL_STATE, "p-avery").state;
    expect(setDepartment(selected, "engineering").state.selectedId).toBe("p-avery");
  });

  it("closing with nothing open keeps the same state", () => {
    expect(closeProfile(INITIAL_STATE)).toBe(INITIAL_STATE);
    const selected = selectPerson(INITIAL_STATE, "p-avery").state;
    expect(closeProfile(selected).selectedId).toBeNull();
  });

  it("derives managers and direct reports", () => {
    expect(getManager(person("p-lena"))?.id).toBe("p-tomas");
    expect(getManager(person("p-avery"))).toBeUndefined();
    expect(idsOf(getDirectReports(person("p-priya")))).toEqual(["p-marcus", "p-tomas"]);
    expect(idsOf(getDirectReports(person("p-avery")))).toEqual(["p-sam"]);
    expect(getDirectReports(person("p-sam"))).toEqual([]);
    expect(getManager(person("p-jordan"))?.id).toBe("p-ruth");
  });

  it("builds marker labels and approximate locations", () => {
    expect(markerLabel(person("p-avery"))).toBe("Avery Lin, Product Design, near Harbor City");
    expect(markerLabel(person("p-jordan"))).toBe("You: Jordan Reyes, Customer Support, near Maple Grove");
    expect(describeLocation(person("p-avery"))).toBe("near Harbor City, Coastal Region");
  });

  it("positions markers as percentages", () => {
    expect(markerPosition(person("p-avery"))).toEqual({ left: "13.333%", top: "30%" });
    expect(markerPosition(person("p-jordan"))).toEqual({ left: "86.667%", top: "65%" });
  });

  it("formats people counts", () => {
    expect(formatPeople(1)).toBe("1 person");
    expect(formatPeople(2)).toBe("2 people");
  });

  it("reset returns the initial state object", () => {
    expect(reset()).toBe(INITIAL_STATE);
  });
});
