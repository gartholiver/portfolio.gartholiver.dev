# gartholiver.dev

Editor-styled portfolio. React Router v8 Framework Mode + Vite + TypeScript + CSS Modules, fully static (`ssr: false`, every route prerendered), deployed to Netlify from `build/client`. Plan: `.claude/plans/initial-dev-plan.md`. Setup, deploy and structure: `README.md`. Guides: `docs/` (`content-registry.md`, `markdown-conventions.md`, `demos.md`, `phase-2-content-needs.md`, `testing.md`).

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — prerender everything to `build/client` (+ `404.html`)
- `npm run typecheck` — `react-router typegen && tsc`
- `npm test` — Vitest (`app/**/*.test.ts(x)`, node env; add `// @vitest-environment jsdom` for DOM tests)
- `npm run test:e2e` — builds, then Playwright against the static build (`e2e/`). `build/` is shared: never build while e2e runs.
- `npm run preview` / `npm start` — serve `build/client` on :4173 (404.html → 404 status, no directory listings; `serve.json`)

## Structure

- `app/content/registry.ts` + `app/content/projects.ts` — **single source of truth** for explorer entries, URLs, page kinds and content refs. They drive the explorer, breadcrumbs, search, prerender paths **and `app/routes.ts`**. `react-router.config.ts` and `routes.ts` import them in plain Node, so registry files use relative imports only (no `~/` alias, `?raw`, CSS, `import.meta.glob`).
- `app/routes.ts` — generates one concrete route per registry URL inside `routes/shell.tsx`, plus the `*` catch-all (`routes/not-found.tsx`). Do not switch to dynamic `:param` routes (they would swallow unknown URLs and break the 404).
- `app/content/*.server.ts` — build-time only (Markdown loading, search index). Import only from route `loader`s.
- `app/lib/markdown/render.ts` — unified/remark/rehype pipeline: frontmatter, GFM, heading ids, TOC (h2/h3), callouts.
- `content/projects/<project-id>/{README,technical-requirements}.md` — case-study Markdown.
- `app/demos/` (registered in `app/demos/index.ts`), `app/fixtures/` (synthetic data), `app/data/` (home/profile/stack copy), `app/content/view-placeholders.ts` (placeholder view copy).
- `app/styles/tokens.css` — design tokens; components use CSS Modules (`*.module.css`).

## Conventions

- Adding a page, project or view: edit the registry/`projects.ts` only; routes, prerendering, explorer and search follow. A new route module (and a `MODULE_BY_KIND` entry in `app/routes.ts`) is needed only for a new `PageKind`. Hard-coded counts in `registry.test.ts`, `view-placeholders.test.ts` and `e2e/verification.spec.ts` must be updated. See `docs/content-registry.md`.
- Route loaders run only at build time; resolve the entry with `requireEntry(url)`. Loaders are not allowed on non-prerendered paths (`ssr: false`).
- Markdown: frontmatter `title`, `role`, `stack`, `status`, `summary`; callouts `> [!note|info|tip|warning|placeholder] Optional title`; link by clean URL (`/portfolio/<id>/views/<view>`); raw HTML is dropped. See `docs/markdown-conventions.md`.
- Demos: self-contained in `app/demos/<id>/`, in-memory state only (`useSyncExternalStore`, never web storage), render inside `DemoFrame`. See `docs/demos.md`.
- Placeholder copy must be marked `[Placeholder]`; never invent clients, outcomes, metrics or personal details. Outstanding content is listed in `docs/phase-2-content-needs.md`.
- Phase 1 is `noindex` (root `<meta name="robots">` + Netlify `X-Robots-Tag`). Never add an SPA catch-all redirect in Netlify; unknown URLs must stay 404.
