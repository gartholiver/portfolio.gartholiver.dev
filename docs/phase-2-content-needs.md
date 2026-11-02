# Phase 2 content needs

Everything below is placeholder or demo-only in phase 1. Real content must come from Garth or from the reviewed project evidence: never invent clients, outcomes, metrics, roles, dates or preferences. Tick items off as they ship.

How this list was built: search the repo for `[Placeholder]`, `placeholder`, `status: placeholder`, `pending`, "phase 2" and "nothing is sent" (`grep -rniE "\[placeholder\]|status: placeholder|pending|phase 2|nothing (is|was) sent" app content`). Re-run it before launch; when it finds nothing unexpected, the site is content-complete.

## 1. Project case studies (8 Markdown files)

Per project, in `content/projects/<id>/`. See [markdown-conventions.md](markdown-conventions.md). In each file: replace every `[Placeholder]` passage, replace the `> [!placeholder]` callout, set a real `status` (and remove `status: placeholder`), and review the `role`, `stack` and `summary` frontmatter.

| Project id | `README.md` | `technical-requirements.md` |
| --- | --- | --- |
| `hybrid-wp-react-intranet` | [ ] | [ ] |
| `headless-wp-educational-app` | [ ] | [ ] |
| `legal-doc-wp-ordering-system` | [ ] | [ ] |
| `multi-location-inventory-sales-system` | [ ] | [ ] |

README placeholders: `role`, `summary`, Overview (problem, approach), My role, Features highlights (3), Lessons learned. Technical-requirements placeholders: Architecture (platform, integrations), the Requirements table (all rows `[Placeholder]` / `Pending`), Data model, Performance, Accessibility. Also update the "Views in this project" Type column when views change.

Also in the registry (`app/content/registry.ts`): the shared `PLACEHOLDER` suffix ("Placeholder — content to be supplied in phase 2.") is appended to the `description` of every README, technical-requirements, placeholder view and the About entry. These descriptions feed `<meta name="description">` and search; replace them with real one-line descriptions. In `app/content/projects.ts`, each project has `status: "placeholder"`, and the titles were derived from folder names only: confirm or rewrite titles and `tags` once the projects are reviewed.

## 2. The 16 placeholder views

Each is an explorer view that currently shows a generic panel from `app/content/view-placeholders.ts`. For each, either build a demo with fictional data (see [demos.md](demos.md)) or write real, specific copy, then remove or replace its placeholder summary. Also update the shared wording in `viewPlaceholderCommon` (for example "Coming after the project is reviewed.") if any panels remain.

`hybrid-wp-react-intranet` (3 placeholders; `office-booking-calendar` is already a demo):

- [ ] `interactive-remote-employee-map`
- [ ] `employee-directory`
- [ ] `documentation-system`

`headless-wp-educational-app`:

- [ ] `lms-scorm-integration`
- [ ] `integrated-point-system`
- [ ] `trackable-award-system`
- [ ] `challenge-interface`

`legal-doc-wp-ordering-system`:

- [ ] `conditional-gf-woo-order-system`
- [ ] `custom-woo-extension-plugin`
- [ ] `custom-notification-system`
- [ ] `custom-user-dashboard`

`multi-location-inventory-sales-system`:

- [ ] `multi-location-inventory-sync`
- [ ] `custom-woo-extension-plugin`
- [ ] `custom-order-management`
- [ ] `user-profile-completion-wizard`
- [ ] `location-gated-products`

The existing demo, `office-booking-calendar`, uses fictional data by design (week of 2 Nov 2026); review whether it matches the real project once evidence is supplied.

## 3. Home (`app/data/home.ts`, `app/components/pages/HomePage.tsx`)

- [ ] `intro` ("[Placeholder] A short portfolio introduction...")
- [ ] `placeholderCallout` and the placeholder callout in `HomePage.tsx`; remove both when content is final
- [ ] `projectBlurbs`: one sentence per project (4 entries)
- [ ] Review `introNote`, `projectsIntro`, `exploreSteps` and `contactBody`: they describe the demo contact terminal and the placeholder panels and will go stale
- [ ] `HomePage.tsx` shows a hard-coded "status: placeholder content" line and builds the card text "N interactive demo" (hard-coded singular, so it reads wrongly once a project has more than one demo)

