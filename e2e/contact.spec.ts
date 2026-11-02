import { expect, test, type Locator, type Page } from "@playwright/test";

const DONE = "Demo complete — nothing was sent.";

const body = (page: Page) => page.locator("#terminal-body");
const input = (page: Page) => page.locator("#contact-input");
const live = (page: Page) => page.locator("[data-contact-live]");
const inlineError = (page: Page) => page.locator("#contact-error");
const button = (page: Page, name: string | RegExp) => body(page).getByRole("button", { name, exact: typeof name === "string" });

/** Records requests made after the page has loaded. */
function recordRequests(page: Page) {
  const requests: { method: string; url: string; type: string }[] = [];
  page.on("request", (request) => {
    requests.push({ method: request.method(), url: request.url(), type: request.resourceType() });
  });
  return requests;
}

async function expectActiveIn(locator: Locator) {
  await expect(locator).toBeFocused();
}

async function inView(page: Page, target: Locator) {
  const container = (await body(page).boundingBox())!;
  const box = (await target.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(container.y - 1);
  expect(box.y + box.height).toBeLessThanOrEqual(container.y + container.height + 1);
}

test.describe("contact terminal (desktop)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("keyboard-only flow with validation, announcements and zero network requests", async ({ page }) => {
    await page.goto("/");
    await expect(body(page)).toBeVisible();
    await expect(body(page)).toContainText("Demo — nothing is sent");
    const requests = recordRequests(page);

    await input(page).focus();
    await expect(input(page)).toHaveAccessibleName(/What's your name\?/);

    // required
    await page.keyboard.press("Enter");
    await expect(inlineError(page)).toHaveText("Please enter your name.");
    await expect(live(page)).toContainText("Error: Please enter your name.");
    await expect(input(page)).toHaveAttribute("aria-invalid", "true");
    await expect(input(page)).toHaveAttribute("aria-describedby", /contact-error/);
    await expectActiveIn(input(page));

    // whitespace only is still empty
    await page.keyboard.type("   ");
    await expect(inlineError(page)).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(inlineError(page)).toBeVisible();

    await page.keyboard.type("Ada Lovelace");
    await page.keyboard.press("Enter");
    await expect(live(page)).toContainText("Step 2 of 3");
    await expect(input(page)).toHaveAccessibleName(/What's your email\?/);
    await expectActiveIn(input(page));
    await expect(body(page)).toContainText("Ada Lovelace");

    // empty and invalid email
    await page.keyboard.press("Enter");
    await expect(inlineError(page)).toHaveText("Please enter your email address.");
    await page.keyboard.type("not-an-email");
    await page.keyboard.press("Enter");
    await expect(inlineError(page)).toContainText("doesn't look like an email");
    await expect(live(page)).toContainText("Error: That doesn't look like an email address");
    await expect(input(page)).toHaveAttribute("aria-invalid", "true");

    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("ada@example.com");
    await expect(input(page)).not.toHaveAttribute("aria-invalid", "true");
    await page.keyboard.press("Enter");

    // multiline message: Enter inserts a newline, Ctrl+Enter submits
    const message = input(page);
    await expect(message).toHaveAccessibleName(/What would you like to talk about\?/);
    await expect(body(page)).toContainText(/Ctrl\/Cmd\+Enter/);
    await expectActiveIn(message);
    await page.keyboard.press("Control+Enter");
    await expect(inlineError(page)).toHaveText("Please enter a message.");
    await page.keyboard.type("Hello there.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Second line.");
    await expect(message).toHaveValue("Hello there.\nSecond line.");
    await expect(body(page)).not.toContainText("Step 4");
    await page.keyboard.press("Control+Enter");

    // review
    await expect(live(page)).toContainText("Review your answers");
    await expect(body(page)).toContainText("Ada Lovelace");
    await expect(body(page)).toContainText("ada@example.com");
    await expect(body(page)).toContainText("Hello there.");
    await expect(body(page)).toContainText("Second line.");
    await expect(button(page, "Finish demo")).toBeFocused();
    await page.keyboard.press("Enter");

    // completion
    await expect(body(page).getByText(DONE, { exact: true })).toBeVisible();
    await expect(body(page)).toContainText("Demo — nothing is sent");
    await expect(button(page, "Start again")).toBeFocused();
    await expect(body(page)).not.toContainText("message sent");

    expect(requests).toEqual([]);

    // start again → fresh draft
    await page.keyboard.press("Enter");
    await expect(input(page)).toHaveValue("");
    await expect(input(page)).toHaveAccessibleName(/What's your name\?/);
    await expectActiveIn(input(page));
    await expect(live(page)).toContainText("Draft cleared");
  });

  test("Continue buttons, Back, edit from review and Restart", async ({ page }) => {
    await page.goto("/");
    const requests = recordRequests(page);

    await expect(button(page, "Continue")).toBeVisible();
    await expect(button(page, "Back")).toHaveCount(0);
    await button(page, "Continue").click();
    await expect(inlineError(page)).toHaveText("Please enter your name.");
    await expectActiveIn(input(page)); // focus returns to the field with the error

    await input(page).fill("  Grace  ");
    await button(page, "Continue").click();
    await expect(input(page)).toHaveAccessibleName(/email/);
    await expectActiveIn(input(page));

    // Back keeps the answer prefilled, then forward again
    await button(page, "Back").click();
    await expect(input(page)).toHaveValue("Grace");
    await expectActiveIn(input(page));
    await button(page, "Continue").click();

    await input(page).fill("grace@example.com");
    await button(page, "Continue").click();
    await input(page).fill("  Compilers!  ");
    await button(page, "Continue").click();

    // review
    await expect(button(page, "Edit name")).toBeVisible();
    await expect(button(page, "Edit email")).toBeVisible();
    await expect(button(page, "Edit message")).toBeVisible();
    await expect(button(page, "Finish demo")).toBeFocused();

    await button(page, "Edit email").click();
    await expect(input(page)).toHaveValue("grace@example.com");
    await expectActiveIn(input(page));
    await expect(live(page)).toContainText("Editing email");
    await input(page).fill("hopper@example.com");
    await button(page, "Continue").click();
    await expect(button(page, "Finish demo")).toBeFocused();
    await expect(body(page)).toContainText("hopper@example.com");
    await expect(body(page)).not.toContainText("grace@example.com");

    // Back out of an edit leaves the answer alone
    await button(page, "Edit name").click();
    await input(page).fill("Someone else");
    await button(page, "Back to review").click();
    await expect(body(page)).toContainText("Grace");
    await expect(body(page)).not.toContainText("Someone else");

    await button(page, "Edit message").click();
    await expect(input(page)).toHaveValue("Compilers!");
    await button(page, "Continue").click();

    // Restart clears everything and announces it
    await button(page, "Restart").click();
    await expect(live(page)).toContainText("Draft cleared");
    await expect(input(page)).toHaveValue("");
    await expect(input(page)).toHaveAccessibleName(/What's your name\?/);
    await expectActiveIn(input(page));
    await expect(body(page)).not.toContainText("hopper@example.com");

    // full pass via buttons to completion
    await input(page).fill("A");
    await button(page, "Continue").click();
    await input(page).fill("a@b.co");
    await button(page, "Continue").click();
    await input(page).fill("hi");
    await button(page, "Continue").click();
    await button(page, "Finish demo").click();
    await expect(body(page).getByText(DONE, { exact: true })).toBeVisible();

    expect(requests).toEqual([]);
  });

  test("the draft survives navigation and collapsing/expanding the terminal", async ({ page }) => {
    await page.goto("/stack");
    await input(page).fill("Ada");
    await button(page, "Continue").click();
    await input(page).fill("half-typed@exam"); // uncommitted text is kept too

    // navigate (client-side; the shell stays mounted)
    await page.getByRole("navigation", { name: "Explorer" }).getByRole("link", { name: "search.tsx" }).click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(input(page)).toHaveValue("half-typed@exam");
    await expect(body(page)).toContainText("Ada");

    // collapse / expand
    const toggle = page.getByRole("region", { name: /terminal/i }).getByRole("button", { name: /terminal/i });
    await toggle.click();
    await expect(body(page)).toBeHidden();
    await toggle.click();
    await expect(body(page)).toBeVisible();
    await expect(input(page)).toHaveValue("half-typed@exam");

    // and at a later step: finish to review, navigate again
    await input(page).fill("ada@example.com");
    await button(page, "Continue").click();
    await input(page).fill("Hello");
    await button(page, "Continue").click();
    await page.getByRole("navigation", { name: "Explorer" }).getByRole("link", { name: "package.json" }).click();
    await expect(page).toHaveURL(/\/stack$/);
    await expect(button(page, "Finish demo")).toBeVisible();
    await expect(body(page)).toContainText("ada@example.com");

    // a full refresh clears the draft (memory only)
    await page.reload();
    await expect(input(page)).toHaveValue("");
    await expect(input(page)).toHaveAccessibleName(/What's your name\?/);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie])).toEqual([0, 0, ""]);
  });

  test("nothing can be submitted: no form actions, Netlify Forms, storage or non-GET requests", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("form[action], form[data-netlify], [data-netlify], input[name='form-name']")).toHaveCount(0);
    const requests = recordRequests(page);
    page.on("dialog", (dialog) => dialog.dismiss());

    await input(page).fill("Ada");
    await input(page).press("Enter");
    await input(page).fill("ada@example.com");
    await input(page).press("Enter");
    await input(page).fill("Hi");
    await input(page).press("Control+Enter");
    await button(page, "Finish demo").click();
    await expect(body(page).getByText(DONE, { exact: true })).toBeVisible();

    expect(requests).toEqual([]);
    expect(page.url()).toMatch(/localhost:4173\/$/);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie])).toEqual([0, 0, ""]);
  });

  test("shows a visible focus indicator on the input", async ({ page }) => {
    await page.goto("/");
    await input(page).focus();
    const outline = await input(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });
});

