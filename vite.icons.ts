import { createRequire } from "node:module";
import { getIconData, iconToSVG } from "@iconify/utils";
import Icons from "unplugin-icons/vite";

/**
 * File-type icons (Material Icon Theme, MIT, via `@iconify-json/material-icon-theme`), compiled at build
 * time into tiny React components that render inline `<svg>`: only the icons imported with
 * `~icons/<collection>/<name>` reach the bundle, nothing is fetched at runtime, and they are in the
 * prerendered HTML.
 * Shared by vite.config.ts and vitest.config.ts.
 */
const materialIcons = createRequire(import.meta.url)("@iconify-json/material-icon-theme/icons.json") as Parameters<typeof getIconData>[0];

/** Material Icon Theme's default grey for the generic folder and file icons. */
const DEFAULT_GREY = "#90a4ae";

/**
 * The Iconify package has no plain `folder` / `file` icons (only named variants), so the generic ones are
 * derived from it: the `folder-base` outline without its badge, and `document` in the theme's default grey.
 */
const DERIVED: Record<string, { from: string; firstPathOnly?: boolean }> = {
  folder: { from: "folder-base", firstPathOnly: true },
  "folder-open": { from: "folder-base-open", firstPathOnly: true },
  file: { from: "document" },
};

function derivedIcon(name: string): string | undefined {
  const spec = DERIVED[name];
  const data = spec && getIconData(materialIcons, spec.from);
  if (!spec || !data) return undefined;
  let body = data.body;
  if (spec.firstPathOnly) body = body.match(/<path\b[^>]*\/>/)?.[0] ?? body;
  body = body.replace(/fill="#[0-9a-f]{3,8}"/gi, `fill="${DEFAULT_GREY}"`);
  const { attributes } = iconToSVG({ ...data, body });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${attributes.viewBox}">${body}</svg>`;
}

const RE_SVG = /^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/;

/**
 * Minimal React compiler: emits `createElement("svg", { viewBox, ...props, dangerouslySetInnerHTML })`.
 * (unplugin-icons' own `jsx` compiler needs SVGR + Babel; this needs nothing.)
 */
function compileReactIcon(svg: string, collection: string, icon: string): string {
  const match = RE_SVG.exec(svg.trim());
  const viewBox = match?.[1]?.match(/viewBox="([^"]+)"/)?.[1];
  if (!match || !viewBox) throw new Error(`Unexpected SVG for icon ${collection}:${icon}`);
  return [
    `import { createElement } from "react";`,
    `const body = ${JSON.stringify(match[2])};`,
    `export default function Icon(props) {`,
    `  return createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: ${JSON.stringify(viewBox)}, width: 16, height: 16, ...props, dangerouslySetInnerHTML: { __html: body } });`,
    `}`,
  ].join("\n");
}

export function fileIcons() {
  return Icons({
    compiler: { compiler: compileReactIcon },
    autoInstall: false,
    customCollections: { "file-icons": (name: string) => derivedIcon(name) },
  });
}
