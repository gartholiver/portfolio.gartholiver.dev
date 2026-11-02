import { expect, test, type Page } from "@playwright/test";

const HYBRID = "/portfolio/hybrid-wp-react-intranet";
const TECH = `${HYBRID}/technical-requirements`;
const DEMO = `${HYBRID}/views/office-booking-calendar`;
const PLACEHOLDER = `${HYBRID}/views/employee-directory`;

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") errors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

const explorer = (page: Page) => page.getByRole("navigation", { name: "Explorer" });
const content = (page: Page) => page.getByRole("main");
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    main: document.getElementById("content")!.scrollWidth - document.getElementById("content")!.clientWidth,
  }));

/** Tag the live document so a later full page load (which would drop the tag) is detectable. */
const markShell = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { __shellMarker: string }).__shellMarker = "alive";
    document.querySelector("header")?.setAttribute("data-marker", "alive");
  });
const shellSurvived = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __shellMarker?: string }).__shellMarker === "alive" &&
      document.querySelector("header")?.getAttribute("data-marker") === "alive",
  );

test.describe("Markdown documents (desktop)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("README shows properties, title, summary, callout and a side TOC in order", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(HYBRID);

    const props = page.getByRole("list", { name: "Document properties" }).or(page.locator('dl[aria-label="Document properties"]'));
    await expect(props).toContainText("case study");
    await expect(props).toContainText("[Placeholder] Role to be supplied");
    for (const tag of ["WordPress", "React", "Intranet"]) await expect(props.getByText(tag, { exact: true })).toBeVisible();
    await expect(props.getByText("placeholder", { exact: true })).toBeVisible();

    // metadata → h1 → summary, and the TOC is NOT above the h1
    const h1 = content(page).getByRole("heading", { level: 1, name: "Hybrid WordPress + React Intranet" });
    await expect(h1).toBeVisible();
    await expect(content(page).getByText("[Placeholder] One-sentence project summary to be supplied.")).toBeVisible();
    const y = async (loc: ReturnType<Page["locator"]>) => (await loc.boundingBox())!.y;
    expect(await y(props)).toBeLessThan(await y(h1));

    const toc = page.getByRole("navigation", { name: "Table of contents" });
    await expect(toc).toBeVisible(); // only the side TOC is visible at this width
    await expect(toc.getByRole("link", { name: "Overview" })).toBeVisible();
    // H3s nested under their H2
    await expect(toc.locator("ul ul").getByRole("link", { name: "The problem" })).toBeVisible();
    // sticky: stays in view while the panel scrolls
    await content(page).evaluate((m) => (m.scrollTop = 700));
    await expect(toc).toBeInViewport();

    // callout styled by type
    await expect(content(page).locator('aside.callout[data-callout="placeholder"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("TOC links scroll the panel to the section and update the hash", async ({ page }) => {
    await page.goto(HYBRID);
    const toc = page.getByRole("navigation", { name: "Table of contents" });
    await toc.getByRole("link", { name: "Views in this project" }).click();
    await expect(page).toHaveURL(/#views-in-this-project$/);
    const heading = content(page).getByRole("heading", { name: "Views in this project" });
    await expect(heading).toBeInViewport();
    expect(await content(page).evaluate((m) => m.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // nested entry
    await toc.getByRole("link", { name: "Lessons learned" }).click();
    await expect(page).toHaveURL(/#lessons-learned$/);
    await expect(content(page).getByRole("heading", { name: "Lessons learned" })).toBeInViewport();
  });

  test("heading permalinks are decorative but work, and deep links land on the section", async ({ page }) => {
    await page.goto(`${HYBRID}#my-role`);
    await expect(content(page).getByRole("heading", { name: "My role" })).toBeInViewport();
    await page.goto(HYBRID);
    const h2 = content(page).getByRole("heading", { name: "Overview", level: 2 });
    await expect(h2.locator("a.heading-anchor")).toHaveAttribute("aria-hidden", "true");
    await h2.hover();
    await expect(h2.locator("a.heading-anchor")).toHaveCSS("opacity", "1");
    await h2.locator("a.heading-anchor").click();
    await expect(page).toHaveURL(/#overview$/);
  });

  test("internal links navigate client-side: the shell stays mounted and the explorer follows", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(HYBRID);
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAccessibleName(/^README\.md/);
    await markShell(page);

    await content(page).getByRole("link", { name: "employee-directory.html" }).click();
    await expect(page).toHaveURL(PLACEHOLDER);
    await expect(content(page).getByRole("heading", { level: 1, name: "Employee Directory" })).toBeVisible();
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAccessibleName(/^employee-directory\.html/);
    expect(await shellSurvived(page)).toBe(true);

    // placeholder → README via its back link, still client-side
    await content(page).getByRole("link", { name: "Back to project README" }).click();
    await expect(page).toHaveURL(HYBRID);
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAccessibleName(/^README\.md/);
    expect(await shellSurvived(page)).toBe(true);

    // README → technical requirements via "Related documents"
    await content(page).getByRole("link", { name: "technical-requirements.md" }).click();
    await expect(page).toHaveURL(TECH);
    expect(await shellSurvived(page)).toBe(true);

    // modified clicks keep native behaviour (no in-page navigation)
    const before = page.url();
    await content(page).getByRole("link", { name: "README.md", exact: true }).click({ modifiers: ["ControlOrMeta"] });
    expect(page.url()).toBe(before);
    expect(errors).toEqual([]);
  });

  test("technical-requirements renders its own properties, h1, tables and callouts", async ({ page }) => {
    await page.goto(TECH);
    const props = page.locator('dl[aria-label="Document properties"]');
    await expect(props).toContainText("technical requirements");
    await expect(props.getByRole("link", { name: "Hybrid WordPress + React Intranet" })).toHaveAttribute("href", HYBRID);
    await expect(content(page).getByRole("heading", { level: 1, name: "Technical Requirements" })).toBeVisible();
    await expect(content(page).locator('aside.callout[data-callout="info"]')).toBeVisible();
    await expect(content(page).getByRole("region", { name: /^Table:/ }).getByRole("columnheader", { name: "Requirement" })).toBeVisible();
  });

  test("table defaults belong to Markdown content: document tables are styled, demo tables start clean", async ({
    page,
  }) => {
    const cellStyle = (selector: string) =>
      page.locator(selector).first().evaluate((el) => {
        const cs = getComputedStyle(el);
        return { background: cs.backgroundColor, borderTop: cs.borderTopWidth };
      });

    await page.goto(TECH);
    await expect(page.locator(".md-content table").first()).toBeVisible();
    const markdownHeader = await cellStyle(".md-content th");
    expect(markdownHeader.background).toBe("rgb(32, 36, 44)"); // --color-surface-3
    const markdownCell = await cellStyle(".md-content tbody td");
    expect(markdownCell.borderTop).toBe("1px");

    await page.goto(DEMO);
    const demoTable = page.locator('[data-demo] table');
    await expect(demoTable).toBeVisible();
    expect(await demoTable.evaluate((el) => getComputedStyle(el).display)).toBe("table");
    expect(await page.locator(".md-content").count()).toBe(0);
    for (const selector of ["[data-demo] thead th", "[data-demo] tbody th", "[data-demo] td"]) {
      const style = await cellStyle(selector);
      expect(style.borderTop, selector).toBe("0px");
      expect(style.background, selector).not.toBe("rgb(32, 36, 44)");
    }
  });

  test("prerendered HTML contains the document text without JavaScript", async ({ request }) => {
    for (const [url, text, id] of [
      [HYBRID, "A short, anonymised description of what this project is and who it serves.", "overview"],
      [TECH, "Hosting, platform and application structure.", "architecture"],
    ] as const) {
      const res = await request.get(url);
      expect(res.ok()).toBe(true);
      const html = await res.text();
      expect(html).toContain(text);
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain('class="table-scroll"');
      expect(html).toContain("<h1");
    }
  });
});

test.describe("Markdown documents (narrow)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("compact collapsible TOC; links scroll and collapse it", async ({ page }) => {
    await page.goto(HYBRID);
    const toc = page.getByRole("navigation", { name: "Table of contents" });
    await expect(toc).toBeVisible();
    await expect(toc.getByRole("link", { name: "Overview" })).toBeHidden(); // collapsed
    await toc.getByText("Contents", { exact: true }).click();
    await expect(toc.getByRole("link", { name: "My role" })).toBeVisible();
    await toc.getByRole("link", { name: "My role" }).click();
    await expect(page).toHaveURL(/#my-role$/);
    await expect(content(page).getByRole("heading", { name: "My role" })).toBeInViewport();
    await expect(toc.getByRole("link", { name: "My role" })).toBeHidden();
    // side TOC is not rendered visibly: exactly one visible TOC nav
    await expect(page.getByRole("navigation", { name: "Table of contents" })).toHaveCount(1);
  });
});

test.describe("tables at 360px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const url of [TECH, HYBRID]) {
    test(`wide tables scroll inside their own region on ${url}`, async ({ page }) => {
      await page.goto(url);
      const region = content(page).getByRole("region", { name: /^Table:/ }).first();
      await region.scrollIntoViewIfNeeded();
      const m = await region.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, ov: getComputedStyle(el).overflowX }));
      expect(m.ov).toBe("auto");
      expect(m.sw).toBeGreaterThan(m.cw); // overflows → scrolls in place
      expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
      // keyboard-reachable scroll region
      await region.focus();
      await expect(region).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0); // keyboard scroll is animated
      expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
    });
  }
});

