import { expect, test, type Page } from "@playwright/test";

const LEGAL = "/portfolio/legal-doc-wp-ordering-system";
const VIEW = `${LEGAL}/views/custom-woo-extension-plugin`;

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") errors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

const explorer = (page: Page) => page.getByRole("navigation", { name: "Explorer" });
const terminal = (page: Page) => page.getByRole("region", { name: /terminal/i });
const activeInTerminal = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest("#terminal-panel"));
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
    winX: window.scrollX,
  }));

test.describe("desktop shell", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("has landmarks, a skip link and a pinned layout", async ({ page }) => {
    await page.goto(LEGAL);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(explorer(page)).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(terminal(page)).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("phase 1 · placeholder content");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();

    // Fixed panel sizes
    const box = async (loc: ReturnType<Page["locator"]>) => (await loc.boundingBox())!;
    expect((await box(page.locator("#explorer-drawer"))).width).toBeCloseTo(280, 0);
    // the terminal starts collapsed (header bar only); opened it is 252px tall
    await expect(page.locator("#terminal-body")).toBeHidden();
    await page.getByRole("contentinfo").getByRole("button", { name: "Terminal" }).click();
    expect((await box(page.locator("#terminal-panel"))).height).toBeCloseTo(252, 0);
    // page is pinned: the window never scrolls, <main> does
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
    expect(await page.getByRole("main").evaluate((m) => m.scrollHeight > m.clientHeight)).toBe(true);

    // skip link
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    expect(new URL(page.url()).hash).toBe("");
  });

  test("explorer files navigate and the active file is highlighted", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAccessibleName("index.html");

    const project = explorer(page).getByRole("button", { name: "hybrid-wp-react-intranet" });
    await expect(project).toHaveAttribute("aria-expanded", "false");
    await project.click();
    await expect(project).toHaveAttribute("aria-expanded", "true");

    await explorer(page).getByRole("link", { name: /^technical-requirements\.md in portfolio \/ hybrid/ }).click();
    await expect(page).toHaveURL(/\/portfolio\/hybrid-wp-react-intranet\/technical-requirements$/);
    const current = explorer(page).locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", "/portfolio/hybrid-wp-react-intranet/technical-requirements");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).locator('[aria-current="page"]')).toHaveText(
      "technical-requirements.md",
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Shell stays mounted: folder state the user chose survives navigation.
    await expect(project).toHaveAttribute("aria-expanded", "true");
    expect(errors).toEqual([]);
  });

  test("direct links and refreshes reveal the file's ancestor folders", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(VIEW);
    for (const name of ["portfolio", "legal-doc-wp-ordering-system", "views"]) {
      await expect(explorer(page).getByRole("button", { name, exact: true })).toHaveAttribute("aria-expanded", "true");
    }
    await expect(explorer(page).getByRole("button", { name: "headless-wp-educational-app" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    const current = explorer(page).locator('[aria-current="page"]');
    await expect(current).toBeVisible();
    await expect(current).toHaveAttribute("href", VIEW);

    // duplicate filename in another project does not light up
    await page.reload();
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", VIEW);
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("back/forward keep the explorer selection in sync", async ({ page }) => {
    await page.goto("/");
    await explorer(page).getByRole("button", { name: "docs", exact: true }).click();
    await explorer(page).getByRole("link", { name: /^about\.html/ }).click();
    await expect(page).toHaveURL(/\/docs\/about$/);
    await explorer(page).getByRole("link", { name: "package.json" }).click();
    await expect(page).toHaveURL(/\/stack$/);
    const current = explorer(page).locator('[aria-current="page"]');
    await expect(current).toHaveAttribute("href", "/stack");

    await page.goBack();
    await expect(page).toHaveURL(/\/docs\/about$/);
    await expect(current).toHaveAttribute("href", "/docs/about");
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(current).toHaveAttribute("href", "/");
    await page.goForward();
    await expect(page).toHaveURL(/\/docs\/about$/);
    await expect(current).toHaveAttribute("href", "/docs/about");

    // Back to a deep file after navigating away re-reveals its folders.
    await page.goto(VIEW);
    await explorer(page).getByRole("button", { name: "legal-doc-wp-ordering-system" }).click(); // collapse
    await page.goBack();
    await page.goForward();
    await expect(explorer(page).locator('[aria-current="page"]')).toBeVisible();
  });

  test("contact.me opens and focuses the terminal without navigating", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/stack");
    const toggle = terminal(page).getByRole("button", { name: /terminal/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#terminal-body")).toBeHidden();

    await explorer(page).getByRole("button", { name: "docs", exact: true }).click();
    const before = page.url();
    await explorer(page).getByRole("button", { name: /^contact\.me/ }).click();
    expect(page.url()).toBe(before);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#terminal-body")).toBeVisible();
    await expect.poll(() => activeInTerminal(page)).toBe(true);
    // current page and highlight are untouched
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveAttribute("href", "/stack");

    // terminal state survives navigation
    await explorer(page).getByRole("link", { name: "search.tsx" }).click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(errors).toEqual([]);
  });

  test("the status bar toggle expands and collapses the terminal (collapsed on load)", async ({ page }) => {
    await page.goto("/");
    const statusToggle = page.getByRole("contentinfo").getByRole("button", { name: "Terminal" });
    await expect(statusToggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#terminal-body")).toBeHidden();
    await statusToggle.click();
    await expect(statusToggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#terminal-body")).toBeVisible();
    await statusToggle.click();
    await expect(page.locator("#terminal-body")).toBeHidden();
  });

  test("scrolling happens in the content panel: anchors scroll it, navigation resets it", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`${LEGAL}#views-in-this-project`);
    const main = page.getByRole("main");
    await expect.poll(() => main.evaluate((m) => m.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // clicking an in-page link (table of contents) scrolls the panel, not the window
    await main.evaluate((m) => (m.scrollTop = 0));
    // (the README has an inline collapsible TOC, a side TOC and a decorative permalink — use the visible TOC)
    const toc = page.getByRole("navigation", { name: "Table of contents" });
    if (await toc.locator("summary").isVisible()) await toc.locator("summary").click();
    await toc.locator('a[href="#features"]').click();
    await expect.poll(() => main.evaluate((m) => m.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // navigating to another page starts at the top
    await main.evaluate((m) => (m.scrollTop = 300));
    await expect.poll(() => main.evaluate((m) => m.scrollTop)).toBe(300);
    await explorer(page).getByRole("link", { name: "package.json" }).click();
    await expect(page).toHaveURL(/\/stack$/);
    await expect.poll(() => main.evaluate((m) => m.scrollTop)).toBe(0);

    // back restores the remembered position
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${LEGAL}.*$`));
    await expect.poll(() => main.evaluate((m) => m.scrollTop)).toBeGreaterThan(250);
    expect(errors).toEqual([]);
  });

  test("404 renders inside the shell without an active file", async ({ page }) => {
    const response = await page.goto("/no/such/page");
    expect(response?.status()).toBe(404);
    await expect(explorer(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /404/ })).toBeVisible();
    await expect(explorer(page).locator('[aria-current="page"]')).toHaveCount(0);
    await explorer(page).getByRole("link", { name: "index.html", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("keyboard: every explorer control is reachable and has a visible focus ring", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // first explorer row (menu button is display:none on desktop)
    const first = explorer(page).getByRole("button", { name: "portfolio", exact: true });
    await expect(first).toBeFocused();
    const outline = await first.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
    await page.keyboard.press("Enter"); // collapse
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space"); // expand
    await expect(first).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("mobile drawer (360px)", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("terminal starts collapsed; opening contact reveals it beneath the content", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const toggle = terminal(page).getByRole("button", { name: /terminal/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#terminal-body")).toBeHidden();

    await page.getByRole("button", { name: "Explorer", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Explorer" });
    await drawer.getByRole("button", { name: "docs", exact: true }).click();
    const before = page.url();
    await drawer.getByRole("button", { name: /^contact\.me/ }).click();
    expect(page.url()).toBe(before);
    await expect(drawer).toHaveCount(0); // no longer a dialog
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#terminal-body")).toBeVisible();
    await expect.poll(() => activeInTerminal(page)).toBe(true);
    const main = (await page.getByRole("main").boundingBox())!;
    const term = (await page.locator("#terminal-panel").boundingBox())!;
    expect(term.y).toBeGreaterThanOrEqual(main.y + main.height - 1);
    expect(errors).toEqual([]);
  });

  test("drawer opens, traps focus, closes on Escape and returns focus to the trigger", async ({ page }) => {
    await page.goto(VIEW);
    const trigger = page.getByRole("button", { name: "Explorer", exact: true });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    // closed drawer is not reachable
    await expect(explorer(page)).toBeHidden();

    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Explorer" });
    await expect(drawer).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(drawer.getByRole("button", { name: "Close explorer" })).toBeFocused();

    // Tab and Shift+Tab never leave the drawer
    const inDrawer = () => page.evaluate(() => !!document.activeElement?.closest("[data-shell-drawer]"));
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      expect(await inDrawer()).toBe(true);
    }
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await inDrawer()).toBe(true);
    }
    // the background is inert
    expect(await page.getByRole("main").evaluate((m) => m.closest("[inert]") !== null)).toBe(true);

    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(explorer(page)).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("drawer closes via the backdrop and the close button", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Explorer", exact: true });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Explorer" })).toBeVisible();
    await page.mouse.click(350, 400); // backdrop (drawer is ~300px wide)
    await expect(page.getByRole("dialog", { name: "Explorer" })).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.getByRole("button", { name: "Close explorer" }).click();
    await expect(page.getByRole("dialog", { name: "Explorer" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("drawer closes on navigation and focus lands in the content", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Explorer", exact: true });
    await trigger.click();
    await page.getByRole("button", { name: "docs", exact: true }).click();
    await page.getByRole("link", { name: /^about\.html/ }).click();
    await expect(page).toHaveURL(/\/docs\/about$/);
    await expect(page.getByRole("dialog", { name: "Explorer" })).toHaveCount(0);
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page.getByRole("status")).toHaveText(/About/);

    // the active file is highlighted and its folders revealed when reopening
    await trigger.click();
    await expect(page.locator('#explorer-drawer [aria-current="page"]')).toBeVisible();
    // browser back also closes the drawer
    await page.goBack();
    await expect(page.getByRole("dialog", { name: "Explorer" })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("long filenames stay readable in the drawer", async ({ page }) => {
    await page.goto("/portfolio/multi-location-inventory-sales-system/views/user-profile-completion-wizard");
    await page.getByRole("button", { name: "Explorer", exact: true }).click();
    const link = page.locator('#explorer-drawer [aria-current="page"]');
    await expect(link).toBeVisible();
    const fits = await link.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(fits).toBe(true);
    await expect(link).toHaveAttribute("title", /user-profile-completion-wizard\.html$/);
  });
});

for (const width of [360, 768, 1440]) {
  test.describe(`layout at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 900 : 800 } });

    test("no horizontal page scroll and no console errors", async ({ page }) => {
      const errors = collectErrors(page);
      for (const path of ["/", LEGAL, VIEW, "/stack", "/docs/about", "/search"]) {
        await page.goto(path);
        await expect(page.getByRole("main")).toBeVisible();
        const overflow = await noHorizontalScroll(page);
        expect(overflow, path).toEqual({ doc: 0, body: 0, winX: 0 });
        // the shell never exceeds the viewport
        const shell = await page.locator("footer").evaluate((el) => el.parentElement!.parentElement!.getBoundingClientRect().width);
        expect(shell, path).toBeLessThanOrEqual(width);
      }
      expect(errors).toEqual([]);
      // the 404 page (the document request itself logs a 404 resource message)
      await page.goto("/missing-page");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("404");
      expect(await noHorizontalScroll(page)).toEqual({ doc: 0, body: 0, winX: 0 });
      errors.length = 0;
      // client-side navigation too
      await page.goto("/");
      if (width < 900) await page.getByRole("button", { name: "Explorer", exact: true }).click();
      await page.getByRole("button", { name: "docs", exact: true }).click();
      await page.getByRole("link", { name: /^about\.html/ }).click();
      await expect(page).toHaveURL(/\/docs\/about$/);
      expect(await noHorizontalScroll(page)).toEqual({ doc: 0, body: 0, winX: 0 });
      expect(errors).toEqual([]);
    });
  });
}

test("keyboard-open sized viewport still shows the content (360x320)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 320 });
  await page.goto("/");
  const main = (await page.getByRole("main").boundingBox())!;
  expect(main.height).toBeGreaterThan(120);
  await page.getByRole("button", { name: "Explorer", exact: true }).click();
  await page.getByRole("button", { name: "docs", exact: true }).click();
  await page.getByRole("button", { name: /^contact\.me/ }).click();
  const m2 = (await page.getByRole("main").boundingBox())!;
  expect(m2.height).toBeGreaterThan(60);
  expect((await noHorizontalScroll(page)).doc).toBe(0);
});

test("respects prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  const duration = await page.locator("#explorer-drawer").evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
});

test.describe("title bar and breadcrumbs", () => {
  const crumbText = (page: Page, text: string) =>
    page.getByRole("navigation", { name: "Breadcrumb" }).getByText(text, { exact: true });
  const visible = (page: Page, text: string) =>
    crumbText(page, text).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    });

  test("title shows the active file once, not the path, and plain 'portfolio' on 404", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(VIEW);
    const title = page.getByRole("banner").locator("p");
    await expect(title).toHaveText("Garth Oliver, custom-woo-extension-plugin.html — portfolio");
    await expect(title).not.toContainText("›");

    await page.goto("/no-such-page");
    await expect(page.getByRole("banner").locator("p")).toHaveText("Garth Oliver, portfolio");
  });

  test("wide: full path visible; narrow: middle crumbs collapse to an ellipsis but stay in the DOM", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(VIEW);
    for (const name of ["portfolio", "legal-doc-wp-ordering-system", "views"]) {
      expect(await visible(page, name), name).toBe(true);
    }

    await page.setViewportSize({ width: 360, height: 740 });
    expect(await visible(page, "portfolio")).toBe(true);
    expect(await visible(page, "views")).toBe(true);
    // The breadcrumb bar sits under the tab row, so the file crumb stays visible on narrow screens too.
    expect(await visible(page, "custom-woo-extension-plugin.html")).toBe(true);
    expect(await visible(page, "legal-doc-wp-ordering-system")).toBe(false);
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText("…", { exact: true })).toBeVisible();
    // Full path still in the DOM / accessibility tree and as a title.
    await expect(crumbText(page, "legal-doc-wp-ordering-system")).toBeAttached();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).locator("ol")).toHaveAttribute(
      "title",
      "portfolio › legal-doc-wp-ordering-system › views › custom-woo-extension-plugin.html",
    );
    expect((await noHorizontalScroll(page)).doc).toBe(0);
  });
});
