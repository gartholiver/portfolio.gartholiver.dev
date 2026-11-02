import { expect, test, type Locator, type Page } from "@playwright/test";
import { entries, getAncestors, isActionEntry, projects, routeEntries, type RegistryEntry, type RouteEntry } from "../app/content/registry";
import { entryMeta } from "../app/content/meta";

/**
 * Phase 1 verification sweep: gaps the feature specs don't cover — every registry entry through the
 * explorer, deep links with anchors, search snippets, every route at every width, focus indicators,
 * reduced motion and hydration health. Feature behaviour (booking, contact, search UI, drawer, …)
 * lives in the per-feature specs; the mapping is listed in the Task 8 handoff.
 */

const HYBRID = "/portfolio/hybrid-wp-react-intranet";
const TECH = `${HYBRID}/technical-requirements`;

function collectProblems(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") problems.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => problems.push(`requestfailed: ${req.url()}`));
  page.on("response", (res) => {
    // Only the 404 page's own document is allowed to be a 4xx.
    if (res.status() >= 400 && res.request().resourceType() !== "document") problems.push(`${res.status()}: ${res.url()}`);
  });
  return problems;
}

const explorer = (page: Page) => page.getByRole("navigation", { name: "Explorer" });
const main = (page: Page) => page.getByRole("main");
const h1 = (page: Page) => main(page).getByRole("heading", { level: 1 });
const terminalBody = (page: Page) => page.locator("#terminal-body");

const listId = (path: string) => `explorer-list__${path.replace(/\//g, "__")}`;

/** Expected visible <h1> text for a route entry. */
function expectedHeading(entry: RouteEntry): string {
  if (entry.kind === "home") return "Garth Oliver — Portfolio";
  if (entry.content.type === "markdown" && entry.content.docType === "technical-requirements") return "Technical Requirements";
  return entry.title;
}

