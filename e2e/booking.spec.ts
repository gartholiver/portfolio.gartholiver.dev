import { expect, test, type Page } from "@playwright/test";

const HYBRID = "/portfolio/hybrid-wp-react-intranet";
const DEMO = `${HYBRID}/views/office-booking-calendar`;
const DIRECTORY = `${HYBRID}/views/employee-directory`;

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning")
      errors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

const main = (page: Page) => page.getByRole("main");
const table = (page: Page) => main(page).getByRole("table");
const status = (page: Page) => main(page).getByRole("status");
const summary = (page: Page) => main(page).getByTestId("booking-summary");
const explorer = (page: Page) =>
  page.getByRole("navigation", { name: "Explorer" });
const reserveB1Tue = (page: Page) =>
  main(page).getByRole("button", {
    name: "Reserve Desk B1 on Tuesday 3 November",
  });
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => ({
    doc:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
    main:
      document.getElementById("content")!.scrollWidth -
      document.getElementById("content")!.clientWidth,
  }));

test.describe("office booking calendar", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("prerendered HTML contains the fixture table", async ({ request }) => {
    const html = await (await request.get(DEMO)).text();
    expect(html).toContain("<table");
    expect(html).toContain("Desk A2");
    expect(html).toContain("A. Rivera");
    expect(html).toContain("Reserve Desk B1 on Monday 2 November");
    expect(html).toContain("You have 0 reservations this week");
    expect(html).toContain("nothing is saved");
  });

  test("renders an accessible desks x days table with sample data", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await expect(table(page)).toBeVisible();
    await expect(table(page).getByRole("columnheader")).toHaveCount(6); // corner + 5 days
    await expect(
      table(page).getByRole("columnheader", { name: /Mon 2 Nov/ }),
    ).toBeVisible();
    await expect(table(page).getByRole("rowheader")).toHaveText([
      "Desk A1",
      "Desk A2",
      "Desk B1",
      "Desk B2",
    ]);
    await expect(summary(page)).toHaveText("You have 0 reservations this week");
    await expect(
      main(page)
        .getByText(/nothing is saved/i)
        .first(),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("booked-by-others cells are plain text with no action", async ({
    page,
  }) => {
    await page.goto(DEMO);
    const cell = table(page)
      .getByRole("row", { name: /^Desk A2/ })
      .getByRole("cell")
      .first(); // Monday
    await expect(cell).toContainText("Reserved");
    await expect(cell).toContainText("A. Rivera");
    await expect(cell.getByRole("button")).toHaveCount(0);
    // 8 fixture reservations, 12 free slots -> 12 Reserve buttons
    await expect(
      main(page).getByRole("button", { name: /^Reserve / }),
    ).toHaveCount(12);
  });

  test("reserve, see it as yours with an announcement, then cancel", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await reserveB1Tue(page).click();

    const cancel = main(page).getByRole("button", {
      name: "Cancel your reservation of Desk B1 on Tuesday 3 November",
    });
    await expect(cancel).toBeVisible();
    await expect(cancel).toBeFocused(); // focus stays on the cell's new button
    await expect(status(page)).toHaveText("Desk B1 reserved for Tuesday.");
    await expect(summary(page)).toHaveText("You have 1 reservation this week");
    await expect(
      table(page).getByRole("row", { name: /^Desk B1/ }),
    ).toContainText("Yours");

    await cancel.click();
    await expect(reserveB1Tue(page)).toBeFocused();
    await expect(status(page)).toHaveText(
      "Your Desk B1 reservation for Tuesday was cancelled.",
    );
    await expect(summary(page)).toHaveText("You have 0 reservations this week");
    expect(errors).toEqual([]);
  });

  test("one desk per day: a second desk the same day moves the reservation", async ({
    page,
  }) => {
    await page.goto(DEMO);
    await main(page)
      .getByRole("button", { name: "Reserve Desk A1 on Monday 2 November" })
      .click();
    const move = main(page).getByRole("button", {
      name: /^Move here: reserve Desk B1 on Monday 2 November/,
    });
    await expect(move).toHaveText("Move here");
    await move.click();
    await expect(
      main(page).getByRole("button", {
        name: "Cancel your reservation of Desk B1 on Monday 2 November",
      }),
    ).toBeFocused();
    await expect(status(page)).toHaveText(
      "Desk B1 reserved for Monday. Your reservation moved from Desk A1.",
    );
    await expect(summary(page)).toHaveText("You have 1 reservation this week");
    await expect(
      main(page).getByRole("button", {
        name: "Reserve Desk A1 on Monday 2 November",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      main(page).getByRole("button", {
        name: /^Move here: reserve Desk A1 on Monday/,
      }),
    ).toBeVisible();
  });

  test("reservations persist across navigation; reload restores fixtures", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await reserveB1Tue(page).click();
    await expect(summary(page)).toHaveText("You have 1 reservation this week");

    // client-side navigation away (explorer) and back
    await explorer(page)
      .getByRole("button", { name: "employee-directory.html" })
      .or(explorer(page).getByRole("link", { name: "employee-directory.html" }))
      .first()
      .click();
    await expect(page).toHaveURL(DIRECTORY);
    await explorer(page)
      .getByRole("link", { name: "office-booking-calendar.html" })
      .click();
    await expect(page).toHaveURL(DEMO);
    await expect(summary(page)).toHaveText("You have 1 reservation this week");
    await expect(
      main(page).getByRole("button", {
        name: "Cancel your reservation of Desk B1 on Tuesday 3 November",
      }),
    ).toBeVisible();

    await page.reload();
    await expect(summary(page)).toHaveText("You have 0 reservations this week");
    await expect(reserveB1Tue(page)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("Reset demo restores fixtures and announces without confirmation", async ({
    page,
  }) => {
    await page.goto(DEMO);
    await reserveB1Tue(page).click();
    await main(page)
      .getByRole("button", { name: "Reserve Desk B2 on Wednesday 4 November" })
      .click();
    await expect(summary(page)).toHaveText("You have 2 reservations this week");

    const reset = main(page).getByRole("button", { name: "Reset demo" });
    await reset.click();
    await expect(summary(page)).toHaveText("You have 0 reservations this week");
    await expect(status(page)).toHaveText(
      "Demo reset. The sample reservations were restored.",
    );
    await expect(reset).toBeFocused();
    await expect(reserveB1Tue(page)).toBeVisible();
  });

  test("announcements repeat: pressing Reset demo twice changes the live-region text each time", async ({
    page,
  }) => {
    await page.goto(DEMO);
    const reset = main(page).getByRole("button", { name: "Reset demo" });
    const raw = () => status(page).evaluate((el) => el.textContent ?? "");
    const spoken = (text: string) => text.replace(/\u200b/g, "");

    await reset.click();
    const first = await raw();
    await reset.click();
    const second = await raw();
    await reset.click();
    const third = await raw();
    expect([first, second, third].map(spoken)).toEqual(
      Array(3).fill("Demo reset. The sample reservations were restored."),
    );
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
  });

  test("a reservation by someone else can never be taken, moved or cancelled", async ({
    page,
  }) => {
    await page.goto(DEMO);
    const a2Monday = table(page)
      .getByRole("row", { name: /^Desk A2/ })
      .getByRole("cell")
      .first();
    await expect(a2Monday).toContainText("A. Rivera");
    await expect(a2Monday.getByRole("button")).toHaveCount(0);
    // having your own booking that day does not unlock it either (it becomes "Move here" only on free desks)
    await main(page)
      .getByRole("button", { name: "Reserve Desk A1 on Monday 2 November" })
      .click();
    await expect(a2Monday.getByRole("button")).toHaveCount(0);
    await expect(a2Monday).toContainText("A. Rivera");
    await expect(summary(page)).toHaveText("You have 1 reservation this week");
    await expect(
      main(page).getByRole("button", { name: /^(Reserve|Cancel|Move here).*Desk A2 on Monday/ }),
    ).toHaveCount(0);
  });

  test("keyboard-only: tab to a cell, reserve with Enter, cancel with Space", async ({
    page,
  }) => {
    await page.goto(DEMO);
    const target = reserveB1Tue(page);
    for (
      let i = 0;
      i < 60 && !(await target.evaluate((el) => el === document.activeElement));
      i++
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(target).toBeFocused();
    await expect(target).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(status(page)).toHaveText("Desk B1 reserved for Tuesday.");
    const cancel = main(page).getByRole("button", {
      name: "Cancel your reservation of Desk B1 on Tuesday 3 November",
    });
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Space");
    await expect(status(page)).toHaveText(
      "Your Desk B1 reservation for Tuesday was cancelled.",
    );
    await expect(reserveB1Tue(page)).toBeFocused();
  });
});

test.describe("office booking calendar at 360px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("table scrolls inside its own region; the page does not scroll sideways", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(DEMO);
    await expect(table(page)).toBeVisible();
    expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });

    const region = main(page).getByRole("region", {
      name: /Desk reservations/,
    });
    expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );

    await reserveB1Tue(page).scrollIntoViewIfNeeded();
    await reserveB1Tue(page).click();
    await expect(summary(page)).toHaveText("You have 1 reservation this week");
    expect(await horizontalOverflow(page)).toEqual({ doc: 0, main: 0 });
    expect(errors).toEqual([]);
  });
});
