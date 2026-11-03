import { expect, test, type Page } from "@playwright/test";

const HYBRID = "/portfolio/hybrid-wp-react-intranet";
const DEMO = `${HYBRID}/views/interactive-remote-employee-map`;
const ONBOARDING = `${HYBRID}/views/onboarding-wizard`;
const AVERY = "Avery Lin, Product Design, near Harbor City";
const YOU = "You: Jordan Reyes, Customer Support, near Maple Grove";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") errors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

const main = (page: Page) => page.getByRole("main");
const status = (page: Page) => main(page).getByRole("status");
const explorer = (page: Page) => page.getByRole("navigation", { name: "Explorer" });
const markers = (page: Page) => main(page).getByTestId("map-markers");
const marker = (page: Page, name: string) => markers(page).getByRole("button", { name, exact: true });
const rowHeaders = (page: Page) => main(page).getByRole("table").getByRole("rowheader");
const card = (page: Page) => main(page).getByTestId("profile-card");
const summary = (page: Page) => main(page).getByTestId("map-summary");
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    main: document.getElementById("content")!.scrollWidth - document.getElementById("content")!.clientWidth,
  }));

test.describe("remote employee map", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("prerendered HTML contains markers, list and approximate-location copy", async ({ request }) => {
    const html = await (await request.get(DEMO)).text();
    expect(html).toContain(`aria-label="${AVERY}"`);
    expect(html).toContain(YOU);
    expect(html).toContain("<table");
    expect(html).toContain("Showing 12 of 12 people");
    expect(html).toContain("approximate");
    expect(html).toContain("nothing is saved");
  });

  test("renders 12 marker buttons and a 12-row people list", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await expect(markers(page).getByRole("button")).toHaveCount(12);
    await expect(rowHeaders(page)).toHaveCount(12);
    await expect(marker(page, YOU)).toHaveText("You");
    expect(errors).toEqual([]);
  });

  test("a marker opens the profile card and moves focus to it", async ({ page }) => {
    await page.goto(DEMO);
    await marker(page, AVERY).click();
    await expect(main(page).getByRole("heading", { name: "Avery Lin" })).toBeFocused();
    await expect(card(page)).toContainText("Head of Product Design");
    await expect(card(page)).toContainText("near Harbor City, Coastal Region (approximate)");
    await expect(card(page)).toContainText("No manager listed");
    await expect(card(page).getByRole("button", { name: "View profile: Sam Okafor" })).toBeVisible();
    await expect(marker(page, AVERY)).toHaveAttribute("aria-current", "true");
  });

  test("manager and direct-report links navigate the card; Close returns focus to the marker", async ({ page }) => {
    await page.goto(DEMO);
    await marker(page, AVERY).click();
    await card(page).getByRole("button", { name: "View profile: Sam Okafor" }).click();
    await expect(main(page).getByRole("heading", { name: "Sam Okafor" })).toBeFocused();
    await expect(card(page).getByRole("button", { name: "View profile: Avery Lin" })).toBeVisible(); // manager
    await main(page).getByRole("button", { name: "Close profile" }).click();
    await expect(marker(page, "Sam Okafor, Product Design, near Westmoor")).toBeFocused();
    await expect(main(page).getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
  });

  test("the people list opens profiles; Close returns focus to the row", async ({ page }) => {
    await page.goto(DEMO);
    await main(page).getByRole("table").getByRole("button", { name: "View profile: Lena Kowalski" }).click();
    await expect(main(page).getByRole("heading", { name: "Lena Kowalski" })).toBeFocused();
    await main(page).getByRole("button", { name: "Close profile" }).click();
    await expect(main(page).locator("#map-row-p-lena")).toBeFocused();
  });

  test("department filter updates map, list and summary", async ({ page }) => {
    await page.goto(DEMO);
    await main(page).locator("#map-department").selectOption("engineering");
    await expect(status(page)).toHaveText("Showing 4 people in Engineering.");
    await expect(markers(page).getByRole("button")).toHaveCount(4);
    await expect(rowHeaders(page)).toHaveCount(4);
    await expect(summary(page)).toHaveText("Showing 4 of 12 people");
    await main(page).locator("#map-department").selectOption("all");
    await expect(status(page)).toHaveText("Showing all 12 people.");
    await expect(markers(page).getByRole("button")).toHaveCount(12);
  });

  test("state persists across navigation; reload restores", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await main(page).locator("#map-department").selectOption("engineering");
    await marker(page, "Priya Raman, Engineering, near Northfield").click();
    await explorer(page).getByRole("link", { name: "onboarding-wizard.html" }).click();
    await expect(page).toHaveURL(ONBOARDING);
    await explorer(page).getByRole("link", { name: "interactive-remote-employee-map.html" }).click();
    await expect(page).toHaveURL(DEMO);
    await expect(summary(page)).toHaveText("Showing 4 of 12 people");
    await expect(main(page).getByRole("heading", { name: "Priya Raman" })).toBeVisible();

    await page.reload();
    await expect(summary(page)).toHaveText("Showing 12 of 12 people");
    await expect(main(page).getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("Reset demo restores and announces; focus stays", async ({ page }) => {
    await page.goto(DEMO);
    await main(page).locator("#map-department").selectOption("engineering");
    await marker(page, "Priya Raman, Engineering, near Northfield").click();
    const reset = main(page).getByRole("button", { name: "Reset demo" });
    await reset.click();
    await expect(status(page)).toHaveText("Demo reset. All departments are shown and no profile is open.");
    await expect(summary(page)).toHaveText("Showing 12 of 12 people");
    await expect(reset).toBeFocused();
  });

  test("keyboard-only: Tab to a marker and open it with Enter", async ({ page }) => {
    await page.goto(DEMO);
    const target = marker(page, AVERY);
    for (let i = 0; i < 80 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(target).toBeFocused();
    await expect(target).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(main(page).getByRole("heading", { name: "Avery Lin" })).toBeFocused();
  });
});

test.describe("remote employee map with reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("no animations after opening a profile", async ({ page }) => {
    await page.goto(DEMO);
    await marker(page, AVERY).click();
    await expect(main(page).getByRole("heading", { name: "Avery Lin" })).toBeFocused();
    // the global reduced-motion rule shrinks durations to 0.01ms; only real (> 20ms) animations count
    expect(await page.evaluate(() => document.getAnimations().filter((a) => Number(a.effect?.getComputedTiming().duration ?? 0) > 20).length)).toBe(0);
  });
});

