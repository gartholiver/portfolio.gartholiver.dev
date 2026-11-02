import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * E2E runs against the static production build (build/client), served like Netlify would:
 * prerendered HTML per route, 404.html with a 404 status for unknown paths.
 * `npm run test:e2e` builds first; the webServer only serves.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
