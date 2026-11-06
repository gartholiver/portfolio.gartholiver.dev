# gartholiver.dev

Editor-styled portfolio for Garth Oliver: a file explorer, open documents, light "demo" panels and a small contact terminal, rebuilt as maintainable React components.

- **Stack:** React Router v8 (Framework Mode) + Vite, TypeScript, CSS Modules.
- **Output:** fully static. `ssr: false` plus a `prerender` list means every route is built to HTML at build time and published from `build/client`.
- **Status:** phase 1. The shell, registry, Markdown pipeline, search, four working demos (`office-booking-calendar`, `onboarding-wizard`, `notification-center`, `interactive-remote-employee-map`) and the contact demo are done. The `hybrid-wp-react-intranet` case study is written; all other case-study text is placeholder copy and the site is `noindex`. See [docs/phase-2-content-needs.md](docs/phase-2-content-needs.md) for what phase 2 must supply.

## Requirements

- Node 24 (`.nvmrc`; `package.json` allows `>=22.22.0`). With nvm: `nvm use`.
- npm (a `package-lock.json` is committed).

## Commands

```bash
npm install            # install dependencies
npm run dev            # Vite dev server with HMR (http://localhost:5173)
npm run build          # prerender every route into build/client (+ 404.html)
npm run preview        # serve build/client on http://localhost:4173 (alias: npm start)
npm run typecheck      # react-router typegen && tsc
npm test               # Vitest unit tests (app/**/*.test.ts(x))
npm run test:e2e       # builds, then runs Playwright against the static build
```

`npm run preview` uses `serve` with `serve.json` (`"directoryListing": false`) so it behaves like Netlify: unknown URLs get `404.html` with a 404 status and no directory listings. The first Playwright run may need `npx playwright install chromium`. See [docs/testing.md](docs/testing.md).

## Project structure

```
app/
  content/      registry.ts + projects.ts (single source of truth), view-placeholders.ts,
                *.server.ts (build-time Markdown loading and search index)
  routes.ts     route config, generated from the registry
  routes/       route modules (shell layout, markdown-doc, view, home, about, ...)
  components/   shell/ (explorer, title bar, status bar, terminal), markdown-doc/, demo-frame/,
                pages/ (home, about, stack, blog, search), contact/ (terminal demo)
  demos/        interactive demos, one folder per demo id, registered in demos/index.ts
  fixtures/     synthetic sample data for the demos
  data/         home.ts, profile.ts, stack.ts (structured page copy)
  lib/          markdown/ (render pipeline), search.ts, internal-links.ts, ...
  styles/       tokens.css (design tokens), global.css, fonts.css
content/projects/<project-id>/   README.md and technical-requirements.md per project
e2e/            Playwright specs (run against build/client)
public/fonts/   font licences (the fonts themselves are bundled from @fontsource-variable)
docs/           guides for extending the site
netlify.toml    build and header configuration
serve.json      local preview configuration
```

## Documentation

| Guide | Read it to |
| --- | --- |
| [docs/content-registry.md](docs/content-registry.md) | add a project, document or view; understand URL mapping |
| [docs/markdown-conventions.md](docs/markdown-conventions.md) | write case-study Markdown (frontmatter, callouts, tables, links) |
| [docs/demos.md](docs/demos.md) | turn a placeholder view into an interactive demo |
| [docs/phase-2-content-needs.md](docs/phase-2-content-needs.md) | see every placeholder that needs real content |
| [docs/testing.md](docs/testing.md) | run and extend the unit and e2e tests |

`CLAUDE.md` holds the short conventions summary for coding agents.

## Deploying to Netlify

Production deploy and domain changes are out of scope for phase 1; this is the setup to use when you are ready.

1. In Netlify choose **Add new site, Import an existing project** and connect the Git repository.
2. The build settings come from `netlify.toml`, so the UI can stay on its defaults. They are:
   - Build command: `npm run build`
   - Publish directory: `build/client`
   - Node version: `NODE_VERSION = "24"` (matches `.nvmrc`)
3. Deploy. No environment variables are required.

What `netlify.toml` already configures:

- **`X-Robots-Tag: noindex, nofollow`** on every response (`[[headers]]` for `/*`). Together with `<meta name="robots" content="noindex, nofollow">` in `app/root.tsx` this keeps phase 1 out of search indexes. Remove both when real content ships (also the "noindex" text in `app/components/shell/StatusBar.tsx`).
- **404 handling.** The catch-all route is prerendered at `/404`, and `buildEnd` in `react-router.config.ts` copies `404/index.html` to `404.html`. Netlify serves a root `404.html` for unknown URLs with a 404 status automatically. **Do not add** a `/* /index.html 200` redirect or SPA fallback: it would turn real 404s into 200s.

Check on the first deploy:

- **Trailing slashes / Pretty URLs.** React Router prerenders each route as `<path>/index.html` (for example `portfolio/hybrid-wp-react-intranet/index.html`), and links use clean URLs without a trailing slash. Netlify's Pretty URLs setting (Site configuration, Build and deploy, Post processing) should be left on, which is the default, and then both `/stack` and `/stack/` resolve. Visit a few deep URLs directly (`/portfolio/hybrid-wp-react-intranet/technical-requirements`, `/search?q=wordpress`), confirm `/does-not-exist` returns a 404 status, and confirm the `X-Robots-Tag` header is present.
- The build also emits `__spa-fallback.html` and per-route `*.data` files (loader data for client-side navigation). The fallback file is not used by anything; leave it unreferenced (see the 404 note above).
