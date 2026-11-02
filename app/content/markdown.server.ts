/**
 * Loads Markdown from /content at build time. Only import from route `loader`s (stripped from the
 * client bundle) or other *.server.ts modules — the raw Markdown and unified never ship to browsers.
 */
import { renderMarkdown, type RenderedMarkdown } from "~/lib/markdown/render";

const sources = import.meta.glob<string>("/content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const cache = new Map<string, RenderedMarkdown>();

/** All Markdown files, keyed by path relative to /content (e.g. `projects/<id>/README.md`). */
export function listMarkdownFiles(): string[] {
  return Object.keys(sources).map((k) => k.replace(/^\/content\//, ""));
}

/** Render a Markdown file by its registry `content.file` path. Throws if missing. */
export function loadMarkdown(file: string): RenderedMarkdown {
  const cached = cache.get(file);
  if (cached) return cached;
  const source = sources[`/content/${file}`];
  if (source === undefined) throw new Error(`Markdown file not found: content/${file}`);
  const rendered = renderMarkdown(source);
  cache.set(file, rendered);
  return rendered;
}
