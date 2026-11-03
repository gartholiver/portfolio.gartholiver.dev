import { expect, test, type Page } from "@playwright/test";

const HYBRID = "/portfolio/hybrid-wp-react-intranet";
const DEMO = `${HYBRID}/views/notification-center`;
const ONBOARDING = `${HYBRID}/views/onboarding-wizard`;

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
const unreadCount = (page: Page) => main(page).getByTestId("unread-count");
const markButton = (page: Page, title: string) => main(page).getByRole("button", { name: `Mark as read: ${title}` });
const markAll = (page: Page) => main(page).getByRole("button", { name: "Mark all as read" });
const sendKudos = (page: Page) => main(page).getByRole("button", { name: "Send kudos" });
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    main: document.getElementById("content")!.scrollWidth - document.getElementById("content")!.clientWidth,
  }));

test.describe("notification center", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("prerendered HTML contains the default viewer's inbox", async ({ request }) => {
    const html = await (await request.get(DEMO)).text();
    expect(html).toContain("Notifications for Jordan Reyes");
    expect(html).toContain("4 unread");
    expect(html).toContain("Welcome to the team, Jordan");
    expect(html).toContain("Send kudos");
    expect(html).toContain("nothing is saved");
  });

  test("unseen and seen lists for the default viewer", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await expect(main(page).getByTestId("unseen-list").getByRole("listitem")).toHaveCount(4);
    await expect(main(page).getByTestId("seen-list").getByRole("listitem")).toHaveCount(1);
    await expect(unreadCount(page)).toHaveText("4 unread");
    expect(errors).toEqual([]);
  });

  test("Viewing as shows targeted notifications per person", async ({ page }) => {
    await page.goto(DEMO);
    await main(page).locator("#nc-viewer").selectOption("p-lena");
    await expect(status(page)).toHaveText("Now viewing as Lena Kowalski (Web team). 3 unread notifications.");
    await expect(unreadCount(page)).toHaveText("3 unread");
    await expect(main(page).getByText("Your equipment request was approved")).toBeVisible();
    await expect(main(page).getByText("Welcome to the team, Jordan")).toHaveCount(0);

    await main(page).locator("#nc-viewer").selectOption("p-noah");
    await expect(unreadCount(page)).toHaveText("2 unread");
    await expect(main(page).getByText("Onboarding buddies needed")).toBeVisible();
    await expect(main(page).getByText("Design tokens update ships Wednesday")).toHaveCount(0);
  });

  test("mark one as read moves it to Seen and focuses the next item", async ({ page }) => {
    await page.goto(DEMO);
    await markButton(page, "New weekend rota for the Support Desk").click();
    await expect(status(page)).toHaveText(
      "Marked as read: New weekend rota for the Support Desk. 3 unread notifications left.",
    );
    await expect(markButton(page, "Complete the security refresher")).toBeFocused();
    await expect(unreadCount(page)).toHaveText("3 unread");
    await expect(main(page).getByTestId("unseen-list").getByRole("listitem")).toHaveCount(3);
    await expect(main(page).getByTestId("seen-list").getByRole("listitem")).toHaveCount(2);
  });

  test("mark all as read, then again", async ({ page }) => {
    await page.goto(DEMO);
    await markAll(page).click();
    await expect(status(page)).toHaveText("Marked 4 notifications as read. No unread notifications left.");
    await expect(main(page).locator("#nc-unseen-heading")).toBeFocused();
    await expect(unreadCount(page)).toHaveText("0 unread");
    await expect(main(page).getByTestId("unseen-empty")).toBeVisible();
    await markAll(page).click();
    await expect(status(page)).toHaveText("There are no unread notifications for Jordan Reyes.");
  });

  test("read state is kept per viewer", async ({ page }) => {
    await page.goto(DEMO);
    await markAll(page).click();
    await main(page).locator("#nc-viewer").selectOption("p-lena");
    await expect(unreadCount(page)).toHaveText("3 unread");
    await main(page).locator("#nc-viewer").selectOption("p-jordan");
    await expect(unreadCount(page)).toHaveText("0 unread");
  });

  test("kudos validation and success", async ({ page }) => {
    await page.goto(DEMO);
    await sendKudos(page).click();
    await expect(status(page)).toHaveText("Choose a colleague to send kudos to.");
    await expect(main(page).locator("#nc-kudos-error")).toHaveText("Choose a colleague to send kudos to.");
    await expect(main(page).locator("#nc-kudos-recipient")).toBeFocused();
    await expect(main(page).locator("#nc-kudos-recipient")).toHaveAttribute("aria-invalid", "true");

    await main(page).locator("#nc-kudos-recipient").selectOption("p-lena");
    await sendKudos(page).click();
    await expect(status(page)).toHaveText("Choose a kudos message.");
    await expect(main(page).locator("#nc-kudos-preset-high-five")).toBeFocused();

    await main(page).getByLabel("High Five").check();
    await sendKudos(page).click();
    await expect(status(page)).toHaveText("Kudos sent: Jordan Reyes gave Lena Kowalski a High Five.");
    const first = main(page).getByTestId("activity-feed").getByRole("listitem").first();
    await expect(first).toContainText("Jordan Reyes gave Lena Kowalski kudos: High Five");
    await expect(first).toContainText("Just now");
    await expect(main(page).locator("#nc-kudos-error")).toHaveCount(0);
  });

  test("state persists across navigation; reload restores", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await markAll(page).click();
    await explorer(page).getByRole("link", { name: "onboarding-wizard.html" }).click();
    await expect(page).toHaveURL(ONBOARDING);
    await explorer(page).getByRole("link", { name: "notification-center.html" }).click();
    await expect(page).toHaveURL(DEMO);
    await expect(unreadCount(page)).toHaveText("0 unread");
    await page.reload();
    await expect(unreadCount(page)).toHaveText("4 unread");
    expect(errors).toEqual([]);
  });

  test("Reset demo restores and announces; focus stays", async ({ page }) => {
    await page.goto(DEMO);
    await markAll(page).click();
    const reset = main(page).getByRole("button", { name: "Reset demo" });
    await reset.click();
    await expect(status(page)).toHaveText("Demo reset. The sample notifications, read states and kudos were restored.");
    await expect(unreadCount(page)).toHaveText("4 unread");
    await expect(main(page).getByTestId("activity-feed").getByRole("listitem")).toHaveCount(4);
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
    expect([first, second, third].map(spoken)).toEqual(
      Array(3).fill("Demo reset. The sample notifications, read states and kudos were restored."),
    );
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
  });

  test("keyboard-only: Tab to the first Mark as read and press Enter", async ({ page }) => {
    await page.goto(DEMO);
    const target = markButton(page, "All-hands call moved to Thursday");
    for (let i = 0; i < 60 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(target).toBeFocused();
    await expect(target).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(markButton(page, "New weekend rota for the Support Desk")).toBeFocused();
  });
});

test.describe("notification center with reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("no animations or transitions after mark all", async ({ page }) => {
    await page.goto(DEMO);
    await markAll(page).click();
    await expect(unreadCount(page)).toHaveText("0 unread");
    const result = await page.evaluate(() => ({
      running: document.getAnimations().filter((a) => Number(a.effect?.getComputedTiming().duration ?? 0) > 20).length,
      offenders: [...document.querySelectorAll("[data-demo], [data-demo] *")]
        .filter((el) => parseFloat(getComputedStyle(el).transitionDuration) > 0.011)
        .map((el) => el.tagName),
    }));
    expect(result).toEqual({ running: 0, offenders: [] });
  });
});

test.describe("notification center at 360px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("no horizontal overflow before and after sending kudos", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
    await main(page).locator("#nc-kudos-recipient").selectOption("p-lena");
    await main(page).getByLabel("Thank You").check();
    await sendKudos(page).click();
    await expect(status(page)).toContainText("Kudos sent");
    expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
    expect(errors).toEqual([]);
  });
});
