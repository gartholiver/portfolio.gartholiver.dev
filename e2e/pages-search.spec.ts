import { expect, test, type Page } from "@playwright/test";

const PROJECTS = [
  { id: "hybrid-wp-react-intranet", title: "Hybrid WordPress + React Intranet" },
  { id: "headless-wp-educational-app", title: "Headless WordPress Educational App" },
  { id: "legal-doc-wp-ordering-system", title: "Legal Document WordPress Ordering System" },
  { id: "multi-location-inventory-sales-system", title: "Multi-Location Inventory & Sales System" },
];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") errors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

const main = (page: Page) => page.getByRole("main");
const activeInTerminal = (page: Page) => page.evaluate(() => !!document.activeElement?.closest("#terminal-panel"));
const overflowX = (page: Page) =>
  page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
    main: (() => {
      const m = document.getElementById("content")!;
      return m.scrollWidth - m.clientWidth;
    })(),
  }));

test.describe("home", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("introduces the portfolio and links to all four projects", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Garth Oliver — Portfolio");
    await expect(main(page).getByText("[Placeholder] A short portfolio introduction")).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "How to explore" })).toBeVisible();
    await expect(main(page).getByText("contact.bash").first()).toBeVisible();

    for (const project of PROJECTS) {
      const link = main(page).getByRole("link", { name: project.title, exact: true });
      await expect(link).toHaveAttribute("href", `/portfolio/${project.id}`);
    }
    expect(errors).toEqual([]);
  });

  for (const project of PROJECTS) {
    test(`project link navigates: ${project.id}`, async ({ page }) => {
      await page.goto("/");
      await main(page).getByRole("link", { name: project.title, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/portfolio/${project.id}$`));
      await expect(page.getByRole("heading", { level: 1 })).toContainText(project.title);
    });
  }

  test("the whole project card is clickable", async ({ page }) => {
    await page.goto("/");
    const card = main(page).getByRole("listitem").filter({ hasText: PROJECTS[1]!.title });
    await card.click(); // the title link is stretched over the card
    await expect(page).toHaveURL(/\/portfolio\/headless-wp-educational-app$/);
  });

  test("the contact button opens and focuses the terminal without navigating", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const toggle = page.getByRole("region", { name: /terminal/i }).getByRole("button", { name: /terminal/i });
    await toggle.click(); // collapse first so we can see it reopen
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    const before = page.url();
    await main(page).getByRole("button", { name: "Open contact terminal" }).click();
    expect(page.url()).toBe(before);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#terminal-body")).toBeVisible();
    await expect.poll(() => activeInTerminal(page)).toBe(true);
    expect(errors).toEqual([]);
  });
});

test.describe("home (mobile)", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("contact button reveals the collapsed terminal and has no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    expect(await overflowX(page)).toEqual({ doc: 0, body: 0, main: 0 });
    await expect(page.locator("#terminal-body")).toBeHidden();
    await main(page).getByRole("button", { name: "Open contact terminal" }).click();
    await expect(page.locator("#terminal-body")).toBeVisible();
    await expect.poll(() => activeInTerminal(page)).toBe(true);
  });
});

test.describe("about", () => {
  test("marks the biography and experience as placeholders", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/docs/about");
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Biography" })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Experience" })).toBeVisible();
    await expect(main(page).getByText("Biography placeholder").first()).toBeVisible();
    await expect(main(page).getByText("Experience placeholder").first()).toBeVisible();
    await expect(main(page).getByText("[Placeholder] Biography to be supplied")).toBeVisible();
    expect(await main(page).getByText(/\[Placeholder\]/).count()).toBeGreaterThan(3);
    expect(errors).toEqual([]);
  });
});

test.describe("stack", () => {
  test("shows curated JSON with pending AI preferences and accessible line numbers", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/stack");
    await expect(page.getByRole("heading", { level: 1, name: "Tech Stack" })).toBeVisible();
    const list = main(page).getByRole("list", { name: /package\.json contents/ });
    await expect(list).toBeVisible();
    await expect(list.getByText('"status": "pending",')).toBeVisible();
    await expect(list.getByText("AI preferences will be added once supplied.")).toBeVisible();
    await expect(list.getByText('"languages": {')).toBeVisible();

    // line numbers are decorative; code and notes are real text
    expect(await list.locator('[aria-hidden="true"]').count()).toBeGreaterThan(10);
    await expect(list.locator("li").first().locator("code")).toHaveText("{");
    await expect(list.getByText("Note: ").first()).toBeAttached();
    expect(errors).toEqual([]);
  });

  for (const width of [360, 1440]) {
    test(`has no horizontal page scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/stack");
      await expect(main(page).getByText('"status": "pending",')).toBeVisible();
      expect(await overflowX(page)).toEqual({ doc: 0, body: 0, main: 0 });
    });
  }
});

