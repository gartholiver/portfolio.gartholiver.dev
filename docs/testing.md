# Testing

Two layers: fast **Vitest** unit/component tests in `app/`, and **Playwright** end-to-end tests in `e2e/` that run against the static production build.

## Commands

```bash
npm run typecheck                          # react-router typegen && tsc
npm test                                   # all Vitest tests (vitest run)
npm run test:watch                         # Vitest in watch mode
npm run test:e2e                           # npm run build && playwright test
```

First time only: `npx playwright install chromium`.

### Run a single spec

```bash
npx vitest run app/lib/search.test.ts                   # one unit file
npx vitest run -t "re-announces"                        # by test name
npm run build && npx playwright test e2e/booking.spec.ts   # one e2e file (after building)
npx playwright test e2e/booking.spec.ts -g "reserve"       # by title (build already up to date)
```

`npx playwright test` does **not** build; it serves whatever is in `build/client`. Rebuild after any source or content change, or use `npm run test:e2e -- e2e/booking.spec.ts`, which builds and forwards the arguments to Playwright.

## The shared `build/` directory

E2E tests, `npm run preview` and `npm run build` all use `build/client`, and Playwright serves it on port 4173 (`playwright.config.ts` `webServer` runs `npm run preview` and reuses an already running server locally). Consequences:

- Do not run `npm run build` while Playwright is running, and do not run two e2e runs at once: a build rewrites the directory under the server.
- A running `npm run preview` on 4173 will be reused by Playwright, so make sure it serves a current build.
- `build/`, `.react-router/` and `test-results/` are git-ignored.

## Unit tests (`app/**/*.test.ts(x)`)

Node environment by default; a file that renders React adds `// @vitest-environment jsdom`. Setup is in `vitest.setup.ts`; config in `vitest.config.ts` (separate from `vite.config.ts` so the React Router plugin does not run).

| Area | Files | Covers |
| --- | --- | --- |
| Registry and routing | `app/content/registry.test.ts` | unique ids/paths/URLs, expected entry counts, URL mapping, every URL routes to the right module, unknown URLs hit the catch-all, prerender paths, Markdown files exist and are all registered, explorer tree order, breadcrumbs, search sources |
| View placeholders | `app/content/view-placeholders.test.ts` | copy exists for exactly the non-demo views, is distinct, marked `[Placeholder]` and free of figures |
| Demos | `app/demos/index.test.ts`, `app/demos/office-booking-calendar/*.test.ts(x)` | demo registry matches the content registry; booking rules, store, announcements |
| Markdown | `app/lib/markdown/render.test.ts`, `toc.test.ts` | frontmatter, callouts, GFM, heading ids, TOC, link and table enhancements |
| Search | `app/lib/search.test.ts` | folding, AND matching, ranking, snippets and highlights |
| Links and a11y helpers | `app/lib/internal-links.test.ts`, `announce.test.ts`, `stack-lines.test.ts` | client-side link interception, repeatable live-region text, stack JSON lines |
| Shell | `app/components/shell/*.test.ts(x)` | explorer state and rendering, shell context |
| Contact demo | `app/components/contact/contact-flow.test.ts`, `contact-store.test.ts` | the validation/step state machine and in-memory draft store |
| 404 | `app/routes/not-found.test.tsx` | the not-found page |

## End-to-end tests (`e2e/*.spec.ts`)

Chromium only, against the prerendered site served with Netlify-like 404 behaviour.

| Spec | Covers |
| --- | --- |
| `smoke.spec.ts` | hydration, client-side navigation, Markdown README, duplicate filenames, 404 status |
| `shell.spec.ts` | landmarks and skip link, explorer navigation and highlighting, mobile drawer (focus trap, Escape), terminal toggle, layout at several widths, reduced motion |
| `verification.spec.ts` | every registry entry via the explorer (title, h1, breadcrumbs, aria-current), anchors/deep links/history, search snippets, unknown URLs, hydration health (no console errors) on every route and width, keyboard-open viewports, focus visibility, reduced motion |
| `docs-views.spec.ts` | Markdown documents (properties, TOC, permalinks, internal links, tables), view pages and the demo frame |
| `pages-search.spec.ts` | home, about, stack, blog and the search page |
| `booking.spec.ts` | the office booking demo: table, reservations, announcements, keyboard, persistence, 360px |
| `contact.spec.ts` | the contact terminal: keyboard flow, validation, announcements, mobile, and no network/storage use |
| `prerender.spec.ts` | files in `build/client`, text present with JavaScript disabled, `404.html` |
| `a11y.spec.ts` | axe-core WCAG 2.0/2.1/2.2 A and AA audit |

### Accessibility audit

`e2e/a11y.spec.ts` loops over `routeEntries` from the registry at 1440px and 360px, plus a search-with-query page, the mobile drawer, shell states, contact terminal states and hover/focus states. No rules are disabled and nothing is excluded, so new registry entries are audited automatically and any violation fails. Axe covers only part of WCAG: keyboard use, focus order, announcements and reduced motion are asserted in the other specs, and a manual screen-reader pass is still recommended before launch.

## Expectations when changing things

- New or changed content: `npm test` (registry/Markdown tests) and `npm run build` (the build throws on missing Markdown, demos or placeholder copy).
- New project/view/demo: update the hard-coded counts called out in [content-registry.md](content-registry.md) and [demos.md](demos.md).
- Anything visual or interactive: `npm run test:e2e` before finishing.
