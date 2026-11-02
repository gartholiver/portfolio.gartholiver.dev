import { folderId, getAncestors, type RegistryEntry } from "~/content/registry";

/** Folders open on first load when no file is active (the prototype shows `portfolio` expanded). */
export const DEFAULT_EXPANDED_FOLDERS: readonly string[] = [folderId("portfolio")];

export type ExpandedFolders = ReadonlySet<string>;

/** Add the entry's ancestor folders. Returns the same set when nothing changes (cheap bail-out for setState). */
export function revealEntry(expanded: ExpandedFolders, entry: RegistryEntry | undefined): ExpandedFolders {
  if (!entry) return expanded;
  const missing = getAncestors(entry).filter((f) => !expanded.has(f.id));
  if (missing.length === 0) return expanded;
  const next = new Set(expanded);
  for (const f of missing) next.add(f.id);
  return next;
}

/** Initial expansion: the defaults plus the active entry's ancestors (so direct links/refreshes show the file). */
export function getInitialExpanded(activeEntry?: RegistryEntry): ExpandedFolders {
  return revealEntry(new Set(DEFAULT_EXPANDED_FOLDERS), activeEntry);
}

export function toggleFolder(expanded: ExpandedFolders, id: string): ExpandedFolders {
  const next = new Set(expanded);
  if (!next.delete(id)) next.add(id);
  return next;
}

export type FileIconKind = "md" | "html" | "json" | "tsx" | "bash" | "default";

/** Icon dot colour key from a filename extension. */
export function getFileIconKind(filename: string): FileIconKind {
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".") + 1).toLowerCase() : "";
  switch (ext) {
    case "md":
    case "html":
    case "json":
    case "tsx":
    case "bash":
      return ext;
    default:
      return "default";
  }
}

/** Human-readable page kind for the status bar. */
export function describeKind(entry: RegistryEntry | undefined): string {
  if (!entry) return "Not found";
  switch (entry.kind) {
    case "home":
      return "Home";
    case "markdown":
      return "Markdown";
    case "view":
      return "Placeholder view";
    case "demo":
      return "Interactive demo";
    case "about":
      return "About";
    case "blog":
      return "Blog";
    case "stack":
      return "JSON";
    case "search":
      return "Search";
    case "contact-action":
      return "Action";
  }
}
