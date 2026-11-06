import { expect, test, type Page } from "@playwright/test";

const HYBRID = "/portfolio/hybrid-wp-react-intranet";
const DEMO = `${HYBRID}/views/onboarding-wizard`;
const NOTIFICATIONS = `${HYBRID}/views/notification-center`;

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
const next = (page: Page) => main(page).getByRole("button", { name: "Next", exact: true });
const back = (page: Page) => main(page).getByRole("button", { name: "Back", exact: true });
const heading = (page: Page, name: string) => main(page).getByRole("heading", { name });
const progressLabel = (page: Page) => main(page).getByTestId("onboarding-progress-label");
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    main: document.getElementById("content")!.scrollWidth - document.getElementById("content")!.clientWidth,
  }));

test.describe("onboarding wizard", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("prerendered HTML contains step 1 and the locked navigation", async ({ request }) => {
    const html = await (await request.get(DEMO)).text();
    expect(html).toContain("Welcome to the intranet");
    expect(html).toContain("Step 1 of 5");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain("Locked");
    expect(html).toContain("nothing is saved");
  });

  test("renders step 1 with progress semantics", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    const bar = main(page).getByRole("progressbar", { name: "Onboarding progress" });
    await expect(bar).toHaveAttribute("aria-valuenow", "1");
    await expect(bar).toHaveAttribute("aria-valuetext", "Step 1 of 5");
    await expect(back(page)).toBeDisabled();
    await expect(main(page).getByText("Locked", { exact: true })).toHaveCount(6);
    expect(errors).toEqual([]);
  });

  test("Next and Back move focus to the step heading and announce", async ({ page }) => {
    await page.goto(DEMO);
    await next(page).click();
    await expect(heading(page, "How the intranet is organised")).toBeFocused();
    await expect(status(page)).toHaveText("Step 2 of 5: How the intranet is organised.");
    await back(page).click();
    await expect(heading(page, "Welcome to the intranet")).toBeFocused();
    await expect(status(page)).toHaveText("Step 1 of 5: Welcome to the intranet.");
  });

  test("completing onboarding unlocks the dashboard navigation", async ({ page }) => {
    await page.goto(DEMO);
    for (let i = 0; i < 4; i++) await next(page).click();
    const complete = main(page).getByRole("button", { name: "Complete onboarding" });
    await expect(complete).toBeVisible();
    await expect(next(page)).toHaveCount(0);
    await complete.click();
    await expect(heading(page, "Onboarding complete")).toBeFocused();
    await expect(status(page)).toHaveText("Onboarding complete. The dashboard navigation is now unlocked.");
    await expect(main(page).getByText("Available", { exact: true })).toHaveCount(6);
    await expect(main(page).getByTestId("onboarding-nav-state")).toHaveText(
      "Unlocked: the header and navigation are now available.",
    );
  });

  test("progress persists across navigation; reload restores the fixtures", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await next(page).click();
    await next(page).click();
    await explorer(page).getByRole("link", { name: "notification-center.html" }).click();
    await expect(page).toHaveURL(NOTIFICATIONS);
    await explorer(page).getByRole("link", { name: "onboarding-wizard.html" }).click();
    await expect(page).toHaveURL(DEMO);
    await expect(progressLabel(page)).toHaveText("Step 3 of 5");
    await expect(heading(page, "Set up your profile")).not.toBeFocused();

    await page.reload();
    await expect(progressLabel(page)).toHaveText("Step 1 of 5");
    expect(errors).toEqual([]);
  });

  test("Reset demo restores step 1, announces and keeps focus", async ({ page }) => {
    await page.goto(DEMO);
    for (let i = 0; i < 4; i++) await next(page).click();
    await main(page).getByRole("button", { name: "Complete onboarding" }).click();
    const reset = main(page).getByRole("button", { name: "Reset demo" });
    await reset.click();
    await expect(progressLabel(page)).toHaveText("Step 1 of 5");
    await expect(status(page)).toHaveText("Demo reset. Onboarding starts again at step 1.");
    await expect(reset).toBeFocused();
  });

  test("announcements repeat on repeated Reset", async ({ page }) => {
    await page.goto(DEMO);
    const reset = main(page).getByRole("button", { name: "Reset demo" });
    const raw = () => status(page).evaluate((el) => el.textContent ?? "");
    const spoken = (text: string) => text.replace(/​/g, "");
    await reset.click();
    const first = await raw();
    await reset.click();
    const second = await raw();
    await reset.click();
    const third = await raw();
    expect([first, second, third].map(spoken)).toEqual(Array(3).fill("Demo reset. Onboarding starts again at step 1."));
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
  });

  test("keyboard-only: Tab to Next, Enter, Tab to Back, Space", async ({ page }) => {
    await page.goto(DEMO);
    const target = next(page);
    for (let i = 0; i < 60 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(target).toBeFocused();
    await expect(target).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(heading(page, "How the intranet is organised")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(back(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(next(page)).toBeFocused();
    await page.keyboard.press("Space");
    await expect(status(page)).toHaveText("Step 3 of 5: Set up your profile.");
  });

  test("slides only when motion is allowed", async ({ page }) => {
    await page.goto(DEMO);
    const step = main(page).getByTestId("onboarding-step");
    await expect(step).toHaveCSS("animation-name", "none");
    await next(page).click();
    await expect(main(page).getByTestId("onboarding-step")).not.toHaveCSS("animation-name", "none");
  });
});

test.describe("onboarding wizard with reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("no animation or transition on step change", async ({ page }) => {
    await page.goto(DEMO);
    await next(page).click();
    await expect(heading(page, "How the intranet is organised")).toBeFocused();
    await expect(main(page).getByTestId("onboarding-step")).toHaveCSS("animation-name", "none");
    // the global reduced-motion rule shrinks durations to 0.01ms; only real (> 20ms) animations count
    expect(await page.evaluate(() => document.getAnimations().filter((a) => Number(a.effect?.getComputedTiming().duration ?? 0) > 20).length)).toBe(0);
    const fill = await main(page).getByRole("progressbar").locator("> div").evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(fill)).toBeLessThanOrEqual(0.011);
  });
});

test.describe("onboarding wizard at 360px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("fits without horizontal scroll and completes", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
    for (let i = 0; i < 4; i++) await next(page).click();
    await main(page).getByRole("button", { name: "Complete onboarding" }).click();
    await expect(heading(page, "Onboarding complete")).toBeFocused();
    expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
    expect(errors).toEqual([]);
  });
});
