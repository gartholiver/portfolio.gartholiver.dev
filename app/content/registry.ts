/**
 * Content registry — the single source of truth for every explorer entry, URL and page kind.
 *
 * Drives: the explorer tree, route lookup, breadcrumbs/ancestor reveal, prerender paths
 * (react-router.config.ts) and the search index. Keep it free of Vite-only imports
 * (no `?raw`, CSS or import.meta.glob) so it can be loaded by the React Router config.
 */
import { projects, type ProjectId } from "./projects";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageKind =
  | "home"
  | "markdown"
  | "view" // placeholder view panel
  | "demo" // working interactive demo view
  | "about"
  | "blog"
  | "stack"
  | "search"
  | "contact-action"; // no route — opens/focuses the contact terminal

export type RoutePageKind = Exclude<PageKind, "contact-action">;

export type MarkdownDocType = "readme" | "technical-requirements";

/** Where an entry's content comes from. Markdown paths are relative to /content. */
export type ContentRef =
  | { type: "markdown"; file: string; docType: MarkdownDocType }
  | { type: "data"; key: "home" | "profile" | "stack" | "blog" | "search" }
  | { type: "demo"; demoId: string }
  | { type: "view-placeholder" }
  | { type: "action" };

interface EntryBase {
  /** Stable, unique id, e.g. `view:legal-doc-wp-ordering-system:custom-woo-extension-plugin`. */
  id: string;
  /** Filename shown as the interface label, e.g. `README.md`. */
  label: string;
  /** Human-readable title for headers, `<title>` and search results. */
  title: string;
  /** Full explorer path, e.g. `portfolio/<project>/views/<file>.html`. Unique. */
  explorerPath: string;
  projectId?: ProjectId;
  tags: string[];
  /** Short plain-text description (search context, meta description). */
  description: string;
}

export interface RouteEntry extends EntryBase {
  kind: RoutePageKind;
  /** Clean URL pathname without trailing slash (except `/`). */
  url: string;
  content: Exclude<ContentRef, { type: "action" }>;
}

export interface ActionEntry extends EntryBase {
  kind: "contact-action";
  url: null;
  action: "open-contact";
  content: { type: "action" };
}

export type RegistryEntry = RouteEntry | ActionEntry;

export interface ExplorerFolder {
  type: "folder";
  /** `folder:<path>` */
  id: string;
  name: string;
  path: string;
  children: ExplorerNode[];
}

export interface ExplorerFile {
  type: "file";
  /** Same as the registry entry id. */
  id: string;
  name: string;
  path: string;
  entry: RegistryEntry;
}

export type ExplorerNode = ExplorerFolder | ExplorerFile;

export interface FolderRef {
  id: string;
  name: string;
  path: string;
}

export interface Breadcrumb {
  name: string;
  path: string;
  /** Present for the file crumb when it is routable. */
  url?: string;
}

/** Metadata the search index is built from (document text is added server-side). */
export interface SearchSource {
  id: string;
  url: string;
  label: string;
  title: string;
  explorerPath: string;
  kind: RoutePageKind;
  projectId?: ProjectId;
  projectTitle?: string;
  tags: string[];
  description: string;
  content: RouteEntry["content"];
}

// ---------------------------------------------------------------------------
// Entries (order = explorer order from the design brief)
// ---------------------------------------------------------------------------

const PLACEHOLDER = "Placeholder — content to be supplied in phase 2.";

function projectEntries(): RegistryEntry[] {
  return projects.flatMap((project): RegistryEntry[] => {
    const base = `portfolio/${project.folder}`;
    const views: RegistryEntry[] = project.views.map((view) => ({
      id: `view:${project.id}:${view.slug}`,
      kind: view.demoId ? "demo" : "view",
      label: `${view.slug}.html`,
      title: view.title,
      explorerPath: `${base}/views/${view.slug}.html`,
      url: `/portfolio/${project.id}/views/${view.slug}`,
      projectId: project.id,
      tags: project.tags,
      description: view.demoId
        ? `Interactive sample-data demo from ${project.title}.`
        : `Placeholder view from ${project.title}. ${PLACEHOLDER}`,
      content: view.demoId ? { type: "demo", demoId: view.demoId } : { type: "view-placeholder" },
    }));
    return [
      ...views,
      {
        id: `doc:${project.id}:readme`,
        kind: "markdown",
        label: "README.md",
        title: project.title,
        explorerPath: `${base}/README.md`,
        url: `/portfolio/${project.id}`,
        projectId: project.id,
        tags: project.tags,
        description: `Project summary for ${project.title}. ${PLACEHOLDER}`,
        content: { type: "markdown", file: `projects/${project.id}/README.md`, docType: "readme" },
      },
      {
        id: `doc:${project.id}:technical-requirements`,
        kind: "markdown",
        label: "technical-requirements.md",
        title: `${project.title} — Technical Requirements`,
        explorerPath: `${base}/technical-requirements.md`,
        url: `/portfolio/${project.id}/technical-requirements`,
        projectId: project.id,
        tags: project.tags,
        description: `Technical requirements for ${project.title}. ${PLACEHOLDER}`,
        content: {
          type: "markdown",
          file: `projects/${project.id}/technical-requirements.md`,
          docType: "technical-requirements",
        },
      },
    ];
  });
}