test.describe("remote employee map at 360px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("markers stay inside the map and never overlap; no page scroll", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });

    const boxes = await markers(page).evaluate((map) => {
      const m = map.getBoundingClientRect();
      return {
        map: { x: m.x, y: m.y, w: m.width, h: m.height },
        items: [...map.querySelectorAll("button")].map((b) => {
          const r = b.getBoundingClientRect();
          return { label: b.getAttribute("aria-label")!, x: r.x, y: r.y, w: r.width, h: r.height };
        }),
      };
    });
    expect(boxes.items).toHaveLength(12);
    for (const b of boxes.items) {
      expect(b.x, b.label).toBeGreaterThanOrEqual(boxes.map.x - 0.5);
      expect(b.y, b.label).toBeGreaterThanOrEqual(boxes.map.y - 0.5);
      expect(b.x + b.w, b.label).toBeLessThanOrEqual(boxes.map.x + boxes.map.w + 0.5);
      expect(b.y + b.h, b.label).toBeLessThanOrEqual(boxes.map.y + boxes.map.h + 0.5);
    }
    for (let i = 0; i < boxes.items.length; i++) {
      for (let j = i + 1; j < boxes.items.length; j++) {
        const a = boxes.items[i]!;
        const b = boxes.items[j]!;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.label} overlaps ${b.label}`).toBe(false);
      }
    }

    const region = main(page).locator('div[role="region"][aria-label="People list"]');
    expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
});
