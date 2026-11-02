import { describe, expect, it } from "vitest";
import { buildExplorerTree, entries, folderId, getEntryById, getEntryByPathname, type ExplorerNode } from "~/content/registry";
import {
  DEFAULT_EXPANDED_FOLDERS,
  describeKind,
  getFileIconKind,
  getInitialExpanded,
  revealEntry,
  toggleFolder,
} from "./explorer-state";

const view = getEntryByPathname("/portfolio/legal-doc-wp-ordering-system/views/custom-woo-extension-plugin")!;

function folderIds(nodes: ExplorerNode[]): string[] {
  return nodes.flatMap((n) => (n.type === "folder" ? [n.id, ...folderIds(n.children)] : []));
}

describe("getInitialExpanded", () => {
  it("expands only the default folder when no file is active (home / 404)", () => {
    expect([...getInitialExpanded(undefined)]).toEqual([...DEFAULT_EXPANDED_FOLDERS]);
    expect(getInitialExpanded(getEntryByPathname("/"))).toEqual(new Set(DEFAULT_EXPANDED_FOLDERS));
  });

  it("reveals every ancestor folder of a deeply nested active file", () => {
    const expanded = getInitialExpanded(view);
    expect(expanded.has(folderId("portfolio"))).toBe(true);
    expect(expanded.has(folderId("portfolio/legal-doc-wp-ordering-system"))).toBe(true);
    expect(expanded.has(folderId("portfolio/legal-doc-wp-ordering-system/views"))).toBe(true);
    // siblings stay collapsed
    expect(expanded.has(folderId("portfolio/headless-wp-educational-app"))).toBe(false);
    expect(expanded.has(folderId("docs"))).toBe(false);
  });

  it("only references folders that exist in the explorer tree, for every entry", () => {
    const real = new Set(folderIds(buildExplorerTree()));
    for (const entry of entries) {
      for (const id of getInitialExpanded(entry)) expect(real.has(id), `${entry.id}: ${id}`).toBe(true);
    }
  });
});

describe("revealEntry", () => {
  it("is additive: keeps folders the user opened", () => {
    const start = new Set([folderId("docs"), folderId("portfolio")]);
    const next = revealEntry(start, view);
    expect(next.has(folderId("docs"))).toBe(true);
    expect(next.has(folderId("portfolio/legal-doc-wp-ordering-system/views"))).toBe(true);
  });

  it("returns the same set (no re-render) when ancestors are already open", () => {
    const open = revealEntry(new Set(), view);
    expect(revealEntry(open, view)).toBe(open);
    expect(revealEntry(open, undefined)).toBe(open);
  });

  it("does not mutate its input", () => {
    const start = new Set<string>();
    revealEntry(start, view);
    expect(start.size).toBe(0);
  });

  it("handles files with duplicate names in different projects independently", () => {
    const a = getEntryById("view:legal-doc-wp-ordering-system:custom-woo-extension-plugin")!;
    const b = getEntryById("view:multi-location-inventory-sales-system:custom-woo-extension-plugin")!;
    const onlyA = revealEntry(new Set(), a);
    expect(onlyA.has(folderId("portfolio/multi-location-inventory-sales-system"))).toBe(false);
    expect(revealEntry(onlyA, b).has(folderId("portfolio/multi-location-inventory-sales-system/views"))).toBe(true);
  });

  it("reveals root-level files without opening anything", () => {
    expect(revealEntry(new Set(), getEntryByPathname("/stack"))).toEqual(new Set());
  });
});

describe("toggleFolder", () => {
  it("toggles open and closed without mutating", () => {
    const empty = new Set<string>();
    const open = toggleFolder(empty, "folder:docs");
    expect(open.has("folder:docs")).toBe(true);
    expect(empty.size).toBe(0);
    expect(toggleFolder(open, "folder:docs").has("folder:docs")).toBe(false);
  });
});

describe("getFileIconKind", () => {
  it.each([
    ["README.md", "md"],
    ["office-booking-calendar.html", "html"],
    ["package.json", "json"],
    ["search.tsx", "tsx"],
    ["contact.bash", "bash"],
    ["INDEX.HTML", "html"],
    ["Makefile", "default"],
    ["archive.zip", "default"],
  ])("%s → %s", (name, kind) => {
    expect(getFileIconKind(name)).toBe(kind);
  });
});

describe("describeKind", () => {
  it("describes every page kind and the 404 case", () => {
    expect(describeKind(undefined)).toBe("Not found");
    for (const entry of entries) expect(describeKind(entry)).not.toBe("");
  });
});
