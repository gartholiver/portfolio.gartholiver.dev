# Phase 1: Editor-Inspired Portfolio Frontend

## Summary

Build a responsive portfolio from scratch using the supplied design brief and prototype. Visitors will explore projects through a file explorer, read formatted case studies, and interact with a sample booking calendar.

Use **React, TypeScript, and React Router with static prerendering**, hosted on Netlify. Phase 1 includes placeholder content, one working demo, and a simulated contact flow. Project research, real examples, blog publishing, and message delivery remain for phase 2.

The interface will use **single-page selection with an active file header**, replacing the prototype’s multiple tabs.

## Foundation and Content Structure

- Use React Router Framework Mode with Vite, CSS Modules, shared CSS design tokens, npm, and a committed lockfile.
- Generate every content route at build time with `ssr: false`; publish `build/client` to Netlify. This supports static hosting without a runtime server. [React Router prerendering documentation](https://reactrouter.com/how-to/pre-rendering)
- Preserve the brief’s complete explorer hierarchy: four projects, 17 view entries, eight project Markdown documents, and the home, about, blog placeholder, stack, search, and contact entries.
- Create a typed content registry containing stable IDs, explorer paths, display titles, URLs, page kinds, project associations, and content references. Use it to drive navigation, breadcrumbs, search, and prerendered routes.
- Store case-study copy in local Markdown, profile and stack information in structured data, and demo fixtures separately from components. No CMS or external data service.
- Keep editor filenames as interface labels while using clean URLs:

| Explorer entry | URL or behavior |
|---|---|
| Root `index.html` | `/` |
| Project `README.md` | `/portfolio/:project` |
| Project `technical-requirements.md` | `/portfolio/:project/technical-requirements` |
| Project view file | `/portfolio/:project/views/:view` |
| `docs/index.html` | `/docs` |
| `docs/about.html` | `/docs/about` |
| `package.json` | `/stack` |
| `search.tsx` | `/search` |
| `docs/contact.bash` | Opens and focuses the contact terminal alongside the current page |

## Interface and Behavior

**Editor shell**

- Follow the prototype’s charcoal surfaces, blue accents, subtle borders, Inter content typography, and JetBrains Mono interface typography. Self-host fonts and retain their licenses.
- Build a title bar, expandable explorer, active file header, breadcrumbs, content panel, collapsible contact terminal, and compact status bar.
- Folder controls expand or collapse; file links navigate. Direct links automatically reveal the selected file’s ancestors.
- Keep the shell mounted during navigation. Browser back/forward, direct links, refreshes, and Markdown section anchors must work.
- Use fixed panel dimensions: approximately 280px for the desktop explorer and 210px for the expanded terminal. Allow scrolling within panels.
- Below 900px, move the explorer into a dismissible navigation drawer and collapse the terminal initially. Opening contact reveals it beneath the content. Keep long filenames readable and contain wide tables within their own scroll regions.
- No tabs, draggable resizing, code editing, or saved workspace preferences.

**Pages and renderers**

- **Home:** open on first visit with a short portfolio introduction, four project links, exploration guidance, and a contact action.
- **Project documents:** render Markdown with readable headings, metadata, linked tables of contents, lists, tables, callouts, and links to related views. Support this limited display feature set without an Obsidian editor or plugin system.
- **Demo pages:** use the prototype’s light application panel inside the dark shell, with a title and explicit sample-data label.
- **Stack:** display curated JSON-style content with syntax coloring, line numbers, and plain-language explanations. Keep AI preferences visibly pending until supplied; this is separate from the application’s actual package manifest.
- **About:** provide a finished page layout with clearly marked biography and experience placeholders.
- **Blog:** provide a styled “coming in phase 2” empty state; no sample posts or publishing features.
- **Search:** search local titles, filenames, project names, tags, and document text. Show result context, working links, and empty/no-result states. Store the query in `?q=` for shareable searches.

**Booking demo and remaining views**

- Build one illustrative office-booking calendar using four desks, five weekdays, and a fixed sample week.
- Visitors can reserve an available desk as a fictional demo user, cancel their own reservation, and reset the demo. Existing fictional reservations cannot be overwritten.
- Keep reservations in memory across site navigation; refresh or reset restores the fixtures.
- Give the remaining 16 views distinct titles and explanatory placeholder panels. Do not invent their workflows before reviewing the actual projects.
- Isolate demo components and styles so phase 2 can replace or add examples without changing the site shell.

**Contact terminal**

- Follow the sequence: name → email → message → review → demo completion.
- Include required-field and email validation, correction controls, restart, visible Continue buttons, and keyboard submission. Support multiline messages.
- Preserve the draft while navigating or collapsing the panel, using memory only.
- Clearly state throughout that the form is a demonstration. Completion reads “Demo complete — nothing was sent.”
- Do not create network requests, Netlify Forms submissions, or stored contact records.

## Implementation Order and Verification

1. **Foundation:** scaffold the application, content registry, routes, placeholder documents, and Netlify build configuration.
2. **Shell:** implement navigation, responsive panels, active-page state, and keyboard/focus behavior.
3. **Content:** implement page renderers, home, about, stack, blog empty state, and search.
4. **Interactions:** implement the booking demo and guided contact flow.
5. **Validation and handoff:** verify the production build and document how phase 2 replaces content and registers demos.

Use TypeScript checks, focused Vitest tests, and Playwright browser checks to verify:

- Every explorer entry works; duplicate filenames in different projects resolve correctly.
- Direct URLs, refreshes, back/forward navigation, and document anchors select and display the correct content.
- Search finds expected content and handles empty or unmatched queries.
- Booking prevents conflicts, supports cancellation, preserves state during navigation, and resets correctly.
- Contact validates input, permits corrections, retains drafts during navigation, and sends nothing.
- Desktop and mobile layouts remain usable at 360px, 768px, and 1440px widths, including with the mobile keyboard open.
- Keyboard navigation, visible focus, drawer focus management, form announcements, contrast, and reduced-motion behavior meet WCAG 2.2 AA expectations.
- Prerendered HTML contains readable page content; hydration produces no errors; unknown URLs return a proper 404.

## Assumptions and Phase 2 Handoff

- Treat the prototype as the visual reference, rebuilding its interface as maintainable components.
- Use clearly identified placeholder copy and synthetic data. Do not invent client identities, outcomes, metrics, or personal preferences.
- Configure phase 1 builds as `noindex` while placeholder content remains.
- Deliver a Netlify-ready static build and setup instructions. Production deployment, domain changes, and migration of an existing site are outside this phase.
- Document the content registry, Markdown conventions, demo registration, and outstanding content needs. Phase 2 will supply project evidence, adapt real examples, complete personal content, implement the blog, and connect contact delivery.
