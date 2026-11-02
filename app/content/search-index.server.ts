/**
 * Builds the local search index at prerender time: registry metadata + Markdown body text.
 * The search route's loader returns this, so the index ships as prerendered loader data.
 */
import { getSearchSources, type SearchSource } from "./registry";
import { loadMarkdown } from "./markdown.server";

export interface SearchDocument extends Omit<SearchSource, "content"> {
  /** Plain-text body (Markdown docs) or description for other pages. */
  text: string;
}

export function buildSearchIndex(): SearchDocument[] {
  return getSearchSources().map(({ content, ...meta }) => ({
    ...meta,
    text: content.type === "markdown" ? loadMarkdown(content.file).text : meta.description,
  }));
}
