# gartholiver.dev

Editor-styled portfolio. React Router v8 Framework Mode + Vite + TypeScript, fully static (`ssr: false`, every route prerendered), deployed to Netlify from `build/client`. Plan: `.claude/plans/initial-dev-plan.md`.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — prerender everything to `build/client` (+ `404.html`)
- `npm run typecheck` — `react-router typegen && tsc`
- `npm test` — Vitest (unit; `app/**/*.test.ts(x)`, node env; add `// @vitest-environment jsdom` for DOM tests)
- `npm run test:e2e` — builds, then Playwright against the static build (`e2e/`)
- `npm run preview` / `npm start` — serve `build/client` on :4173 (404.html → 404 status, like Netlify)

## Structure

- `app/content/registry.ts` — **single source of truth** for explorer entries, URLs, page kinds, project associations and content refs. Helpers: `buildExplorerTree`, `getEntryByPathname`, `getEntryById`, `getAncestors`, `getBreadcrumbs`, `getPrerenderPaths`, `getSearchSources`. `react-router.config.ts` imports it, so keep it free of Vite-only imports (no `?raw`, CSS, `import.meta.glob`, `~/` alias).
- `app/content/projects.ts` — the 4 projects and their views (folder names = URL slugs).
- `app/content/*.server.ts` — build-time only (Markdown loading, search index). Import only from route `loader`s.
- `app/lib/markdown/render.ts` — unified/remark/rehype pipeline: YAML frontmatter, GFM, heading ids (github-slugger), TOC (h2/h3), callouts.
- `app/routes.ts` — route config; `app/routes/shell.tsx` is the persistent layout (editor shell goes here); `routes/not-found.tsx` is the `*` catch-all.
- `content/projects/<project-id>/{README,technical-requirements}.md` — case-study Markdown.
- `app/data/` — structured profile/stack/home data. `app/demos/<demo-id>/` — demo components; `app/fixtures/<demo-id>/` — their synthetic data.
- `app/styles/tokens.css` — design tokens (CSS custom properties); components use CSS Modules (`*.module.css`).

## Conventions

- Adding a page: add a registry entry (and route in `app/routes.ts` if it's a new kind). Prerendering, explorer and search pick it up. `registry.test.ts` checks every URL hits a real route.
- Route loaders run only at build time; use `requireEntry(url)` to resolve the entry. Loaders are not allowed on non-prerendered paths (`ssr: false`).
- Markdown: frontmatter `title`, `role`, `stack`, `status`, `summary`; callouts use `> [!note|info|tip|warning|placeholder] Optional title`; link to pages by clean URL (`/portfolio/<id>/views/<view>`). Raw HTML is dropped.
- Placeholder copy must be marked `[Placeholder]` — never invent clients, outcomes, metrics or personal details.
- Phase 1 is `noindex` (root `<meta name="robots">` + Netlify `X-Robots-Tag`). Never add an SPA catch-all redirect in Netlify — unknown URLs must stay 404.
