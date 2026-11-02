import type { Config } from "@react-router/dev/config";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import { getPrerenderPaths, NOT_FOUND_PRERENDER_PATH } from "./app/content/registry";

export default {
  // Fully static: every content route is prerendered to HTML at build time.
  ssr: false,
  prerender: () => [...getPrerenderPaths(), NOT_FOUND_PRERENDER_PATH],
  // Netlify (and `serve`) answer unknown URLs with /404.html and a 404 status.
  // The catch-all route is prerendered at /404 → copy it to the root 404.html.
  async buildEnd({ viteConfig }) {
    const clientDir = viteConfig.environments?.client?.build?.outDir ?? join(viteConfig.root, "build/client");
    await copyFile(join(clientDir, "404/index.html"), join(clientDir, "404.html"));
  },
} satisfies Config;