/** Expand every collapsed ancestor folder of `entry` through its explorer disclosure button. */
async function revealInExplorer(page: Page, entry: RegistryEntry) {
  for (const folder of getAncestors(entry)) {
    const toggle = explorer(page).locator(`button[aria-controls="${listId(folder.path)}"]`);
    if ((await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }
}

const overflowOf = (page: Page) =>
  page.evaluate(() => {
    const content = document.getElementById("content")!;
    return {
      doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
      main: content.scrollWidth - content.clientWidth,
      winX: window.scrollX,
    };
  });

test.describe("every explorer entry (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the registry has the expected shape", () => {
    expect(entries.length).toBe(31);
    expect(entries.filter(isActionEntry)).toHaveLength(1);
    expect(routeEntries).toHaveLength(30);
    // README.md / technical-requirements.md / custom-woo-extension-plugin.html all repeat across projects
    const labels = entries.map((e) => e.label);
    expect(labels.filter((l) => l === "README.md")).toHaveLength(projects.length);
    expect(labels.filter((l) => l === "custom-woo-extension-plugin.html")).toHaveLength(2);
  });

  for (const entry of routeEntries) {
    test(`${entry.explorerPath} → ${entry.url}`, async ({ page }) => {
      const problems = collectProblems(page);
      // Start from a different page so the click is a real client-side navigation.
      await page.goto(entry.url === "/search" ? "/stack" : "/search");
      await revealInExplorer(page, entry);

      const link = explorer(page).locator(`a[href="${entry.url}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("title", entry.explorerPath);
      await link.click();

      await expect(page).toHaveURL(new RegExp(`${entry.url === "/" ? "/" : entry.url}$`));
      await expect(h1(page)).toHaveText(expectedHeading(entry));
      await expect(page).toHaveTitle(entryMeta(entry)[0]!.title!);

      // exactly one explorer link is current, and it is this one (duplicate filenames don't light up)
      const current = explorer(page).locator('[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute("href", entry.url);
      await expect(current).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Breadcrumb" }).locator('[aria-current="page"]')).toHaveText(entry.label);

      // content belongs to this entry (markdown docs and views carry their registry id)
      if (entry.kind === "markdown" || entry.kind === "view" || entry.kind === "demo") {
        await expect(page.locator("article[data-entry-id]")).toHaveAttribute("data-entry-id", entry.id);
      }
      expect(problems).toEqual([]);
    });
  }

  test("contact.bash opens the contact terminal without navigating, from a collapsed terminal", async ({ page }) => {
    const action = entries.find(isActionEntry)!;
    await page.goto("/stack");
    const toggle = page.getByRole("region", { name: /terminal/i }).getByRole("button", { name: /terminal/i });
    await toggle.click();
    await expect(terminalBody(page)).toBeHidden();

    await revealInExplorer(page, action);
    const before = page.url();
    await explorer(page).getByRole("button", { name: /^contact\.bash/ }).click();
    expect(page.url()).toBe(before);
    await expect(terminalBody(page)).toBeVisible();
    await expect(page.locator("#contact-input")).toBeFocused();
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", "/stack");
  });

  test("duplicate filenames in different projects resolve to their own content", async ({ page }) => {
    const pairs = [
      ["README.md", "/portfolio/legal-doc-wp-ordering-system", "/portfolio/multi-location-inventory-sales-system"],
      ["technical-requirements.md", "/portfolio/legal-doc-wp-ordering-system/technical-requirements", "/portfolio/hybrid-wp-react-intranet/technical-requirements"],
      [
        "custom-woo-extension-plugin.html",
        "/portfolio/legal-doc-wp-ordering-system/views/custom-woo-extension-plugin",
        "/portfolio/multi-location-inventory-sales-system/views/custom-woo-extension-plugin",
      ],
    ] as const;
    for (const [label, a, b] of pairs) {
      const entryA = routeEntries.find((e) => e.url === a)!;
      const entryB = routeEntries.find((e) => e.url === b)!;
      expect(entryA.label).toBe(label);
      expect(entryB.label).toBe(label);
      await page.goto(a);
      await expect(page.locator("article[data-entry-id]")).toHaveAttribute("data-entry-id", entryA.id);
      await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", a);
      await page.goto(b);
      await expect(page.locator("article[data-entry-id]")).toHaveAttribute("data-entry-id", entryB.id);
      await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", b);
      // switching client-side between the two keeps the right file highlighted
      await revealInExplorer(page, entryA);
      await explorer(page).locator(`a[href="${a}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${a}$`));
      await expect(explorer(page).locator('[aria-current="page"]')).toHaveCount(1);
      await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", a);
    }
  });
});

test.describe("deep links with anchors, refresh and history (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const heading = (page: Page, name: string) => main(page).getByRole("heading", { name });

  test("a direct /portfolio/...#section load selects the document and scrolls to the section", async ({ page }) => {
    const problems = collectProblems(page);
    await page.goto(`${HYBRID}#my-role`);
    await expect(h1(page)).toHaveText("Hybrid WordPress + React Intranet");
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", HYBRID);
    await expect(heading(page, "My role")).toBeInViewport();
    expect(await main(page).evaluate((m) => m.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // refresh keeps the hash and lands on the same section
    await page.reload();
    expect(new URL(page.url()).hash).toBe("#my-role");
    await expect(heading(page, "My role")).toBeInViewport();
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", HYBRID);
    expect(problems).toEqual([]);
  });

  test("a direct load of a technical-requirements anchor works too", async ({ page }) => {
    await page.goto(`${TECH}#data-model`);
    await expect(h1(page)).toHaveText("Technical Requirements");
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", TECH);
    await expect(heading(page, "Data model")).toBeInViewport();
  });

  test("back/forward move between anchors and documents", async ({ page }) => {
    const problems = collectProblems(page);
    await page.goto(`${HYBRID}#my-role`);
    const toc = page.getByRole("navigation", { name: "Table of contents" });
    await toc.getByRole("link", { name: "Lessons learned" }).click();
    await expect(page).toHaveURL(/#lessons-learned$/);
    await expect(heading(page, "Lessons learned")).toBeInViewport();

    // to another document client-side, then back through both history entries
    await main(page).getByRole("link", { name: "technical-requirements.md" }).click();
    await expect(page).toHaveURL(TECH);
    await expect(h1(page)).toHaveText("Technical Requirements");
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", TECH);

    await page.goBack();
    await expect(page).toHaveURL(/hybrid-wp-react-intranet#lessons-learned$/);
    await expect(h1(page)).toHaveText("Hybrid WordPress + React Intranet");
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", HYBRID);
    await expect(heading(page, "Lessons learned")).toBeInViewport();

    await page.goBack();
    await expect(page).toHaveURL(/#my-role$/);
    await expect(heading(page, "My role")).toBeInViewport();

    await page.goForward();
    await expect(page).toHaveURL(/#lessons-learned$/);
    await expect(heading(page, "Lessons learned")).toBeInViewport();
    await page.goForward();
    await expect(page).toHaveURL(TECH);
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", TECH);
    expect(problems).toEqual([]);
  });

  test("an unknown hash on a real page is harmless", async ({ page }) => {
    const problems = collectProblems(page);
    await page.goto(`${HYBRID}#no-such-section`);
    await expect(h1(page)).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("a hash on a client-side navigation scrolls the target section", async ({ page }) => {
    await page.goto("/search?q=anonymised");
    await expect(main(page).getByRole("list", { name: "Search results" })).toBeVisible();
    await page.goto(`${TECH}#performance-and-accessibility`);
    await expect(heading(page, "Performance and accessibility")).toBeInViewport();
  });
});

test.describe("search snippets", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("table cells and neighbouring blocks are separated by spaces in snippets", async ({ page }) => {
    await page.goto("/search?q=scorm");
    const results = main(page).getByRole("list", { name: "Search results" }).getByRole("listitem");
    await expect(results.first()).toBeVisible();
    // innerText reflects what is rendered (block boundaries become line breaks), unlike textContent.
    const texts = await results.allInnerTexts();
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) {
      expect(text).not.toMatch(/\.html[A-Z]/); // "lms-scorm-integration.htmlLMS / SCORM"
      expect(text).not.toMatch(/FileTitle|TitleType/);
    }
    // the README's views table renders its cells apart
    const readme = results.filter({ hasText: "portfolio/headless-wp-educational-app/README.md" });
    await expect(readme).toContainText(/lms-scorm-integration\.html\s+LMS \/ SCORM/i);
  });
});

test.describe("search: empty and unmatched queries", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const query of ["", "   ", "%20", "zzzxqv", "<script>alert(1)</script>", "%", "a".repeat(300)]) {
    test(`query ${JSON.stringify(query.length > 20 ? query.slice(0, 12) + "…" : query)} does not break the page`, async ({ page }) => {
      const problems = collectProblems(page);
      await page.goto(`/search?q=${query.startsWith("%") && query.length <= 3 ? query : encodeURIComponent(query)}`);
      await expect(h1(page)).toHaveText("Search");
      const empty = main(page).getByRole("heading", { name: "Start typing to search" });
      const none = main(page).getByRole("heading", { name: "No results" });
      await expect(empty.or(none)).toBeVisible();
      await expect(main(page).locator("script")).toHaveCount(0);
      expect(await overflowOf(page)).toEqual({ doc: 0, body: 0, main: 0, winX: 0 });
      expect(problems).toEqual([]);
    });
  }
});

test.describe("unknown URLs", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const unknown = [
    "/nope",
    "/portfolio",
    "/portfolio/nope",
    "/portfolio/hybrid-wp-react-intranet/views/nope",
    "/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar/extra",
    "/docs/contact", // contact.bash is an action, not a page
    "/docs/about/more",
    "/stack.json",
    "/search/extra",
    "/a/b/c/d/e",
  ];

  for (const path of unknown) {
    test(`${path} → HTTP 404 with the 404 page inside the shell`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(h1(page)).toHaveText("404 — File not found");
      await expect(explorer(page)).toBeVisible();
      await expect(explorer(page).locator('[aria-current="page"]')).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    });
  }

  test("the 404 document is a real 404 for non-browser clients too", async ({ request }) => {
    for (const path of unknown) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
      expect(await res.text(), path).toContain("404 — File not found");
    }
  });
});

test.describe("hydration health: no console errors, warnings or failed requests", () => {
  for (const width of [1440, 360]) {
    test(`every route at ${width}px`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 740 });
      const problems = collectProblems(page);
      for (const entry of routeEntries) {
        await page.goto(entry.url);
        // React attaches fibers to server-rendered nodes once it has hydrated them
        await expect
          .poll(() => page.evaluate(() => Object.keys(document.getElementById("content")!).some((k) => k.startsWith("__react"))), {
            message: `${entry.url} hydrated`,
          })
          .toBe(true);
        await expect(h1(page)).toBeVisible();
      }
      expect(problems).toEqual([]);
      // and the 404 route (its document request is a 404 by design)
      await page.goto("/missing");
      await expect(h1(page)).toContainText("404");
      expect(problems.filter((p) => !/404/.test(p))).toEqual([]);
    });
  }
});

