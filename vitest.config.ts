import { defineConfig } from "vitest/config";
import { fileIcons } from "./vite.icons";

// Separate from vite.config.ts so the React Router plugin doesn't run under Vitest.
export default defineConfig({
  plugins: [fileIcons()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["app/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
