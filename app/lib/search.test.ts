import { describe, expect, it } from "vitest";
import { describeKind, fold, highlight, makeSnippet, search, tokenize, type SearchableDoc } from "./search";

function doc(partial: Partial<SearchableDoc> & Pick<SearchableDoc, "id" | "title">): SearchableDoc {
  return {
    url: `/${partial.id}`,
    label: `${partial.id}.md`,
    explorerPath: `portfolio/${partial.id}.md`,
    kind: "markdown",
    tags: [],
    description: "",
    text: "",
    ...partial,
  };
}

const docs: SearchableDoc[] = [
  doc({
    id: "intranet",
    title: "Hybrid WordPress + React Intranet",
    label: "README.md",
    projectTitle: "Hybrid WordPress + React Intranet",
    tags: ["WordPress", "React", "Intranet"],
    description: "Project summary for the intranet.",
    text: "An anonymised description of the staff portal.\n\nThe booking calendar uses a café-style layout.",
  }),
  doc({
    id: "intranet-tr",
    title: "Hybrid WordPress + React Intranet — Technical Requirements",
    label: "technical-requirements.md",
    projectTitle: "Hybrid WordPress + React Intranet",
    tags: ["WordPress", "React", "Intranet"],
    text: "Requirements mention caching and the Employee Directory.",
  }),
  doc({
    id: "directory",
    title: "Employee Directory",
    kind: "view",
    label: "employee-directory.html",
    projectTitle: "Hybrid WordPress + React Intranet",
    tags: ["WordPress", "React", "Intranet"],
    description: "Placeholder view.",
    text: "Placeholder view.",
  }),
  doc({
    id: "orders",
    title: "Legal Document Ordering",
    label: "README.md",
    projectTitle: "Legal Document WordPress Ordering System",
    tags: ["WooCommerce", "Gravity Forms"],
    text: "Orders flow through WooCommerce with a lot of WordPress glue.",
  }),
  doc({
    id: "stack",
    title: "Tech Stack",
    kind: "stack",
    label: "package.json",
    tags: ["stack", "tools"],
    description: "Tech stack and tooling preferences.",
    text: "Tech stack and tooling preferences.",
  }),
];

const ids = (results: ReturnType<typeof search>) => results.map((r) => r.doc.id);

describe("fold / tokenize", () => {
  it("is case- and diacritic-insensitive", () => {
    expect(fold("Café Ünïcode ÉCOLE")).toBe("cafe unicode ecole");
    expect(tokenize("  Café   café  BOOKING ")).toEqual(["cafe", "booking"]);
    expect(tokenize("   ")).toEqual([]);
  });

  it("caps the number of terms", () => {
    expect(tokenize("a b c d e f g h i j", 3)).toEqual(["a", "b", "c"]);
  });
});

describe("search matching", () => {
  it("finds by title", () => {
    expect(ids(search(docs, "legal"))).toEqual(["orders"]);
  });

  it("finds by filename (label), with or without the extension", () => {
    expect(ids(search(docs, "package.json"))).toEqual(["stack"]);
    expect(ids(search(docs, "package"))).toContain("stack");
    expect(ids(search(docs, "technical-requirements"))).toEqual(["intranet-tr"]);
    expect(ids(search(docs, "employee-directory"))).toEqual(["directory"]);
  });

  it("finds by project name", () => {
    const results = search(docs, "legal document wordpress");
    expect(ids(results)).toEqual(["orders"]);
    const viaProject = search(docs, "hybrid");
    expect(viaProject.find((r) => r.doc.id === "directory")?.fields).toContain("project");
  });

  it("finds by tag", () => {
    expect(ids(search(docs, "gravity")).sort()).toEqual(["orders"]);
    const tags = search(docs, "woocommerce");
    expect(tags[0]!.doc.id).toBe("orders");
    expect(tags[0]!.fields).toContain("tags");
  });

  it("finds by body text and says so", () => {
    const results = search(docs, "portal");
    expect(ids(results)).toEqual(["intranet"]);
    expect(results[0]!.fields).toEqual(["text"]);
  });

  it("requires every term to match (AND), in any field", () => {
    expect(ids(search(docs, "intranet caching"))).toEqual(["intranet-tr"]);
    expect(search(docs, "intranet zebra")).toEqual([]);
  });

  it("returns nothing for an empty or whitespace query", () => {
    expect(search(docs, "")).toEqual([]);
    expect(search(docs, "   \t ")).toEqual([]);
  });

  it("returns nothing when no document matches", () => {
    expect(search(docs, "xyzzy-not-here")).toEqual([]);
  });

  it("ignores case and diacritics in both directions", () => {
    expect(ids(search(docs, "CAFE"))).toEqual(["intranet"]);
    expect(ids(search(docs, "café"))).toEqual(["intranet"]);
    expect(ids(search(docs, "WORDPRESS")).length).toBeGreaterThan(0);
    expect(ids(search([doc({ id: "x", title: "Résumé" })], "resume"))).toEqual(["x"]);
  });
});