for (const width of [360, 768, 1440]) {
  test.describe(`every route at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 900 : 800 } });

    test("no horizontal page scroll, main heading visible, explorer reachable", async ({ page }) => {
      test.setTimeout(120_000);
      const paths = [...routeEntries.map((e) => e.url), "/search?q=wordpress", "/search?q=zzzxqv", "/missing-page"];
      for (const path of paths) {
        await page.goto(path);
        const heading = h1(page);
        await expect(heading, path).toBeVisible();
        expect(await overflowOf(page), path).toEqual({ doc: 0, body: 0, main: 0, winX: 0 });
        const box = (await heading.boundingBox())!;
        expect(box.x, path).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, path).toBeLessThanOrEqual(width + 0.5);

        const entry = routeEntries.find((e) => e.url === path);
        if (width >= 900) {
          await expect(explorer(page), path).toBeVisible();
          if (entry) await expect(explorer(page).locator('[aria-current="page"]'), path).toBeInViewport();
        } else {
          const trigger = page.getByRole("button", { name: "Explorer", exact: true });
          await expect(trigger, path).toBeVisible();
          await trigger.click();
          const drawer = page.getByRole("dialog", { name: "Explorer" });
          await expect(drawer, path).toBeVisible();
          const drawerBox = (await drawer.boundingBox())!;
          expect(drawerBox.x + drawerBox.width, path).toBeLessThanOrEqual(width + 0.5);
          if (entry) await expect(drawer.locator('[aria-current="page"]'), path).toBeInViewport();
          await page.keyboard.press("Escape");
          await expect(drawer, path).toHaveCount(0);
        }
      }
    });
  });
}

test.describe("keyboard-open approximation (360x400)", () => {
  test.use({ viewport: { width: 360, height: 400 } });

  test("every route keeps a usable content panel and reachable heading", async ({ page }) => {
    test.setTimeout(120_000);
    for (const path of [...routeEntries.map((e) => e.url), "/missing-page"]) {
      await page.goto(path);
      const panel = (await main(page).boundingBox())!;
      expect(panel.height, path).toBeGreaterThanOrEqual(150);
      await h1(page).scrollIntoViewIfNeeded();
      await expect(h1(page), path).toBeInViewport();
      expect((await overflowOf(page)).doc, path).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1), path).toBe(true);
    }
  });

  test("the Explorer menu and drawer stay reachable", async ({ page }) => {
    await page.goto(`${HYBRID}/views/office-booking-calendar`);
    const trigger = page.getByRole("button", { name: "Explorer", exact: true });
    await expect(trigger).toBeInViewport();
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Explorer" });
    await expect(drawer.getByRole("button", { name: "Close explorer" })).toBeInViewport();
    // the list scrolls inside the drawer; the active file can be reached
    await drawer.locator('[aria-current="page"]').scrollIntoViewIfNeeded();
    await expect(drawer.locator('[aria-current="page"]')).toBeInViewport();
  });

  test("the contact terminal's input and buttons stay in view, including after an error", async ({ page }) => {
    await page.goto("/");
    await main(page).getByRole("button", { name: "Open contact terminal" }).click();
    const input = page.locator("#contact-input");
    await expect(input).toBeFocused();
    const within = async (target: Locator) => {
      const frame = (await terminalBody(page).boundingBox())!;
      const box = (await target.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(frame.y - 1);
      expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(400);
    };
    await within(input);
    await terminalBody(page).getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator("#contact-error")).toBeVisible();
    await within(input);
    await within(page.locator("#contact-error"));
    await within(terminalBody(page).getByRole("button", { name: "Continue", exact: true }));
  });
});

test.describe("keyboard focus is always visible", () => {
  const pages: [string, number][] = [
    ["/", 1440],
    [HYBRID, 1440],
    [`${HYBRID}/views/office-booking-calendar`, 1440],
    [`${HYBRID}/views/employee-directory`, 1440],
    ["/search?q=wordpress", 1440],
    ["/stack", 1440],
    ["/docs/about", 1440],
    ["/docs", 1440],
    ["/missing-page", 1440],
    [`${HYBRID}/views/office-booking-calendar`, 360],
    [HYBRID, 360],
  ];

  for (const [path, width] of pages) {
    test(`every Tab stop on ${path} at ${width}px shows a focus indicator`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await expect(h1(page)).toBeVisible();
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

      const failures: string[] = [];
      let stops = 0;
      const seen = new Set<string>();
      for (let i = 0; i < 160; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const id = el.tagName + "|" + (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40) + "|" + el.getAttribute("href");
          const outlineWidth = parseFloat(cs.outlineWidth);
          const visibleOutline = cs.outlineStyle !== "none" && outlineWidth >= 2 && cs.outlineColor !== "rgba(0, 0, 0, 0)";
          const visibleShadow = cs.boxShadow !== "none";
          return { id, visibleOutline, visibleShadow, area: rect.width * rect.height, outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` };
        });
        if (!info) break;
        if (seen.has(info.id)) break; // wrapped around
        seen.add(info.id);
        stops++;
        if (!info.visibleOutline && !info.visibleShadow) failures.push(`${info.id} → ${info.outline}`);
      }
      expect(stops).toBeGreaterThan(5);
      expect(failures).toEqual([]);
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  /** Every element's computed transition/animation durations and delays, in seconds. */
  const motion = (page: Page) =>
    page.evaluate(() => {
      const seconds = (list: string) => list.split(",").map((v) => (v.trim().endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v)));
      const offenders: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("body, body *")) {
        const cs = getComputedStyle(el);
        const values = [...seconds(cs.transitionDuration), ...seconds(cs.animationDuration), ...seconds(cs.transitionDelay), ...seconds(cs.animationDelay)];
        const worst = Math.max(...values.filter((v) => !Number.isNaN(v)), 0);
        if (worst > 0.011 || cs.scrollBehavior === "smooth") {
          offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} ${cs.transitionDuration} / ${cs.animationDuration} / ${cs.scrollBehavior}`);
        }
      }
      const running = document.getAnimations().filter((a) => Number(a.effect?.getComputedTiming().duration ?? 0) > 20);
      return { offenders, running: running.length, matches: matchMedia("(prefers-reduced-motion: reduce)").matches };
    });

  test("shell, drawer, backdrop, explorer and terminal have no real transitions or animations (360px)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    let result = await motion(page);
    expect(result.matches).toBe(true);
    expect(result.offenders).toEqual([]);

    await page.getByRole("button", { name: "Explorer", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Explorer" })).toBeVisible();
    result = await motion(page);
    expect(result).toMatchObject({ offenders: [], running: 0 });
    // the drawer is in place immediately, not mid-slide
    const box = (await page.locator("#explorer-drawer").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Explorer", exact: true }).click();
    await page.getByRole("button", { name: "docs", exact: true }).click();
    await page.getByRole("button", { name: /^contact\.bash/ }).click();
    await expect(terminalBody(page)).toBeVisible();
    result = await motion(page);
    expect(result).toMatchObject({ offenders: [], running: 0 });
  });

  test("desktop shell, markdown, TOC and demo have no real transitions or animations (1440px)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const path of ["/", HYBRID, `${HYBRID}/views/office-booking-calendar`, "/search?q=wordpress"]) {
      await page.goto(path);
      await expect(h1(page)).toBeVisible();
      expect(await motion(page), path).toMatchObject({ offenders: [], running: 0 });
    }
    // interaction: hover/press on demo cells and heading permalinks
    await page.goto(`${HYBRID}/views/office-booking-calendar`);
    await main(page).getByRole("button", { name: "Reserve Desk B1 on Tuesday 3 November" }).click();
    expect(await motion(page)).toMatchObject({ offenders: [], running: 0 });
  });

  test("in-page anchor jumps are instant (no smooth scrolling)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(HYBRID);
    await page.getByRole("navigation", { name: "Table of contents" }).getByRole("link", { name: "Lessons learned" }).click();
    // an instant jump has already settled one frame later; a smooth scroll would still be moving
    const a = await main(page).evaluate((m) => m.scrollTop);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const b = await main(page).evaluate((m) => m.scrollTop);
    expect(b).toBe(a);
    expect(a).toBeGreaterThan(0);
  });
});
