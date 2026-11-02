import { describe, expect, it } from "vitest";
import { assertLinksValid, findLinkProblems } from "./validate-links";

const README = "/portfolio/hybrid-wp-react-intranet";
const TECH = "/portfolio/hybrid-wp-react-intranet/technical-requirements";
const OTHER = "/portfolio/legal-doc-wp-ordering-system";

const anchors: Record<string, string[]> = {
  "projects/hybrid-wp-react-intranet/README.md": ["title", "my-role"],
  "projects/hybrid-wp-react-intranet/technical-requirements.md": ["title", "architecture"],
  "projects/legal-doc-wp-ordering-system/README.md": ["title", "outcomes"],
};
const lookup = (file: string) => anchors[file] ?? [];
const check = (url: string, ...links: string[]) => findLinkProblems({ url, links }, lookup);

describe("findLinkProblems", () => {
  it("accepts registry URLs, view URLs and trailing slashes", () => {
    expect(check(README, TECH, `${README}/views/office-booking-calendar`, `${TECH}/`, "/")).toEqual([]);
  });

  it("ignores external, mailto and tel links", () => {
    expect(check(README, "https://example.com/nope", "//cdn.example.com/x", "mailto:a@b.co", "tel:+15551234")).toEqual([]);
  });

  it("rejects an unknown path", () => {
    const problems = check(README, "/portfolio/does-not-exist");
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/\/portfolio\/does-not-exist.*not a registered page/);
  });

  it("rejects a relative .md link, resolved against the document URL like a browser", () => {
    const problems = check(README, "technical-requirements.md");
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("/portfolio/technical-requirements.md");
  });

  it("resolves relative links that do land on a registry URL", () => {
    expect(check(TECH, "../hybrid-wp-react-intranet", "views/office-booking-calendar")).toEqual([]);
  });

  it("checks #fragments against the target document's anchors", () => {
    expect(check(README, "#my-role", `${TECH}#architecture`, `${OTHER}#outcomes`)).toEqual([]);
    const bad = check(README, "#nope", `${TECH}#my-role`);
    expect(bad).toHaveLength(2);
    expect(bad[0]).toMatch(/#nope.*not a heading in \/portfolio\/hybrid-wp-react-intranet$/);
    expect(bad[1]).toMatch(/#my-role.*technical-requirements/);
  });

  it("only checks the path for non-Markdown targets", () => {
    expect(check(README, `${README}/views/office-booking-calendar#anything`)).toEqual([]);
    expect(check(README, "/#whatever")).toEqual([]);
  });

  it("allows links to another project", () => {
    expect(check(README, OTHER, `${OTHER}/technical-requirements`)).toEqual([]);
  });

  it("decodes percent-encoded fragments", () => {
    anchors["projects/hybrid-wp-react-intranet/README.md"]!.push("café");
    expect(check(README, "#caf%C3%A9")).toEqual([]);
  });
});

describe("assertLinksValid", () => {
  it("throws one error naming the file and every bad link", () => {
    expect(() => assertLinksValid("projects/x/README.md", { url: README, links: ["/nope", "#missing"] }, lookup)).toThrow(
      /Broken links in content\/projects\/x\/README\.md[\s\S]*\/nope[\s\S]*#missing/,
    );
  });

  it("does not throw for a good document", () => {
    expect(() => assertLinksValid("f.md", { url: README, links: [TECH] }, lookup)).not.toThrow();
  });
});