test.describe("blog", () => {
  test("shows the phase 2 empty state", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/docs");
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
    await expect(main(page).getByText("Coming in phase 2")).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "No posts yet" })).toBeVisible();
    // no sample posts or publishing UI
    await expect(main(page).getByRole("listitem").filter({ hasText: /post/i })).toHaveCount(0);
    await expect(main(page).locator("time")).toHaveCount(0);
    await expect(main(page).getByRole("button")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe("search", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const input = (page: Page) => page.getByRole("searchbox", { name: "Search this site" });
  const results = (page: Page) => main(page).getByRole("list", { name: "Search results" });

  test("empty state gives guidance and suggestions", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/search");
    await expect(input(page)).toHaveValue("");
    await expect(main(page).getByRole("heading", { name: "Start typing to search" })).toBeVisible();
    await expect(results(page)).toHaveCount(0);

    // a suggestion fills the input and shows results
    await main(page).getByRole("button", { name: "WordPress" }).click();
    await expect(input(page)).toHaveValue("WordPress");
    await expect(results(page)).toBeVisible();
    await expect(page).toHaveURL(/\/search\?q=WordPress$/);
    expect(errors).toEqual([]);
  });

  test("/search?q=<body term> shows matching results with highlights and working links", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/search?q=anonymised");
    await expect(input(page)).toHaveValue("anonymised");
    await expect(results(page)).toBeVisible();
    const items = results(page).getByRole("listitem");
    await expect(items).toHaveCount(4);
    await expect(main(page).locator("[aria-live=polite]")).toHaveText("4 results for “anonymised”.");

    const first = items.filter({ hasText: "Hybrid WordPress + React Intranet" });
    await expect(first.locator("mark").first()).toHaveText("anonymised");
    await expect(first).toContainText("portfolio/hybrid-wp-react-intranet/README.md");
    await expect(first).toContainText("Case study");
    await expect(first).toContainText("Matched in document text");

    await first.getByRole("link", { name: "Hybrid WordPress + React Intranet" }).click();
    await expect(page).toHaveURL(/\/portfolio\/hybrid-wp-react-intranet$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hybrid WordPress");
    expect(errors).toEqual([]);
  });

  test("title and filename matches rank above body matches", async ({ page }) => {
    await page.goto("/search?q=calendar");
    const first = results(page).getByRole("listitem").first();
    await expect(first.getByRole("link")).toHaveText("Office Booking Calendar");
    await expect(first.getByText("Matched in title")).toBeVisible();

    await page.goto("/search?q=package.json");
    await expect(results(page).getByRole("listitem").first().getByRole("link")).toHaveText("Tech Stack");
  });

  test("is case- and diacritic-insensitive", async ({ page }) => {
    await page.goto("/search?q=H%C3%BDbrid%20INTRANET");
    await expect(results(page).getByRole("listitem").first()).toContainText("Hybrid WordPress + React Intranet");
  });

  test("typing updates ?q= (replace, debounced) and the results", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/search");
    const historyBefore = await page.evaluate(() => history.length);
    await input(page).fill("woocommerce");
    await expect(page).toHaveURL(/\/search\?q=woocommerce$/);
    await expect(results(page)).toBeVisible();
    await expect(main(page).locator("[aria-live=polite]")).toContainText("for “woocommerce”");
    expect(await page.evaluate(() => history.length)).toBe(historyBefore);

    await input(page).fill("");
    await expect(page).toHaveURL(/\/search$/);
    await expect(main(page).getByRole("heading", { name: "Start typing to search" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("an unmatched query shows the no-results state", async ({ page }) => {
    await page.goto("/search");
    await input(page).fill("zzzxqv");
    await expect(main(page).getByRole("heading", { name: "No results" })).toBeVisible();
    await expect(main(page).locator("[aria-live=polite]")).toHaveText("No results for “zzzxqv”.");
    await expect(results(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/search\?q=zzzxqv$/);

    await main(page).getByRole("button", { name: "clear the search" }).click();
    await expect(input(page)).toHaveValue("");
    await expect(main(page).getByRole("heading", { name: "Start typing to search" })).toBeVisible();
  });

  test("no-results state can open the contact terminal", async ({ page }) => {
    await page.goto("/search?q=zzzxqv");
    await main(page).getByRole("button", { name: "Open the contact terminal" }).click();
    await expect.poll(() => activeInTerminal(page)).toBe(true);
    await expect(page).toHaveURL(/\/search\?q=zzzxqv$/);
  });

  test("back/forward follow ?q= changes", async ({ page }) => {
    await page.goto("/search?q=anonymised");
    await expect(results(page)).toBeVisible();
    await page.getByRole("navigation", { name: "Explorer" }).getByRole("link", { name: "package.json" }).click();
    await expect(page).toHaveURL(/\/stack$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/search\?q=anonymised$/);
    await expect(input(page)).toHaveValue("anonymised");
    await expect(results(page)).toBeVisible();
  });

  test("the contact entry is not a search result (it has no page)", async ({ page }) => {
    await page.goto("/search?q=contact.bash");
    await expect(main(page).getByRole("heading", { name: "No results" })).toBeVisible();
  });

  test("works at 375px without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/search?q=wordpress");
    await expect(results(page)).toBeVisible();
    expect(await overflowX(page)).toEqual({ doc: 0, body: 0, main: 0 });
  });
});