test.describe("contact terminal (mobile, 360px)", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("opened from the drawer's contact.bash, completes with the active control in view", async ({ page }) => {
    await page.goto("/");
    await expect(body(page)).toBeHidden();
    await page.getByRole("button", { name: "Explorer", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Explorer" });
    await drawer.getByRole("button", { name: "docs", exact: true }).click();
    await drawer.getByRole("button", { name: /^contact\.bash/ }).click();

    await expect(body(page)).toBeVisible();
    await expect(input(page)).toBeFocused();
    await expect(body(page)).toContainText("Demo — nothing is sent");
    const requests = recordRequests(page);

    const noHScroll = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await noHScroll()).toBe(0);

    const panel = (await page.locator("#terminal-panel").boundingBox())!;
    expect(panel.height).toBeLessThanOrEqual(740 * 0.45 + 1);

    // font-size >= 16px so iOS does not zoom on focus
    expect(await input(page).evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);

    await input(page).fill("Ada");
    await button(page, "Continue").click();
    await expect(input(page)).toBeFocused();
    await inView(page, input(page));
    await inView(page, button(page, "Continue"));

    await input(page).fill("ada@example.com");
    await button(page, "Continue").click();
    await expect(input(page)).toHaveAccessibleName(/talk about/);
    await expect(input(page)).toBeFocused();
    await inView(page, input(page));
    await inView(page, button(page, "Continue"));

    await input(page).fill("Hello from a phone");
    await button(page, "Continue").click();
    await expect(button(page, "Finish demo")).toBeFocused();
    await inView(page, button(page, "Finish demo"));

    await button(page, "Finish demo").click();
    await expect(body(page).getByText(DONE, { exact: true })).toBeVisible();
    await inView(page, button(page, "Start again"));
    expect(await noHScroll()).toBe(0);
    expect(requests).toEqual([]);
  });

  test("with a short viewport (keyboard open) the error and buttons stay reachable", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 600 });
    await page.goto("/");
    await page.getByRole("button", { name: "Explorer", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Explorer" });
    await drawer.getByRole("button", { name: "docs", exact: true }).click();
    await drawer.getByRole("button", { name: /^contact\.bash/ }).click();
    await expect(input(page)).toBeFocused();

    await input(page).fill("Ada");
    await button(page, "Continue").click();
    await input(page).fill("nope");
    await button(page, "Continue").click();
    await expect(inlineError(page)).toBeVisible();
    await inView(page, input(page));
    await inView(page, button(page, "Continue"));
  });
});