export const entries: readonly RegistryEntry[] = [
  ...projectEntries(),
  {
    id: "docs:blog",
    kind: "blog",
    label: "index.html",
    title: "Blog",
    explorerPath: "docs/index.html",
    url: "/docs",
    tags: ["blog"],
    description: "Blog archive — coming in phase 2.",
    content: { type: "data", key: "blog" },
  },
  {
    id: "docs:about",
    kind: "about",
    label: "about.html",
    title: "About",
    explorerPath: "docs/about.html",
    url: "/docs/about",
    tags: ["about", "profile"],
    description: `About Garth Oliver. ${PLACEHOLDER}`,
    content: { type: "data", key: "profile" },
  },
  {
    id: "docs:contact",
    kind: "contact-action",
    label: "contact.bash",
    title: "Contact",
    explorerPath: "docs/contact.bash",
    url: null,
    action: "open-contact",
    tags: ["contact"],
    description: "Open the guided contact terminal (demo — nothing is sent).",
    content: { type: "action" },
  },
  {
    id: "home",
    kind: "home",
    label: "index.html",
    title: "Home",
    explorerPath: "index.html",
    url: "/",
    tags: ["home"],
    description: "Portfolio introduction and project overview.",
    content: { type: "data", key: "home" },
  },
  {
    id: "stack",
    kind: "stack",
    label: "package.json",
    title: "Tech Stack",
    explorerPath: "package.json",
    url: "/stack",
    tags: ["stack", "tools"],
    description: "Tech stack and tooling preferences.",
    content: { type: "data", key: "stack" },
  },
  {
    id: "search",
    kind: "search",
    label: "search.tsx",
    title: "Search",
    explorerPath: "search.tsx",
    url: "/search",
    tags: ["search"],
    description: "Search projects, documents and pages.",
    content: { type: "data", key: "search" },
  },
];

/** Path prerendered for the catch-all route; copied to build/client/404.html after build. */
export const NOT_FOUND_PRERENDER_PATH = "/404";

// ---------------------------------------------------------------------------
// Indexes & helpers
// ---------------------------------------------------------------------------

const byId = new Map(entries.map((e) => [e.id, e]));
const byUrl = new Map(entries.filter(isRouteEntry).map((e) => [e.url, e]));

export function isRouteEntry(entry: RegistryEntry): entry is RouteEntry {
  return entry.url !== null;
}

export function isActionEntry(entry: RegistryEntry): entry is ActionEntry {
  return entry.kind === "contact-action";
}

export const routeEntries: readonly RouteEntry[] = entries.filter(isRouteEntry);

export function getEntryById(id: string): RegistryEntry | undefined {
  return byId.get(id);
}

/** Normalise a pathname: decode, strip query/hash and trailing slash. */
export function normalizePathname(pathname: string): string {
  let p = pathname.split(/[?#]/)[0] ?? "/";
  try {
    p = decodeURIComponent(p);
  } catch {
    // keep raw
  }
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

export function getEntryByPathname(pathname: string): RouteEntry | undefined {
  return byUrl.get(normalizePathname(pathname));
}

/** Ancestor folders of an entry, outermost first (for breadcrumbs and auto-revealing folders). */
export function getAncestors(entryOrId: RegistryEntry | string): FolderRef[] {
  const entry = typeof entryOrId === "string" ? byId.get(entryOrId) : entryOrId;
  if (!entry) return [];
  const parts = entry.explorerPath.split("/").slice(0, -1);
  return parts.map((name, i) => {
    const path = parts.slice(0, i + 1).join("/");
    return { id: folderId(path), name, path };
  });
}

export function getBreadcrumbs(entryOrId: RegistryEntry | string): Breadcrumb[] {
  const entry = typeof entryOrId === "string" ? byId.get(entryOrId) : entryOrId;
  if (!entry) return [];
  return [
    ...getAncestors(entry).map(({ name, path }) => ({ name, path })),
    { name: entry.label, path: entry.explorerPath, ...(entry.url ? { url: entry.url } : {}) },
  ];
}

export function folderId(path: string): string {
  return `folder:${path}`;
}

/** Build the explorer tree. Order follows registry order (folders created on first use). */
export function buildExplorerTree(source: readonly RegistryEntry[] = entries): ExplorerNode[] {
  const root: ExplorerNode[] = [];
  const folders = new Map<string, ExplorerFolder>();

  for (const entry of source) {
    const parts = entry.explorerPath.split("/");
    let siblings = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const path = parts.slice(0, i + 1).join("/");
      let folder = folders.get(path);
      if (!folder) {
        folder = { type: "folder", id: folderId(path), name: parts[i]!, path, children: [] };
        folders.set(path, folder);
        siblings.push(folder);
      }
      siblings = folder.children;
    }
    siblings.push({ type: "file", id: entry.id, name: entry.label, path: entry.explorerPath, entry });
  }
  return root;
}

export function getProjectEntries(projectId: ProjectId): RegistryEntry[] {
  return entries.filter((e) => e.projectId === projectId);
}

/** Every routable URL — used by react-router.config.ts `prerender`. */
export function getPrerenderPaths(): string[] {
  return routeEntries.map((e) => e.url);
}

export function getSearchSources(): SearchSource[] {
  return routeEntries.map((e) => ({
    id: e.id,
    url: e.url,
    label: e.label,
    title: e.title,
    explorerPath: e.explorerPath,
    kind: e.kind,
    projectId: e.projectId,
    projectTitle: e.projectId ? projects.find((p) => p.id === e.projectId)?.title : undefined,
    tags: e.tags,
    description: e.description,
    content: e.content,
  }));
}

export { projects, getProject, type Project, type ProjectId, type ProjectView } from "./projects";
