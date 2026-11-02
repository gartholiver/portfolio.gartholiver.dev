/**
 * Build-time Markdown pipeline (unified: remark-parse → remark-gfm → callouts → remark-rehype
 * → rehype-slug → rehype-stringify). Runs inside route loaders during prerender; the client
 * bundle only receives the resulting HTML string, TOC and frontmatter.
 *
 * Supported display features: YAML frontmatter, GFM (tables, task lists, strikethrough,
 * autolinks), heading ids (github-slugger, same as GitHub), and Obsidian-style callouts:
 *
 *   > [!note] Optional title
 *   > Body text…
 *
 * Raw HTML in Markdown is dropped (remark-rehype default) — content stays data, not markup.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString as mdastToString } from "mdast-util-to-string";
import { toString as hastToString } from "hast-util-to-string";
import { parse as parseYaml } from "yaml";
import type { Root as MdastRoot, Blockquote, Paragraph, Text } from "mdast";
import type { Root as HastRoot } from "hast";

export const CALLOUT_TYPES = ["note", "info", "tip", "warning", "placeholder"] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

export interface DocFrontmatter {
  title?: string;
  role?: string;
  stack?: string[];
  status?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface TocItem {
  depth: 2 | 3;
  id: string;
  text: string;
}

export interface RenderedMarkdown {
  frontmatter: DocFrontmatter;
  html: string;
  toc: TocItem[];
  /** Plain text of the body (for search). */
  text: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontmatter(source: string): { data: DocFrontmatter; body: string } {
  const match = FRONTMATTER_RE.exec(source);
  if (!match) return { data: {}, body: source };
  const parsed: unknown = parseYaml(match[1] ?? "");
  const data = parsed && typeof parsed === "object" ? (parsed as DocFrontmatter) : {};
  return { data, body: source.slice(match[0].length) };
}

const CALLOUT_RE = /^\[!([a-z]+)\][ \t]*(.*)$/i;

/** remark plugin: `> [!type] Title` blockquotes → <aside class="callout" data-callout="type">. */
function remarkCallouts() {
  return (tree: MdastRoot) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0];
      if (!first || first.type !== "paragraph") return;
      const head = first.children[0];
      if (!head || head.type !== "text") return;
      const [firstLine = "", ...rest] = head.value.split("\n");
      const match = CALLOUT_RE.exec(firstLine);
      if (!match) return;
      const type = match[1]!.toLowerCase();
      const calloutType: CalloutType = (CALLOUT_TYPES as readonly string[]).includes(type)
        ? (type as CalloutType)
        : "note";
      const title = match[2]?.trim() || calloutType[0]!.toUpperCase() + calloutType.slice(1);

      // Remove the marker line from the first paragraph.
      head.value = rest.join("\n");
      if (head.value === "") first.children.shift();
      if (first.children.length === 0) node.children.shift();

      const titleNode: Paragraph = {
        type: "paragraph",
        children: [{ type: "text", value: title } as Text],
        data: { hName: "p", hProperties: { className: ["callout-title"] } },
      };
      node.children.unshift(titleNode);
      node.data = {
        ...node.data,
        hName: "aside",
        hProperties: { className: ["callout"], "data-callout": calloutType },
      };
    });
  };
}

function rehypeCollectToc(toc: TocItem[]) {
  return () => (tree: HastRoot) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      toc.push({ depth: node.tagName === "h2" ? 2 : 3, id, text: hastToString(node) });
    });
  };
}

export function renderMarkdown(source: string): RenderedMarkdown {
  const { data, body } = splitFrontmatter(source);
  const toc: TocItem[] = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkCallouts)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCollectToc(toc))
    .use(rehypeStringify);

  const mdast = processor.parse(body);
  const text = mdastToString(mdast)
    .replace(/\[![a-z]+\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const html = processor.stringify(processor.runSync(mdast));
  return { frontmatter: data, html, toc, text };
}
