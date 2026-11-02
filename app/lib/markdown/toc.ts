import type { TocItem } from "./render";

export interface TocNode {
  item: TocItem;
  children: TocItem[];
}

/** Nest H3 entries under the preceding H2. An H3 with no preceding H2 becomes a top-level node. */
export function nestToc(toc: readonly TocItem[]): TocNode[] {
  const nodes: TocNode[] = [];
  for (const item of toc) {
    const last = nodes[nodes.length - 1];
    if (item.depth === 3 && last) last.children.push(item);
    else nodes.push({ item, children: [] });
  }
  return nodes;
}

/** Split a rendered document's leading `<h1>` (if any) from the rest of the HTML. */
export function splitLeadingH1(html: string): { id: string | null; titleHtml: string | null; rest: string } {
  const match = /^\s*<h1(?: id="([^"]*)")?>([\s\S]*?)<\/h1>\s*/.exec(html);
  if (!match) return { id: null, titleHtml: null, rest: html };
  return { id: match[1] ?? null, titleHtml: match[2] ?? "", rest: html.slice(match[0].length) };
}
