import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { routeEntries } from "../app/content/registry";

/**
 * Automated WCAG 2.0/2.1/2.2 A + AA audit (axe-core) of every route and of the key interactive
 * states. No rules are disabled and nothing is excluded: a violation fails the test. Automated checks
 * cover roughly a third of WCAG; keyboard, focus, announcement and reduced-motion behaviour are
 * asserted by the other specs and by the manual pass documented in the handoff.
 */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function audit(page: Page, label: string) {
  // Let webfonts and CSS transitions finish so axe measures final colours, not a mid-fade blend.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().length === 0);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({ target: n.target.join(" "), summary: n.failureSummary?.split("\n").slice(0, 3).join(" | ") })),
  }));
  expect(summary, `axe violations: ${label}`).toEqual([]);
}

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "360", width: 360, height: 740 },
] as const;

const input = (page: Page) => page.locator("#contact-input");
const body = (page: Page) => page.locator("#terminal-body");
const button = (page: Page, name: string) => body(page).getByRole("button", { name, exact: true });

/** Open the contact terminal the way each layout does: it starts collapsed, so use the page's own button. */
async function openTerminal(page: Page) {
  if (!(await body(page).isVisible())) {
    await page.getByRole("main").getByRole("button", { name: "Open contact terminal" }).click();
    await expect(input(page)).toBeFocused();
  }
  await expect(body(page)).toBeVisible();
  await expect(input(page)).toBeVisible();
}