describe("search ranking", () => {
  it("ranks title matches above tag matches above body matches", () => {
    const set = [
      doc({ id: "body", title: "Notes", text: "We talk about orders here." }),
      doc({ id: "tag", title: "Other", tags: ["orders"] }),
      doc({ id: "title", title: "Orders overview" }),
    ];
    expect(ids(search(set, "orders"))).toEqual(["title", "tag", "body"]);
  });

  it("ranks filename matches above project, tag and body matches", () => {
    const set = [
      doc({ id: "body", title: "A", label: "a.md", text: "readme mentioned in passing" }),
      doc({ id: "project", title: "B", label: "b.md", projectTitle: "Readme Project" }),
      doc({ id: "file", title: "C", label: "README.md" }),
    ];
    expect(ids(search(set, "readme"))).toEqual(["file", "project", "body"]);
  });

  it("prefers exact and prefix matches over mid-word substrings", () => {
    const set = [
      doc({ id: "sub", title: "Subcalendar" }),
      doc({ id: "word", title: "Office calendar" }),
      doc({ id: "prefix", title: "Calendar tools" }),
      doc({ id: "exact", title: "Calendar" }),
    ];
    expect(ids(search(set, "calendar"))).toEqual(["exact", "prefix", "word", "sub"]);
  });

  it("boosts a multi-word phrase found verbatim in the title", () => {
    const set = [
      doc({ id: "split", title: "Directory of the Employee", text: "" }),
      doc({ id: "phrase", title: "Employee Directory" }),
    ];
    expect(ids(search(set, "employee directory"))[0]).toBe("phrase");
  });

  it("breaks ties by README, technical requirements, views, then index order", () => {
    const hits = search(docs, "wordpress");
    // Title matches first (README before technical requirements); then "orders" (project name,
    // README) and "directory" (project name, view) tie on score and the README wins.
    expect(ids(hits)).toEqual(["intranet", "intranet-tr", "orders", "directory"]);
  });
});

describe("highlight", () => {
  it("splits text into plain and matched segments", () => {
    expect(highlight("Hybrid WordPress Intranet", ["wordpress"])).toEqual([
      { text: "Hybrid ", match: false },
      { text: "WordPress", match: true },
      { text: " Intranet", match: false },
    ]);
  });

  it("returns a single plain segment when nothing matches or there are no terms", () => {
    expect(highlight("Nothing here", ["zzz"])).toEqual([{ text: "Nothing here", match: false }]);
    expect(highlight("Nothing here", [])).toEqual([{ text: "Nothing here", match: false }]);
    expect(highlight("", ["a"])).toEqual([]);
  });

  it("merges overlapping and adjacent terms into one mark", () => {
    const segments = highlight("workflow", ["work", "orkf"]);
    expect(segments).toEqual([
      { text: "workf", match: true },
      { text: "low", match: false },
    ]);
  });

  it("maps matches back through diacritics and case", () => {
    expect(highlight("Un café très Chaud", tokenize("cafe chaud"))).toEqual([
      { text: "Un ", match: false },
      { text: "café", match: true },
      { text: " très ", match: false },
      { text: "Chaud", match: true },
    ]);
    // Decomposed input (e + combining acute) is highlighted as a whole character.
    const decomposed = highlight("café!", ["cafe"]);
    expect(decomposed.map((s) => s.text).join("")).toBe("café!");
    expect(decomposed[0]).toEqual({ text: "café", match: true });
  });

  it("never injects HTML: segments are plain text", () => {
    const segments = highlight("<b>bold</b>", ["bold"]);
    expect(segments.map((s) => s.text).join("")).toBe("<b>bold</b>");
  });
});

describe("makeSnippet", () => {
  const long =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(8) +
    "The needle sits right here in the middle. " +
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(8);

  it("centres on the first match, bounds the length and adds ellipses", () => {
    const segments = makeSnippet(long, ["needle"], 120);
    const text = segments.map((s) => s.text).join("");
    expect(text.startsWith("…")).toBe(true);
    expect(text.endsWith("…")).toBe(true);
    expect(text.length).toBeLessThanOrEqual(120 + 4);
    expect(segments.filter((s) => s.match).map((s) => s.text)).toEqual(["needle"]);
  });

  it("starts at the beginning (no leading ellipsis) when the match is early", () => {
    const segments = makeSnippet("A needle at the start of a short note.", ["needle"]);
    expect(segments.map((s) => s.text).join("")).toBe("A needle at the start of a short note.");
    expect(segments.some((s) => s.match)).toBe(true);
  });

  it("falls back to the start of the text without a match and collapses whitespace", () => {
    const segments = makeSnippet("First line.\n\n   Second   line.", ["zzz"]);
    expect(segments).toEqual([{ text: "First line. Second line.", match: false }]);
    expect(makeSnippet("", ["a"])).toEqual([]);
  });

  it("is used by search: body snippet when the body matched, description otherwise", () => {
    const body = search(docs, "portal")[0]!;
    expect(body.snippet.map((s) => s.text).join("")).toContain("staff portal");
    expect(body.snippet.some((s) => s.match && s.text.toLowerCase() === "portal")).toBe(true);

    const meta = search(docs, "legal")[0]!;
    expect(meta.title.some((s) => s.match && s.text === "Legal")).toBe(true);
  });
});

describe("describeKind", () => {
  it("labels documents for result captions", () => {
    expect(describeKind({ kind: "markdown", label: "README.md" })).toBe("Case study");
    expect(describeKind({ kind: "markdown", label: "technical-requirements.md" })).toBe("Technical requirements");
    expect(describeKind({ kind: "demo", label: "x.html" })).toBe("Interactive demo");
    expect(describeKind({ kind: "view", label: "x.html" })).toBe("Placeholder view");
    expect(describeKind({ kind: "stack", label: "package.json" })).toBe("Page");
  });
});