test.describe("view pages: light demo frame", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("placeholder view renders inside the light frame with copy from data", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(PLACEHOLDER);
    const main = content(page);
    await expect(main.getByText("Sample data", { exact: true })).toBeVisible();
    const panel = main.getByRole("region", { name: "Employee Directory" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { level: 1, name: "Employee Directory" })).toBeVisible();
    await expect(panel).toContainText("[Placeholder]");
    await expect(panel).toContainText("Coming after the project is reviewed");
    await expect(panel.getByRole("link", { name: "Back to project README" })).toHaveAttribute("href", HYBRID);
    // light panel: dark text on white
    await expect(panel).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(panel).toHaveCSS("color", "rgb(29, 35, 48)");

    // visible focus ring inside the light panel
    await panel.getByRole("link", { name: "Back to project README" }).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const outline = await panel.getByRole("link", { name: "Back to project README" }).evaluate((el) => {
      const cs = getComputedStyle(el);
      return { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor };
    });
    expect(outline).toEqual({ style: "solid", width: "2px", color: "rgb(43, 108, 176)" });
    expect(errors).toEqual([]);
  });

  test("every placeholder view has a distinct explanatory panel", async ({ page }) => {
    const urls = [
      "/portfolio/headless-wp-educational-app/views/challenge-interface",
      "/portfolio/legal-doc-wp-ordering-system/views/custom-woo-extension-plugin",
      "/portfolio/multi-location-inventory-sales-system/views/custom-woo-extension-plugin",
    ];
    const seen = new Set<string>();
    for (const url of urls) {
      await page.goto(url);
      const text = (await content(page).getByText(/^\[Placeholder\] This panel will present/).textContent()) ?? "";
      expect(text.length).toBeGreaterThan(40);
      seen.add(text);
    }
    expect(seen.size).toBe(urls.length);
  });

  test("demo view renders its registered demo in the light frame with the sample-data label", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    const main = content(page);
    await expect(main.getByText("Sample data", { exact: true })).toBeVisible();
    const panel = main.getByRole("region", { name: "Office Booking Calendar" });
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(panel.locator('[data-demo="office-booking-calendar"]')).toBeVisible();
    expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
    expect(errors).toEqual([]);
  });

  test("view pages are prerendered", async ({ request }) => {
    const html = await (await request.get(DEMO)).text();
    expect(html).toContain("Sample data");
    expect(html).toContain("Office Booking Calendar");
  });
});

test.describe("view pages at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const url of [PLACEHOLDER, DEMO]) {
    test(`${url} fits without horizontal scroll`, async ({ page }) => {
      await page.goto(url);
      await expect(content(page).getByText("Sample data", { exact: true })).toBeVisible();
      expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
    });
  }
});
