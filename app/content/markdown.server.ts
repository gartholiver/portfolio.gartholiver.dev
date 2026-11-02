/**
 * Loads Markdown from /content at build time. Only import from route `loader`s (stripped from the
 * client bundle) or other *.server.ts modules — the raw Markdown and unified never ship to browsers.
 *
 * `loadMarkdown` also validates the document's links (see validate-links.ts), so a bad internal link
 * or `#fragment` fails the prerender. Unsafe URL protocols are rejected earlier, in `renderMarkdown`.
 */
import { renderMarkdown, type RenderedMarkdown } from "~/lib/markdown/render";
import { routeEntries } from "./registry";
import { assertLinksValid } from "./validate-links";

const sources = import.meta.glob<string>("/content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const rendered = new Map<string, RenderedMarkdown>();
const validated = new Set<string>();

/** All Markdown files, keyed by path relative to /content (e.g. `projects/<id>/README.md`). */
export function listMarkdownFiles(): string[] {
  return Object.keys(sources).map((k) => k.replace(/^\/content\//, ""));
}

/** Render without validating links (lets documents look up each other's anchors without recursion). */
function renderFile(file: string): RenderedMarkdown {
  const cached = rendered.get(file);
  if (cached) return cached;
  const source = sources[`/content/${file}`];
  if (source === undefined) throw new Error(`Markdown file not found: content/${file}`);
  let doc: RenderedMarkdown;
  try {
    doc = renderMarkdown(source);
  } catch (error) {
    throw new Error(`Failed to render content/${file}: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
  rendered.set(file, doc);
  return doc;
}

/** Render a Markdown file by its registry `content.file` path and validate its links. Throws if missing or invalid. */
export function loadMarkdown(file: string): RenderedMarkdown {
  const doc = renderFile(file);
  if (!validated.has(file)) {
    const entry = routeEntries.find((e) => e.content.type === "markdown" && e.content.file === file);
    if (entry) assertLinksValid(file, { url: entry.url, links: doc.links }, (f) => renderFile(f).anchorIds);
    validated.add(file);
  }
  return doc;
}
