import { describe, expect, it } from "vitest";
import { nestToc, splitLeadingH1 } from "./toc";

describe("nestToc", () => {
  it("nests H3s under the preceding H2", () => {
    const nodes = nestToc([
      { depth: 2, id: "a", text: "A" },
      { depth: 3, id: "a1", text: "A1" },
      { depth: 3, id: "a2", text: "A2" },
      { depth: 2, id: "b", text: "B" },
    ]);
    expect(nodes.map((n) => [n.item.id, n.children.map((c) => c.id)])).toEqual([
      ["a", ["a1", "a2"]],
      ["b", []],
    ]);
  });

  it("keeps an orphan H3 at the top level", () => {
    expect(nestToc([{ depth: 3, id: "x", text: "X" }])).toEqual([{ item: { depth: 3, id: "x", text: "X" }, children: [] }]);
  });
});

describe("splitLeadingH1", () => {
  it("splits the first h1 from the body", () => {
    expect(splitLeadingH1('<h1 id="t">Title</h1>\n<p>Hi</p>')).toEqual({ id: "t", titleHtml: "Title", rest: "<p>Hi</p>" });
  });
  it("returns the html untouched when there is no leading h1", () => {
    expect(splitLeadingH1("<p>Hi</p>")).toEqual({ id: null, titleHtml: null, rest: "<p>Hi</p>" });
  });
});
