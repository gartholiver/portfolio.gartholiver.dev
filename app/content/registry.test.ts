import { describe, expect, it } from "vitest";
import { matchRoutes, type RouteObject } from "react-router";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import routeConfig from "~/routes";
import {
  buildExplorerTree,
  entries,
  getAncestors,
  getBreadcrumbs,
  getEntryById,
  getEntryByPathname,
  getPrerenderPaths,
  getSearchSources,
  isRouteEntry,
  routeEntries,
  type ExplorerNode,
} from "./registry";
import { listMarkdownFiles } from "./markdown.server";

function toRouteObjects(config: RouteConfigEntry[]): RouteObject[] {
  return config.map((r) => ({
    id: r.id ?? r.file,
    path: r.path,
    index: r.index,
    children: r.children ? toRouteObjects(r.children) : undefined,
  })) as RouteObject[];
}

function leafFile(pathname: string): string | undefined {
  const matches = matchRoutes(toRouteObjects(routeConfig), pathname);
  return (matches?.at(-1)?.route.id as string | undefined) ?? undefined;
}

describe("content registry", () => {
  it("has unique ids, explorer paths and URLs", () => {
    const ids = entries.map((e) => e.id);
    const paths = entries.map((e) => e.explorerPath);
    const urls = routeEntries.map((e) => e.url);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("contains 17 views (1 demo), 8 Markdown docs and the top-level pages", () => {
    const views = entries.filter((e) => e.kind === "view" || e.kind === "demo");
    expect(views).toHaveLength(17);
    expect(entries.filter((e) => e.kind === "demo")).toHaveLength(1);
    expect(entries.filter((e) => e.kind === "markdown")).toHaveLength(8);
    for (const kind of ["home", "about", "blog", "stack", "search", "contact-action"] as const) {
      expect(entries.filter((e) => e.kind === kind)).toHaveLength(1);
    }
    expect(entries).toHaveLength(17 + 8 + 6);
  });

  it("resolves the duplicate custom-woo-extension-plugin.html to two distinct entries", () => {
    const dupes = entries.filter((e) => e.label === "custom-woo-extension-plugin.html");
    expect(dupes).toHaveLength(2);
    expect(new Set(dupes.map((e) => e.url)).size).toBe(2);
    expect(getEntryByPathname("/portfolio/legal-doc-wp-ordering-system/views/custom-woo-extension-plugin")?.projectId).toBe(
      "legal-doc-wp-ordering-system",
    );
    expect(
      getEntryByPathname("/portfolio/multi-location-inventory-sales-system/views/custom-woo-extension-plugin/")?.projectId,
    ).toBe("multi-location-inventory-sales-system");
  });

  it("maps URLs per the plan", () => {
    expect(getEntryByPathname("/")?.explorerPath).toBe("index.html");
    expect(getEntryByPathname("/portfolio/hybrid-wp-react-intranet")?.explorerPath).toBe(
      "portfolio/hybrid-wp-react-intranet/README.md",
    );
    expect(getEntryByPathname("/portfolio/hybrid-wp-react-intranet/technical-requirements")?.label).toBe(
      "technical-requirements.md",
    );
    expect(getEntryByPathname("/docs")?.explorerPath).toBe("docs/index.html");
    expect(getEntryByPathname("/docs/about")?.explorerPath).toBe("docs/about.html");
    expect(getEntryByPathname("/stack")?.label).toBe("package.json");
    expect(getEntryByPathname("/search?q=x")?.label).toBe("search.tsx");
    expect(getEntryByPathname("/nope")).toBeUndefined();
    const contact = getEntryById("docs:contact");
    expect(contact?.kind).toBe("contact-action");
    expect(contact?.url).toBeNull();
  });

  it("routes every non-action entry to the right route module", () => {
    const expected: Record<string, string> = {
      home: "routes/home.tsx",
      markdown: "", // id-based, checked below
      view: "routes/view.tsx",
      demo: "routes/view.tsx",
      about: "routes/about.tsx",
      blog: "routes/blog.tsx",
      stack: "routes/stack.tsx",
      search: "routes/search.tsx",
    };
    for (const entry of routeEntries) {
      const leaf = leafFile(entry.url);
      expect(leaf, entry.url).toBeDefined();
      expect(leaf, entry.url).not.toBe("routes/not-found.tsx");
      if (entry.kind === "markdown") {
        expect(leaf).toBe(entry.content.type === "markdown" && entry.content.docType === "readme"
          ? "project-readme"
          : "project-technical-requirements");
      } else {
        expect(leaf, entry.url).toBe(expected[entry.kind]);
      }
    }
    expect(leafFile("/definitely/not/a/page")).toBe("routes/not-found.tsx");
  });

  it("prerenders exactly the routable entries", () => {
    expect(getPrerenderPaths().sort()).toEqual(entries.filter(isRouteEntry).map((e) => e.url).sort());
    expect(getPrerenderPaths()).toHaveLength(17 + 8 + 5);
  });

  it("references Markdown files that exist, and every Markdown file is registered", () => {
    const files = routeEntries.flatMap((e) => (e.content.type === "markdown" ? [e.content.file] : []));
    expect(files.sort()).toEqual(listMarkdownFiles().sort());
  });

  it("builds the explorer tree in brief order", () => {
    const tree = buildExplorerTree();
    expect(tree.map((n) => n.name)).toEqual(["portfolio", "docs", "index.html", "package.json", "search.tsx"]);
    const portfolio = tree[0]!;
    if (portfolio.type !== "folder") throw new Error("expected folder");
    expect(portfolio.children.map((n) => n.name)).toEqual([
      "hybrid-wp-react-intranet",
      "headless-wp-educational-app",
      "legal-doc-wp-ordering-system",
      "multi-location-inventory-sales-system",
    ]);
    const project = portfolio.children[0]!;
    if (project.type !== "folder") throw new Error("expected folder");
    expect(project.children.map((n) => n.name)).toEqual(["views", "README.md", "technical-requirements.md"]);
    const docs = tree[1]!;
    if (docs.type !== "folder") throw new Error("expected folder");
    expect(docs.children.map((n) => n.name)).toEqual(["index.html", "about.html", "contact.bash"]);

    const countFiles = (nodes: ExplorerNode[]): number =>
      nodes.reduce((n, node) => n + (node.type === "file" ? 1 : countFiles(node.children)), 0);
    expect(countFiles(tree)).toBe(entries.length);
  });

  it("returns ancestors and breadcrumbs", () => {
    const id = "view:hybrid-wp-react-intranet:office-booking-calendar";
    expect(getAncestors(id).map((a) => a.path)).toEqual([
      "portfolio",
      "portfolio/hybrid-wp-react-intranet",
      "portfolio/hybrid-wp-react-intranet/views",
    ]);
    expect(getAncestors("home")).toEqual([]);
    const crumbs = getBreadcrumbs(id);
    expect(crumbs.map((c) => c.name)).toEqual([
      "portfolio",
      "hybrid-wp-react-intranet",
      "views",
      "office-booking-calendar.html",
    ]);
    expect(crumbs.at(-1)?.url).toBe("/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar");
  });

  it("exposes search sources for every routable entry", () => {
    const sources = getSearchSources();
    expect(sources).toHaveLength(routeEntries.length);
    expect(sources.find((s) => s.id === "doc:headless-wp-educational-app:readme")?.projectTitle).toBe(
      "Headless WordPress Educational App",
    );
  });
});
