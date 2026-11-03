import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { entryMeta } from "../app/content/meta";
import { routeEntries, type RouteEntry } from "../app/content/registry";

/**
 * Prerendered HTML must be readable without JavaScript: checked on the files in build/client
 * (what Netlify serves) and by loading each route in a browser context with JS disabled.
 */
const CLIENT_DIR = join(process.cwd(), "build/client");

const decode = (text: string) =>
  text
    .replace(/&amp;|&#x26;|&#38;/g, "&")
    .replace(/&lt;|&#x3C;/gi, "<")
    .replace(/&gt;|&#x3E;/gi, ">")
    .replace(/&quot;|&#x22;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
const textOf = (html: string) => decode(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

function htmlFileFor(url: string) {
  return join(CLIENT_DIR, url === "/" ? "index.html" : `${url.slice(1)}/index.html`);
}

function expectedHeading(entry: RouteEntry): string {
  if (entry.kind === "home") return "Garth Oliver — Portfolio";
  if (entry.content.type === "markdown" && entry.content.docType === "technical-requirements") return "Technical Requirements";
  return entry.title;
}

test.describe("prerendered files", () => {
  for (const entry of routeEntries) {
    test(`${entry.url} has a title, one h1, landmarks and real content in the HTML`, () => {
      const file = htmlFileFor(entry.url);
      expect(existsSync(file), file).toBe(true);
      const html = readFileSync(file, "utf8");

      expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
      expect(html).toContain('<html lang="en"');
      expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
      expect(decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "")).toBe(entryMeta(entry)[0]!.title);
      expect(html).toContain('<meta name="description"');

      const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => textOf(m[1]!));
      expect(h1s).toEqual([expectedHeading(entry)]);

      // the shell landmarks are server-rendered too
      for (const landmark of ["<header", "<nav", "<main", "<footer"]) expect(html, landmark).toContain(landmark);
      expect(html).toContain('aria-label="Explorer"');
      expect(html).toContain(`href="${entry.url}"`);
      expect(html).toContain('aria-current="page"');

      // the page body itself carries readable text (not just a JS bundle and an empty root)
      const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(html)?.[1] ?? "";
      expect(textOf(main).length, "main text length").toBeGreaterThan(entry.kind === "search" ? 40 : 120);
      expect(html).not.toMatch(/undefined|\[object Object\]|NaN/);
    });
  }

  test("Markdown documents include their body text and heading ids", () => {
    const html = readFileSync(htmlFileFor("/portfolio/hybrid-wp-react-intranet"), "utf8");
    for (const id of ["overview", "my-role", "lessons-learned", "views-in-this-project"]) expect(html).toContain(`id="${id}"`);
    expect(html).toContain(
      "This case study is anonymised: the company is described only by its sector, and every person, place and message in the demos is fictional.",
    );
    expect(html).toContain('<aside class="callout"');
  });

  test("the demo view's prerendered HTML contains the interactive table's starting state", () => {
    const html = readFileSync(htmlFileFor("/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar"), "utf8");
    expect(html).toContain("Desk reservations");
    expect(html).toContain("You have 0 reservations this week");
  });

  test("404.html is the prerendered not-found page", () => {
    const html = readFileSync(join(CLIENT_DIR, "404.html"), "utf8");
    expect(html).toContain("404 — File not found");
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
    expect(html).toContain('aria-label="Explorer"');
    expect(html).not.toContain('aria-current="page"');
  });
});

test.describe("JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });

  test("every route shows its heading, explorer links and content", async ({ page }) => {
    test.setTimeout(120_000);
    for (const entry of routeEntries) {
      const response = await page.goto(entry.url);
      expect(response?.status(), entry.url).toBe(200);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 }), entry.url).toHaveText(expectedHeading(entry));
      await expect(page.getByRole("navigation", { name: "Explorer" }).locator(`a[href="${entry.url}"]`), entry.url).toHaveAttribute(
        "aria-current",
        "page",
      );
      const text = await page.getByRole("main").innerText();
      expect(text.length, entry.url).toBeGreaterThan(entry.kind === "search" ? 40 : 120);
    }
  });

  test("the 404 page is readable without JavaScript", async ({ page }) => {
    const response = await page.goto("/no/such/page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("404 — File not found");
    await expect(page.getByRole("link", { name: "Open index.html" })).toHaveAttribute("href", "/");
  });
});
