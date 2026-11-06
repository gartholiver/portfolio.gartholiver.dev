import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { fileIcons } from "./vite.icons";

export default defineConfig({
  plugins: [reactRouter(), fileIcons()],
  resolve: {
    tsconfigPaths: true,
  },
});
