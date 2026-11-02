import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./render";
import { loadMarkdown } from "~/content/markdown.server";
import { getEntryByPathname, routeEntries } from "~/content/registry";

describe("renderMarkdown", () => {
  const sample = `---
title: Sample
stack: [A, B]
status: placeholder
---

# Sample

> [!warning] Heads up
> Body **text**.

> Plain quote

## Section One

### Sub section

| a | b |
| - | - |
| 1 | 2 |
`;

  it("parses frontmatter, slugs headings, builds a TOC", () => {
    const doc = renderMarkdown(sample);
    expect(doc.frontmatter).toMatchObject({ title: "Sample", stack: ["A", "B"], status: "placeholder" });
    expect(doc.html).toContain('<h2 id="section-one">Section One<a class="heading-anchor"');
    expect(doc.toc).toEqual([
      { depth: 2, id: "section-one", text: "Section One" },
      { depth: 3, id: "sub-section", text: "Sub section" },
    ]);
    expect(doc.html).toContain("<table>");
    expect(doc.html).not.toContain("---");
  });

  it("renders Obsidian-style callouts and leaves plain blockquotes alone", () => {
    const { html, text } = renderMarkdown(sample);
    expect(html).toContain('<aside class="callout" data-callout="warning">');
    expect(html).toContain('<p class="callout-title">Heads up</p>');
    expect(html).toContain("<strong>text</strong>");
    expect(html).not.toContain("[!warning]");
    expect(html).toContain("<blockquote>");
    expect(text).not.toContain("[!warning]");
  });

  it("separates blocks, list items and table cells with whitespace in the plain text", () => {
    const { text } = renderMarkdown(`# Title

Intro paragraph.

## Files

| File | Title | Type |
| - | - | - |
| lms-scorm-integration.html | LMS / SCORM | Placeholder |
| \`second.html\` | **Bold** cell | Other |

- first item
- second item

> [!tip] Callout title
> Callout body.

Line one  
line *two* ends.
`);
    expect(text).toContain("Title Intro paragraph. Files");
    expect(text).toContain("File Title Type lms-scorm-integration.html LMS / SCORM Placeholder second.html Bold cell Other");
    expect(text).toContain("first item second item");
    expect(text).toContain("Callout title Callout body.");
    expect(text).toContain("line two ends."); // inline emphasis does not introduce gaps
    expect(text).not.toMatch(/FileTitle|TypeUnder|itemsecond|\s{2,}/);
  });

  it("produces readable, space-separated text for every real document", () => {
    for (const entry of routeEntries) {
      if (entry.content.type !== "markdown") continue;
      const { text } = loadMarkdown(entry.content.file);
      expect(text, entry.id).not.toMatch(/[a-z]\.html[A-Z]|[a-z]\.html[a-z]+\.html/);
      expect(text, entry.id).not.toMatch(/\s{2,}/);
    }
  });

  it("adds decorative heading permalinks without polluting TOC text", () => {
    const doc = renderMarkdown(sample);
    expect(doc.html).toContain('<a class="heading-anchor" href="#sub-section" aria-hidden="true" tabindex="-1">#</a>');
    expect(doc.html).not.toMatch(/<h1[^>]*>[^<]*<a/);
    expect(doc.toc.map((t) => t.text)).toEqual(["Section One", "Sub section"]);
    expect(doc.text).not.toContain("#");
  });

  it("marks external links noopener noreferrer and leaves internal links alone", () => {
    const { html } = renderMarkdown("[a](https://example.com) [b](//cdn.example.com/x) [c](/portfolio/x) [d](#top)");
    expect(html).toContain('<a href="https://example.com" rel="noopener noreferrer">a</a>');
    expect(html).toContain('<a href="//cdn.example.com/x" rel="noopener noreferrer">b</a>');
    expect(html).toContain('<a href="/portfolio/x">c</a>');
    expect(html).toContain('<a href="#top">d</a>');
  });

  it("wraps tables in a focusable, labelled scroll region", () => {
    const { html } = renderMarkdown(sample);
    expect(html).toContain('<div class="table-scroll" role="region" aria-label="Table: a, b" tabindex="0"><table>');
    expect(html.match(/<table>/g)).toHaveLength(1);
  });

  it("drops raw HTML", () => {
    expect(renderMarkdown("<script>alert(1)</script>\n\nHi").html).not.toContain("<script>");
  });
});

describe("project Markdown content", () => {
  const docs = routeEntries.flatMap((e) => (e.content.type === "markdown" ? [{ entry: e, file: e.content.file }] : []));

  it.each(docs.map((d) => [d.file, d] as const))("%s is well-formed placeholder content", (_file, { file }) => {
    const doc = loadMarkdown(file);
    expect(doc.frontmatter.status).toBe("placeholder");
    expect(doc.frontmatter.title).toBeTruthy();
    expect(doc.toc.filter((t) => t.depth === 2).length).toBeGreaterThanOrEqual(3);
    expect(doc.toc.some((t) => t.depth === 3)).toBe(true);
    expect(doc.html).toContain("<table>");
    expect(doc.html).toContain('class="callout"');
  });

  it.each(docs.map((d) => [d.file, d] as const))("%s internal links resolve to registry URLs", (_file, { entry, file }) => {
    const hrefs = [...loadMarkdown(file).html.matchAll(/href="(\/[^"#]*)/g)].map((m) => m[1]!);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const target = getEntryByPathname(href);
      expect(target, href).toBeDefined();
      expect(target?.projectId).toBe(entry.projectId);
    }
  });
});