for (const vp of VIEWPORTS) {
  test.describe(`axe: every route at ${vp.name}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const entry of routeEntries) {
      test(`${entry.url} (${entry.label})`, async ({ page }) => {
        await page.goto(entry.url);
        await expect(page.getByRole("main")).toBeVisible();
        await audit(page, `${entry.url} @${vp.name}`);
      });
    }

    test("search with a query", async ({ page }) => {
      await page.goto("/search?q=wordpress");
      await expect(page.getByRole("list", { name: "Search results" })).toBeVisible();
      await audit(page, `/search?q=wordpress @${vp.name}`);
    });

    test("the 404 page", async ({ page }) => {
      await page.goto("/no/such/page");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("404");
      await audit(page, `404 @${vp.name}`);
    });
  });

  test.describe(`axe: interactive states at ${vp.name}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("search results, no results and the empty state", async ({ page }) => {
      await page.goto("/search");
      await expect(page.getByRole("heading", { name: "Start typing to search" })).toBeVisible();
      await audit(page, "search empty");

      await page.getByRole("searchbox", { name: "Search this site" }).fill("anonymised");
      await expect(page.getByRole("list", { name: "Search results" })).toBeVisible();
      await expect(page.getByRole("main").locator("mark").first()).toBeVisible();
      await audit(page, "search with results (highlighted)");

      await page.getByRole("searchbox", { name: "Search this site" }).fill("zzzxqv");
      await expect(page.getByRole("heading", { name: "No results" })).toBeVisible();
      await audit(page, "search no results");
    });

    test("booking demo after a reservation, a move and a reset", async ({ page }) => {
      await page.goto("/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar");
      const main = page.getByRole("main");
      await main.getByRole("button", { name: "Reserve Desk B1 on Tuesday 3 November" }).scrollIntoViewIfNeeded();
      await main.getByRole("button", { name: "Reserve Desk B1 on Tuesday 3 November" }).click();
      await expect(main.getByRole("button", { name: /^Cancel your reservation of Desk B1 on Tuesday/ })).toBeVisible();
      await audit(page, "booking: one reservation (a 'Move here' action appears on other desks that day)");

      await main.getByRole("button", { name: "Reserve Desk A1 on Monday 2 November" }).click();
      await main.getByRole("button", { name: /^Move here: reserve Desk B1 on Monday/ }).click();
      await expect(main.getByRole("status")).toContainText("moved from Desk A1");
      await audit(page, "booking: after a move");

      await main.getByRole("button", { name: "Reset demo" }).click();
      await expect(main.getByRole("status")).toContainText("Demo reset");
      await audit(page, "booking: after reset");
    });

    test("onboarding wizard mid-flow and completed", async ({ page }) => {
      await page.goto("/portfolio/hybrid-wp-react-intranet/views/onboarding-wizard");
      const main = page.getByRole("main");
      await main.getByRole("button", { name: "Next", exact: true }).click();
      await expect(main.getByRole("heading", { name: "How the intranet is organised" })).toBeFocused();
      await audit(page, "onboarding: step 2");

      for (let i = 0; i < 3; i++) await main.getByRole("button", { name: "Next", exact: true }).click();
      await main.getByRole("button", { name: "Complete onboarding" }).click();
      await expect(main.getByRole("heading", { name: "Onboarding complete" })).toBeFocused();
      await audit(page, "onboarding: completed");
    });

    test("notification center: viewer switch, mark read, kudos error and success", async ({ page }) => {
      await page.goto("/portfolio/hybrid-wp-react-intranet/views/notification-center");
      const main = page.getByRole("main");
      await main.locator("#nc-viewer").selectOption("p-lena");
      await main.getByRole("button", { name: "Mark as read: All-hands call moved to Thursday" }).click();
      await expect(main.getByRole("status")).toContainText("Marked as read: All-hands call moved to Thursday");
      await audit(page, "notifications: viewer switched, one marked read");

      await main.getByRole("button", { name: "Send kudos" }).click();
      await expect(main.locator("#nc-kudos-error")).toBeVisible();
      await audit(page, "notifications: kudos error");

      await main.locator("#nc-kudos-recipient").selectOption("p-jordan");
      await main.getByLabel("High Five").check();
      await main.getByRole("button", { name: "Send kudos" }).click();
      await expect(main.getByRole("status")).toContainText("Kudos sent: Lena Kowalski gave Jordan Reyes a High Five.");
      await audit(page, "notifications: kudos sent");
    });

    test("employee map filtered with an open profile, then reset", async ({ page }) => {
      await page.goto("/portfolio/hybrid-wp-react-intranet/views/interactive-remote-employee-map");
      const main = page.getByRole("main");
      await main.locator("#map-department").selectOption("engineering");
      await main.getByRole("button", { name: "Priya Raman, Engineering, near Northfield" }).click();
      await expect(main.getByRole("heading", { name: "Priya Raman" })).toBeFocused();
      await audit(page, "map: engineering filter with an open profile");

      await main.getByRole("button", { name: "Reset demo" }).click();
      await expect(main.getByRole("status")).toContainText("Demo reset");
      await audit(page, "map: after reset");
    });

    test("contact terminal: every step, validation errors, review and completion", async ({ page }) => {
      await page.goto("/");
      await openTerminal(page);
      await audit(page, "terminal: name step");

      await button(page, "Continue").click();
      await expect(page.locator("#contact-error")).toHaveText("Please enter your name.");
      await audit(page, "terminal: name error");

      await input(page).fill("Ada Lovelace");
      await button(page, "Continue").click();
      await expect(input(page)).toHaveAccessibleName(/email/);
      await audit(page, "terminal: email step (with Back and Restart)");

      await input(page).fill("not-an-email");
      await button(page, "Continue").click();
      await expect(page.locator("#contact-error")).toContainText("doesn't look like an email");
      await audit(page, "terminal: email error");

      await input(page).fill("ada@example.com");
      await button(page, "Continue").click();
      await expect(input(page)).toHaveAccessibleName(/talk about/);
      await audit(page, "terminal: message step");

      await button(page, "Continue").click();
      await expect(page.locator("#contact-error")).toHaveText("Please enter a message.");
      await audit(page, "terminal: message error");

      await input(page).fill("Hello there.");
      await button(page, "Continue").click();
      await expect(button(page, "Finish demo")).toBeFocused();
      await audit(page, "terminal: review");

      await button(page, "Edit email").click();
      await expect(input(page)).toHaveValue("ada@example.com");
      await audit(page, "terminal: editing from review");
      await button(page, "Back to review").click();

      await button(page, "Finish demo").click();
      await expect(button(page, "Start again")).toBeFocused();
      await audit(page, "terminal: completion");
    });
  });
}

