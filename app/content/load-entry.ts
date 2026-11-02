import { data } from "react-router";
import { getEntryByPathname, type RouteEntry } from "./registry";

/** Resolve the registry entry for a request URL, or throw a 404 for the error boundary. */
export function requireEntry(url: string | URL): RouteEntry {
  const pathname = typeof url === "string" ? new URL(url, "http://local").pathname : url.pathname;
  const entry = getEntryByPathname(pathname);
  if (!entry) throw data("Not Found", { status: 404 });
  return entry;
}
