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

export type FileIconKind = "md" | "readme" | "html" | "json" | "npm" | "tsx" | "terminal" | "default";
export type FolderIconKind = "folder" | "folder-docs" | "folder-views" | "folder-project";
export type IconKind = FileIconKind | FolderIconKind;

/** File-type icon (see `FileIcon`) from a filename: extension first, a few well-known names win. */
export function getFileIconKind(filename: string): FileIconKind {
  const name = filename.toLowerCase();
  if (name === "package.json") return "npm";
  if (name === "readme.md") return "readme";
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  switch (ext) {
    case "md":
    case "html":
    case "json":
    case "tsx":
      return ext;
    case "bash":
    case "sh":
    case "me": // contact.me opens the contact terminal
      return "terminal";
    default:
      return "default";
  }
}

/**
 * Folder icon from a folder name and (optionally) its full path: themed icons for `docs` and `views`,
 * the project icon for any direct child of `portfolio` (a case-study project folder), the generic folder otherwise.
 */
export function getFolderIconKind(name: string, path?: string): FolderIconKind {
  const segments = path?.split("/").filter(Boolean);
  if (segments && segments.length === 2 && segments[0] === "portfolio") return "folder-project";
  switch (name.toLowerCase()) {
    case "docs":
      return "folder-docs";
    case "views":
      return "folder-views";
    default:
      return "folder";
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
