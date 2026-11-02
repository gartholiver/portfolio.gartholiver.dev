import { describe, expect, it } from "vitest";
import { DEMO_IDS, getDemo } from "./index";
import { routeEntries } from "~/content/registry";

describe("demo registry", () => {
  it("resolves office-booking-calendar to a component", () => {
    const demo = getDemo("office-booking-calendar");
    expect(demo).toBeDefined();
    expect(typeof demo?.component).toBe("function");
    expect(demo?.description).toBeTruthy();
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
