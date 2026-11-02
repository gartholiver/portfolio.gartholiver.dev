import { expect, test, type Page } from "@playwright/test";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test("home page loads, hydrates and navigates client-side", async ({ page }) => {
  const errors = collectErrors(page);
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Garth Oliver");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Portfolio");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");

  await page.getByRole("link", { name: "Hybrid WordPress + React Intranet" }).click();
  await expect(page).toHaveURL(/\/portfolio\/hybrid-wp-react-intranet$/);
  await expect(page.getByRole("heading", { name: "Views in this project" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("project README renders prerendered Markdown with anchors", async ({ page }) => {
  const errors = collectErrors(page);
  const response = await page.goto("/portfolio/legal-doc-wp-ordering-system#views-in-this-project");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Legal Document WordPress Ordering System");
  await expect(page.locator("h2#views-in-this-project")).toBeVisible();
  await expect(page.locator("aside.callout").first()).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("duplicate filenames resolve to distinct project views", async ({ page }) => {
  await page.goto("/portfolio/legal-doc-wp-ordering-system/views/custom-woo-extension-plugin");
  await expect(page.locator("article[data-entry-id]")).toHaveAttribute(
    "data-entry-id",
    "view:legal-doc-wp-ordering-system:custom-woo-extension-plugin",
  );
  await page.goto("/portfolio/multi-location-inventory-sales-system/views/custom-woo-extension-plugin");
  await expect(page.locator("article[data-entry-id]")).toHaveAttribute(
    "data-entry-id",
    "view:multi-location-inventory-sales-system:custom-woo-extension-plugin",
  );
});

test("unknown URLs return the 404 page with a 404 status", async ({ page }) => {
  const errors = collectErrors(page);
  const response = await page.goto("/this/does/not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("404 — File not found");
  await page.getByRole("link", { name: "Open index.html" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Portfolio");
  // The document request itself is a 404 (expected); ignore the browser's resource-load message for it.
  expect(errors.filter((e) => !/404/.test(e))).toEqual([]);
});
