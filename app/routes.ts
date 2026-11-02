import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

/**
 * URL structure mirrors the content registry (app/content/registry.ts). Every registry URL must
 * match one of these routes — enforced by app/content/registry.test.ts.
 */
export default [
  layout("routes/shell.tsx", [
    index("routes/home.tsx"),
    route("portfolio/:project", "routes/markdown-doc.tsx", { id: "project-readme" }),
    route("portfolio/:project/technical-requirements", "routes/markdown-doc.tsx", {
      id: "project-technical-requirements",
    }),
    route("portfolio/:project/views/:view", "routes/view.tsx"),
    route("docs", "routes/blog.tsx"),
    route("docs/about", "routes/about.tsx"),
    route("stack", "routes/stack.tsx"),
    route("search", "routes/search.tsx"),
    route("*", "routes/not-found.tsx"),
  ]),
] satisfies RouteConfig;
