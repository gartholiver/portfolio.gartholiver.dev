import type { RouteEntry } from "./registry";

export const SITE_NAME = "Garth Oliver";

export function pageTitle(title?: string): string {
  return title ? `${title} · ${SITE_NAME}` : SITE_NAME;
}

/** Standard per-route meta for a registry entry (title uses the human title + filename label). */
export function entryMeta(entry: RouteEntry | undefined) {
  if (!entry) return [{ title: pageTitle("Not found") }];
  return [
    { title: pageTitle(entry.kind === "home" ? undefined : `${entry.title} (${entry.label})`) },
    { name: "description", content: entry.description },
  ];
}
