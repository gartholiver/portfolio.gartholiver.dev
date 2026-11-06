# Content registry

`app/content/registry.ts` is the single source of truth for every page in the explorer. It drives:

- the explorer tree (`buildExplorerTree`) and breadcrumbs (`getBreadcrumbs`, `getAncestors`)
- URL lookup (`getEntryByPathname`, `getEntryById`)
- prerendering (`getPrerenderPaths`, used by `react-router.config.ts`)
- the route config (`app/routes.ts` maps `routeEntries` to route modules)
- search (`getSearchSources`, consumed by `app/content/search-index.server.ts`)

The four projects and their views are plain data in `app/content/projects.ts`; `registry.ts` expands them into entries.

> `react-router.config.ts` and `app/routes.ts` import the registry in Node, outside Vite. Registry files (`registry.ts`, `projects.ts`) must use **relative imports only**: no `~/` alias, no `?raw`, CSS or `import.meta.glob`. Anything that needs those belongs in `*.server.ts` modules called from route loaders.

## Entry model

```ts
export interface RouteEntry extends EntryBase {
  kind: RoutePageKind;   // "home" | "markdown" | "view" | "demo" | "about" | "blog" | "stack" | "search"
  url: string;           // clean URL, no trailing slash (except "/")
  content: Exclude<ContentRef, { type: "action" }>;
}
```

`EntryBase` adds `id`, `label` (filename shown in the explorer), `title`, `explorerPath` (unique), optional `projectId`, `tags` and `description` (search context and `<meta name="description">`). `contact-action` entries have `url: null` and no route; they open the contact terminal.

`content` says where the page body comes from:

| `content.type` | Meaning |
| --- | --- |
| `markdown` | `{ file: "projects/<id>/README.md", docType }`, path relative to `/content` |
| `demo` | `{ demoId }`, a key in `app/demos/index.ts` |
| `view-placeholder` | copy in `app/content/view-placeholders.ts`, keyed by entry id |
| `data` | `app/data/{home,profile,stack}.ts` (blog and search have a `key` but no data file) |
| `action` | no page (contact terminal) |

## Real descriptions

By default every README, technical-requirements document and view gets a generated description ending in the shared placeholder text. Two optional fields in `app/content/projects.ts` replace it with real copy:

- `Project.summary?` is a real one-line project summary.
- `ProjectView.description?` is a real one-line view description.

The formulas live in three exported helpers in `registry.ts`:

- README description = `project.summary`, otherwise `Project summary for ${title}. ${PLACEHOLDER}`.
- Technical-requirements description = `Technical requirements for ${title}. ${project.summary}`, otherwise `Technical requirements for ${title}. ${PLACEHOLDER}` (`describeReadme`, `describeTechnicalRequirements`).
- View description = `view.description`, otherwise the generated demo or placeholder line (`describeView`).

`hybrid-wp-react-intranet` uses both (with `status: "final"`); the other projects keep the generated text. Keep this copy anonymised: no client or agency names, outcomes or metrics.

## IDs and URL mapping

| Explorer entry | Entry id | URL | Kind |
| --- | --- | --- | --- |
| `portfolio/<project>/README.md` | `doc:<project>:readme` | `/portfolio/<project>` | `markdown` |
| `portfolio/<project>/technical-requirements.md` | `doc:<project>:technical-requirements` | `/portfolio/<project>/technical-requirements` | `markdown` |
| `portfolio/<project>/views/<slug>.html` | `view:<project>:<slug>` | `/portfolio/<project>/views/<slug>` | `view` (placeholder) or `demo` |
| `docs/index.html` | `docs:blog` | `/docs` | `blog` |
| `docs/about.html` | `docs:about` | `/docs/about` | `about` |
| `docs/contact.bash` | `docs:contact` | none (opens the terminal) | `contact-action` |
| `index.html` | `home` | `/` | `home` |
| `package.json` | `stack` | `/stack` | `stack` |
| `search.tsx` | `search` | `/search` | `search` |

Folder names double as URL slugs (`project.id === project.folder`). A view slug is unique only within its project: `custom-woo-extension-plugin` exists in two projects, so always use the full id or URL. The explorer order is the order of `entries` (project views, then README and technical-requirements, then the rest).

## Add a project

1. `app/content/projects.ts`: add the id to `PROJECT_IDS` and a project object to `projects`.

   ```ts
   {
     id: "hybrid-wp-react-intranet",
     folder: "hybrid-wp-react-intranet",
     title: "Hybrid WordPress + React Intranet",
     tags: ["WordPress", "React", "Intranet"],
     status: "placeholder",
     views: [
       { slug: "office-booking-calendar", title: "Office Booking Calendar", demoId: "office-booking-calendar" },
       { slug: "employee-directory", title: "Employee Directory" },
     ],
   }
   ```

2. `content/projects/<id>/README.md` and `content/projects/<id>/technical-requirements.md` (see [markdown-conventions.md](markdown-conventions.md)). The build fails if a registered file is missing; `registry.test.ts` also fails if a Markdown file is not registered.
3. `app/data/home.ts`: add the project to `projectBlurbs` (typed `satisfies Record<ProjectId, string>`, so typecheck fails until you do).
4. `app/content/view-placeholders.ts`: one entry per non-demo view, keyed `view:<project>:<slug>`.
5. Update hard-coded counts in `app/content/registry.test.ts` (views, docs, total entries), `app/content/view-placeholders.test.ts` (15 placeholder views) and `e2e/verification.spec.ts` (33 entries, 32 routes).

Routes, prerender paths, explorer entries, breadcrumbs and search all follow automatically.

## Add a Markdown document or a view to an existing project

- **View:** add `{ slug, title }` to the project's `views` and a placeholder entry in `view-placeholders.ts` (the build throws in the view loader if either is missing). To make it an interactive demo, see [demos.md](demos.md).
- **Markdown document:** the registry currently generates exactly two documents per project (`readme`, `technical-requirements`) from the `docType` union in `registry.ts`. An extra document type needs a new `MarkdownDocType`, a new entry in `projectEntries()`, and a unique route id in `routeId()` in `app/routes.ts`. Existing documents only need their `.md` file edited.
- **Top-level page:** add an object to `entries` in `registry.ts` with an existing `kind`.

## How routes and prerendering follow

`app/routes.ts` generates one concrete route per registry URL inside the persistent `routes/shell.tsx` layout, plus a `*` catch-all (`routes/not-found.tsx`):

```ts
const pages: RouteConfigEntry[] = routeEntries.map((entry) => {
  const file = MODULE_BY_KIND[entry.kind];
  if (entry.kind === "home") return index(file);
  const id = routeId(entry);
  return route(entry.url.replace(/^\//, ""), file, id ? { id } : {});
});
```

Routes are deliberately **not** dynamic (`portfolio/:project/...`): with `ssr: false` a dynamic route would also match unknown URLs and break the 404 page. Do not replace them with params.

A new route module is only needed for a **new `PageKind`**. Add the kind to `PageKind` in `registry.ts`, a `MODULE_BY_KIND` entry in `app/routes.ts` (the record is exhaustive, so typecheck tells you), and the module under `app/routes/`. Loaders resolve their entry with `requireEntry(url)` from `app/content/load-entry.ts`.

`react-router.config.ts` prerenders `[...getPrerenderPaths(), NOT_FOUND_PRERENDER_PATH]`, and `registry.test.ts` checks that every URL resolves to the expected route module, that unknown URLs under known shapes hit the catch-all, and that there is exactly one route per entry.
