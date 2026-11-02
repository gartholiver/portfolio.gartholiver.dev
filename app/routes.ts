import { type RouteConfig, type RouteConfigEntry, index, layout, route } from "@react-router/dev/routes";
import { routeEntries, type RoutePageKind } from "./content/registry";

/**
 * URL structure mirrors the content registry (app/content/registry.ts): one concrete route per
 * registry URL, all inside the persistent shell layout. Routes are deliberately NOT dynamic
 * (`portfolio/:project/...`): with `ssr: false` a dynamic route also matches unknown URLs such as
 * `/portfolio/typo`, and hydrating the static 404.html there would try to fetch loader data that
 * doesn't exist and replace the shell with an error page. Concrete paths leave every unknown URL to
 * the `*` catch-all (the in-shell 404 page). Adding a registry entry adds its route automatically.
 */
const MODULE_BY_KIND: Record<RoutePageKind, string> = {
  home: "routes/home.tsx",
  markdown: "routes/markdown-doc.tsx",
  view: "routes/view.tsx",
  demo: "routes/view.tsx",
  about: "routes/about.tsx",
  blog: "routes/blog.tsx",
  stack: "routes/stack.tsx",
  search: "routes/search.tsx",
};

/** Kinds backed by several entries share one module, so each needs a unique route id. */
function routeId(entry: (typeof routeEntries)[number]): string | undefined {
  switch (entry.kind) {
    case "markdown":
      return entry.content.type === "markdown" && entry.content.docType === "readme"
        ? `project-readme:${entry.projectId}`
        : `project-technical-requirements:${entry.projectId}`;
    case "view":
    case "demo":
      return entry.id;
    default:
      return undefined; // singletons keep the default file-based id
  }
}

const pages: RouteConfigEntry[] = routeEntries.map((entry) => {
  const file = MODULE_BY_KIND[entry.kind];
  if (entry.kind === "home") return index(file);
  const id = routeId(entry);
  return route(entry.url.replace(/^\//, ""), file, id ? { id } : {});
});

export default [layout("routes/shell.tsx", [...pages, route("*", "routes/not-found.tsx")])] satisfies RouteConfig;
