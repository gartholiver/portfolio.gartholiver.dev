import { describe, expect, it } from "vitest";
import { DEMO_IDS, getDemo } from "./index";
import { routeEntries } from "~/content/registry";

describe("demo registry", () => {
  it.each(["office-booking-calendar", "onboarding-wizard", "notification-center", "interactive-remote-employee-map"])(
    "resolves %s to a component",
    (id) => {
      const demo = getDemo(id);
      expect(demo).toBeDefined();
      expect(typeof demo?.component).toBe("function");
      expect(demo?.description).toBeTruthy();
      expect(demo?.description).toMatch(/nothing is saved/);
    },
  );

  it("registers exactly four demos", () => {
    expect(DEMO_IDS).toHaveLength(4);
  });

  it("returns undefined for unknown ids (including Object.prototype keys)", () => {
    expect(getDemo("nope")).toBeUndefined();
    expect(getDemo("toString")).toBeUndefined();
  });

  it("has a registered demo for every demo entry in the content registry, and vice versa", () => {
    const used = routeEntries.flatMap((e) => (e.content.type === "demo" ? [e.content.demoId] : []));
    expect(used.length).toBeGreaterThan(0);
    for (const id of used) expect(getDemo(id), id).toBeDefined();
    for (const id of DEMO_IDS) expect(used).toContain(id);
  });
});
