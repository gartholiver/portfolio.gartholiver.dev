import { describe, expect, it } from "vitest";
import { getViewPlaceholder, viewPlaceholderCommon, viewPlaceholders } from "./view-placeholders";
import { getEntryById, routeEntries } from "./registry";

const placeholderViews = routeEntries.filter((e) => e.kind === "view");
const projectTitleOf = (id: string) => getEntryById(id)?.projectId ?? "";

describe("view placeholder data", () => {
  it("covers all 16 non-demo views, and only them", () => {
    expect(placeholderViews).toHaveLength(16);
    for (const entry of placeholderViews) {
      expect(entry.content.type).toBe("view-placeholder");
      expect(getViewPlaceholder(entry.id), entry.id).toBeDefined();
    }
    const ids = new Set(placeholderViews.map((e) => e.id));
    for (const key of Object.keys(viewPlaceholders)) expect(ids.has(key), `stale key ${key}`).toBe(true);
  });

  it("gives every view distinct copy and a distinct (project, title) identity", () => {
    // Two projects legitimately share the view title "Custom WooCommerce Extension Plugin".
    const identities = placeholderViews.map((e) => `${projectTitleOf(e.id)}::${e.title}`);
    expect(new Set(identities).size).toBe(16);
    const summaries = placeholderViews.map((e) => getViewPlaceholder(e.id)!.summary);
    expect(new Set(summaries).size).toBe(16);
  });

  it("marks all copy as placeholder and avoids invented specifics", () => {
    for (const { summary } of Object.values(viewPlaceholders)) {
      expect(summary.startsWith("[Placeholder]")).toBe(true);
      expect(summary).not.toMatch(/\d/); // no metrics or figures
    }
    expect(viewPlaceholderCommon.status).toMatch(/after the project is reviewed/i);
  });
});
