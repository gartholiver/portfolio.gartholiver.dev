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
 *
 * Display enhancements added to the HTML (after the TOC is collected, so TOC text stays clean):
 *  - h2–h4 get a trailing permalink `<a class="heading-anchor" href="#id" aria-hidden tabindex=-1>#</a>`
 *    (decorative; the TOC and native fragment links are the accessible route),
 *  - external links (http(s):// and //) get `rel="noopener noreferrer"`,
 *  - tables are wrapped in `<div class="table-scroll" role="region" tabindex="0">` so wide tables
 *    scroll in their own keyboard-reachable region instead of widening the page.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { SKIP, visit } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import { parse as parseYaml } from "yaml";
import type { Root as MdastRoot, Blockquote, Paragraph, Text, Nodes as MdastNodes } from "mdast";
import type { Element as HastElement, Root as HastRoot } from "hast";

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

const EXTERNAL_HREF_RE = /^(?:https?:)?\/\//i;

function el(tagName: string, properties: HastElement["properties"], children: HastElement["children"]): HastElement {
  return { type: "element", tagName, properties, children };
}

/** rehype plugin: heading permalinks, safe external links, scrollable table wrappers. */
function rehypeEnhance() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node, index, parent) => {
      if ((node.tagName === "h2" || node.tagName === "h3" || node.tagName === "h4") && typeof node.properties?.id === "string") {
        node.children.push(
          el(
            "a",
            { className: ["heading-anchor"], href: `#${node.properties.id}`, ariaHidden: "true", tabIndex: -1 },
            [{ type: "text", value: "#" }],
          ),
        );
        return;
      }
      if (node.tagName === "a" && typeof node.properties?.href === "string" && EXTERNAL_HREF_RE.test(node.properties.href)) {
        node.properties.rel = ["noopener", "noreferrer"];
        return;
      }
      if (node.tagName === "table" && parent && typeof index === "number") {
        const headers: string[] = [];
        visit(node, "element", (n) => {
          if (n.tagName === "th") headers.push(hastToString(n).trim());
        });
        const label = headers.length ? `Table: ${headers.join(", ")}` : "Table";
        parent.children[index] = el(
          "div",
          { className: ["table-scroll"], role: "region", ariaLabel: label, tabIndex: 0 },
          [node],
        );
        return [SKIP, index + 1];
      }
    });
  };
}

/** Containers whose children are block-level nodes or table rows/cells: their text must not run together. */
const SEPARATING_PARENTS = new Set(["root", "blockquote", "list", "listItem", "table", "tableRow"]);

/**
 * Plain text of an mdast tree for search snippets. Unlike `mdast-util-to-string` (which concatenates
 * everything), block-level siblings, list items and table cells are separated by a space, so
 * "| File | Title |" yields "File Title" rather than "FileTitle". Inline phrasing joins without a gap.
 */
export function mdastPlainText(node: MdastNodes): string {
  if (node.type === "text" || node.type === "inlineCode" || node.type === "code") return node.value;
  if (node.type === "image") return node.alt ?? "";
  if (node.type === "break" || node.type === "thematicBreak") return " ";
  if (!("children" in node)) return "";
  const parts = (node.children as MdastNodes[]).map(mdastPlainText);
  // Paragraphs, headings and table cells hold phrasing content; every other container holds blocks.
  return parts.join(SEPARATING_PARENTS.has(node.type) ? " " : "");
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
    .use(rehypeEnhance)
    .use(rehypeStringify);

  const mdast = processor.parse(body);
  const text = mdastPlainText(mdast)
    .replace(/\[![a-z]+\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const html = processor.stringify(processor.runSync(mdast));
  return { frontmatter: data, html, toc, text };
}