## 4. About (`app/data/profile.ts`, `app/components/pages/AboutPage.tsx`)

- [ ] `headline`
- [ ] `biography` (2 paragraphs)
- [ ] `experience` (3 entries: `period`, `role`, `summary`; add or remove entries as needed)
- [ ] Set `status` (currently the literal type `"placeholder"`, shown as a badge in the Profile aside) and remove the `PlaceholderBadge` slots ("Biography placeholder", "Experience placeholder") and the page's placeholder callout in `AboutPage.tsx`
- [ ] Registry description for `docs:about` (see section 1)

## 5. Stack (`app/data/stack.ts`, `app/components/pages/StackPage.tsx`)

- [ ] `description` and the `notes` strings that contain `[Placeholder]`
- [ ] `groups`: the three groups (`languages`, `frameworks`, `tools`) each hold one `[placeholder]` item; replace with real items (`name`, `value`, `note`) and write each group's `explanation`. Groups can be added or renamed.
- [ ] `aiPreferences`: `status: "pending"` and its notes. Supply Garth's real AI-tool preferences (the type allows only `"pending"` today, so widen `StackData["aiPreferences"]`).
- [ ] Remove the placeholder callout in `StackPage.tsx`; the "pending" styling is regex-driven on `pending|placeholder|to be supplied` and disappears once the text no longer matches.

## 6. Blog

- [ ] Decide the data model (Markdown posts in `content/` or a CMS) and implement the archive. Currently `app/components/pages/BlogPage.tsx` is a static empty state with a "Coming in phase 2" badge, at `/docs` (`docs:blog`, `content: { type: "data", key: "blog" }`, description "Blog archive — coming in phase 2.").
- [ ] Post pages need new registry entries or a new `PageKind` with a `MODULE_BY_KIND` entry (see [content-registry.md](content-registry.md)). Add posts to search (section 9).

## 7. Contact delivery

The contact terminal (`app/components/contact/*`) is a front-end demo: it validates and then shows "Demo complete — nothing was sent." Nothing is submitted, and `e2e/contact.spec.ts` asserts no form actions, Netlify Forms, storage or non-GET requests.

- [ ] Choose a delivery mechanism (Netlify Forms, a function, or an email service) and connect the `done` step of `contact-flow.ts` / `ContactTerminal.tsx` to it, with success and failure states, spam protection and privacy notice.
- [ ] Update every "demo / nothing is sent" string: `COMPLETION_TEXT` and the review/done hints in `contact-flow.ts`, the "Demo — nothing is sent" label in `ContactTerminal.tsx`, `SearchPage.tsx`, `home.ts` (`exploreSteps`, `contactBody`) and the `docs:contact` description in `registry.ts`.
- [ ] Rewrite the "nothing can be submitted" test in `e2e/contact.spec.ts` for the real behaviour.

## 8. Launch switches

- [ ] **Remove noindex:** delete `<meta name="robots" content="noindex, nofollow" />` in `app/root.tsx` and the `[[headers]]` `X-Robots-Tag` block in `netlify.toml`; change the "phase 1 · placeholder content · noindex" text in `app/components/shell/StatusBar.tsx`. Then consider a `robots.txt`, sitemap and per-page Open Graph meta (`app/content/meta.ts`).
- [ ] Production Netlify site, domain and any migration of the existing site (out of scope for phase 1; see the README).
- [ ] Check the `shell` branch label ("main") and other cosmetic editor details in `StatusBar.tsx` still make sense.

## 9. Search indexing of page text

`buildSearchIndex()` in `app/content/search-index.server.ts` indexes the **full body text only for Markdown documents**. Every other page (home, about, stack, blog, views, demos) is indexed by registry `title`, `label`, project, `tags` and `description` alone; for them `text` is just the description. Once real content exists:

- [ ] Write good registry `description`s for every non-Markdown entry (sections 1 and 2), or
- [ ] Extend `buildSearchIndex` to add text for `data` pages (home, profile, stack), view summaries (`view-placeholders.ts`) and blog posts. `SearchDocument.text` is the only field that needs to change; `app/lib/search.ts` ranks `text` last.
- [ ] Re-run `e2e/pages-search.spec.ts` and `e2e/verification.spec.ts` (search snippets) and update any expectation that depends on the placeholder text.
