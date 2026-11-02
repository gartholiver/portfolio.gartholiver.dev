/**
 * Build-time validation of links authored in Markdown. Used by `loadMarkdown` (markdown.server.ts),
 * so a broken link fails the prerender/build instead of shipping a dead link.
 *
 * Rules, applied to every `<a href>` of a document (resolved against that document's own URL, the
 * same way a browser resolves it):
 *  - external (`http(s):`, `mailto:`, `tel:`, protocol-relative) links are not checked;
 *  - same-origin paths must be a registry URL (any project, not just the document's own);
 *  - a `#fragment` must be a heading id in the target document when the target is Markdown
 *    (`#id` alone targets the document itself); for other targets only the path is checked.
 *
 * Registry files are loaded by react-router.config.ts in plain Node, so use relative imports only.
 */
import { getEntryByPathname } from "./registry";

const ORIGIN = "http://link-check.invalid";

export interface LinkSource {
  /** Registry URL of the document containing the links, e.g. `/portfolio/<id>`. */
  url: string;
  /** Raw `href` values. */
  links: readonly string[];
}

/** Returns the element ids available as `#fragment` targets in a Markdown file (path relative to /content). */
export type AnchorLookup = (file: string) => readonly string[];

/** Human-readable problems, one per bad link; empty when everything resolves. */
export function findLinkProblems(source: LinkSource, anchorsOf: AnchorLookup): string[] {
  const problems: string[] = [];
  for (const href of new Set(source.links)) {
    let target: URL;
    try {
      target = new URL(href, ORIGIN + source.url);
    } catch {
      problems.push(`"${href}" is not a valid URL`);
      continue;
    }
    if (target.origin !== ORIGIN) continue; // external, mailto:, tel:

    const entry = getEntryByPathname(target.pathname);
    if (!entry) {
      problems.push(
        `"${href}" resolves to ${target.pathname}, which is not a registered page (link by clean URL, e.g. /portfolio/<id>/technical-requirements)`,
      );
      continue;
    }

    const fragment = safeDecode(target.hash.slice(1));
    if (fragment && entry.content.type === "markdown" && !anchorsOf(entry.content.file).includes(fragment)) {
      problems.push(`"${href}" points to #${fragment}, which is not a heading in ${entry.url}`);
    }
  }
  return problems;
}

/** Throws one error listing every bad link in the document. */
export function assertLinksValid(file: string, source: LinkSource, anchorsOf: AnchorLookup): void {
  const problems = findLinkProblems(source, anchorsOf);
  if (problems.length > 0) {
    throw new Error(`Broken link${problems.length > 1 ? "s" : ""} in content/${file}:\n - ${problems.join("\n - ")}`);
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