test.describe("axe: mobile drawer", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("drawer open (collapsed and with folders expanded)", async ({ page }) => {
    await page.goto("/portfolio/legal-doc-wp-ordering-system/views/custom-woo-extension-plugin");
    await page.getByRole("button", { name: "Explorer", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Explorer" });
    await expect(drawer).toBeVisible();
    await audit(page, "drawer open");

    await drawer.getByRole("button", { name: "docs", exact: true }).click();
    await drawer.getByRole("button", { name: "multi-location-inventory-sales-system" }).click();
    await audit(page, "drawer with more folders expanded");
  });
});

test.describe("axe: desktop shell states", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("all explorer folders expanded and the terminal collapsed", async ({ page }) => {
    await page.goto("/");
    const explorer = page.getByRole("navigation", { name: "Explorer" });
    for (const name of ["docs", "headless-wp-educational-app", "legal-doc-wp-ordering-system", "multi-location-inventory-sales-system"]) {
      await explorer.getByRole("button", { name, exact: true }).click();
    }
    await expect(body(page)).toBeHidden();
    await audit(page, "explorer expanded, terminal collapsed");
    await page.getByRole("contentinfo").getByRole("button", { name: "Terminal" }).click();
    await expect(body(page)).toBeVisible();
    await audit(page, "terminal expanded");
  });
});

test.describe("axe: hover and focus states (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const HYBRID = "/portfolio/hybrid-wp-react-intranet";
  // [description, path, locator factory] — each element is hovered (and focused with the keyboard) before auditing.
  const targets: [string, string, (page: Page) => ReturnType<Page["locator"]>][] = [
    ["status bar terminal toggle", "/", (p) => p.getByRole("contentinfo").getByRole("button", { name: "Terminal" })],
    ["terminal header toggle", "/", (p) => p.getByRole("region", { name: /terminal/i }).getByRole("button", { name: /terminal/i })],
    ["explorer folder", "/", (p) => p.getByRole("navigation", { name: "Explorer" }).getByRole("button", { name: "docs", exact: true })],
    ["explorer file", "/", (p) => p.getByRole("navigation", { name: "Explorer" }).getByRole("link", { name: "package.json" })],
    ["active explorer file", "/", (p) => p.getByRole("navigation", { name: "Explorer" }).locator('[aria-current="page"]')],
    ["home project card link", "/", (p) => p.getByRole("main").getByRole("link", { name: "Headless WordPress Educational App", exact: true })],
    ["home contact button", "/", (p) => p.getByRole("main").getByRole("button", { name: "Open contact terminal" })],
    ["TOC link", HYBRID, (p) => p.getByRole("navigation", { name: "Table of contents" }).getByRole("link", { name: "Overview" })],
    ["document link", HYBRID, (p) => p.getByRole("main").getByRole("link", { name: "technical-requirements.md" })],
    ["placeholder view link", `${HYBRID}/views/employee-directory`, (p) => p.getByRole("link", { name: "Back to project README" })],
    ["booking Reset demo", `${HYBRID}/views/office-booking-calendar`, (p) => p.getByRole("button", { name: "Reset demo" })],
    ["booking Reserve", `${HYBRID}/views/office-booking-calendar`, (p) => p.getByRole("button", { name: "Reserve Desk B1 on Tuesday 3 November" })],
    ["onboarding Next", `${HYBRID}/views/onboarding-wizard`, (p) => p.getByRole("button", { name: "Next", exact: true })],
    ["notification Mark as read", `${HYBRID}/views/notification-center`, (p) => p.getByRole("button", { name: "Mark as read: All-hands call moved to Thursday" })],
    ["map marker", `${HYBRID}/views/interactive-remote-employee-map`, (p) => p.getByRole("button", { name: "Avery Lin, Product Design, near Harbor City" })],
    ["search suggestion", "/search", (p) => p.getByRole("main").getByRole("button", { name: "WordPress" })],
    ["search result link", "/search?q=wordpress", (p) => p.getByRole("main").getByRole("list", { name: "Search results" }).getByRole("link").first()],
    ["contact Continue", "/", (p) => p.locator("#terminal-body").getByRole("button", { name: "Continue", exact: true })],
    ["404 link", "/missing", (p) => p.getByRole("main").getByRole("link", { name: "Open index.html" })],
  ];

  for (const [name, path, locate] of targets) {
    test(`${name}: hovered, then keyboard-focused`, async ({ page }) => {
      await page.goto(path);
      const target = locate(page);
      await target.scrollIntoViewIfNeeded();
      await target.hover();
      await audit(page, `${name} (hover)`);
      await target.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(target).toBeFocused();
      await audit(page, `${name} (focus)`);
    });
  }
});
