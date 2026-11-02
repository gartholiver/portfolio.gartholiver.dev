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
    expect(doc.html).toContain('<h2 id="section-one">Section One</h2>');
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
