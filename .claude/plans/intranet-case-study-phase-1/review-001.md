# Code Review: Hybrid WP + React Intranet — phase 1 case study + three demos

## Verdict: PASS

## Test Results
- Typecheck is clean, unit tests pass 285/285 and e2e tests pass 339/339. These numbers come from the coder; the reviewer is read-only and did not re-run them.
- Failed: none.
- Missing coverage: none material. Every test ID in plan §6 has a corresponding test, and the assertions check real behaviour, not just count bumps:
  - exact announcement strings
  - `document.activeElement`
  - per-viewer read state
  - marker box overlap at 360px
  - raw text alternation on repeated Reset

## What was checked

**Demo rules.** All three demos follow them:
- A grep for `Math.random|Date.now|new Date|localStorage|sessionStorage|document.cookie|indexedDB|fetch(` across the demos and `app/fixtures/intranet` finds nothing.
- `getServerSnapshot` returns the frozen `INITIAL_STATE`.
- `commit` notifies only when the state changes identity.
- Each demo has Reset and one polite `role="status"` region driven by `useRepeatableAnnouncement`.
- No demo renders an `<h1>`; headings start at h2.
- Each demo shows the sample-data note ("nothing is saved").
- Focus moves only for the actions listed in §4.4, through the per-demo `focusRequest` effect.
- All transitions and animations sit inside `@media (prefers-reduced-motion: no-preference)`. `@container` queries are used for layout only.
- Meaning never relies on colour alone (Locked/Available, Read, the Kudos/Announcement labels, the "You" text, the legend).

**Pure logic** (`onboarding.ts`, `notifications.ts`, `employee-map.ts`):
- Signatures and exact strings match the plan.
- Failed results return the same state object, and nothing throws.
- `markRead` and `markAllRead` copy `seen` instead of mutating it, so `INITIAL_SEEN` is safe even though it isn't frozen.
- `validateKudos` checks errors in the planned order.

**Registry:**
- The three helpers match §3.2.
- No other project sets `summary` or `description`, so their descriptions are byte-identical to before.
- `office-booking-calendar` is untouched.
- `projects.ts` and `registry.ts` still use relative imports only.

**Markdown:** both files match §4.5 verbatim.
- No client name, agency name or website.
- The only time reference is "early 2020s".
- Hosting is described as "managed WordPress hosting".
- No code fences or images. `wp_localize_script` appears once, as plain prose.
- Lessons learned sits in a single `> [!placeholder] Draft — awaiting review` callout, which is the README's only placeholder callout.

**"anonymised" search constraint:** the word appears in user-facing content only in the intranet README body. Its other occurrences are in places the search index never reads: a code comment in `projects.ts`, a test regex, and `docs/`.

## Architecture Compliance
- [✓] app/fixtures/intranet: compliant (records frozen with a `person()` helper)
- [✓] onboarding-wizard: compliant
- [✓] notification-center: compliant (heading and badge rendered as template strings; see the PLAN_GAP table)
- [✓] interactive-remote-employee-map: compliant
- [✓] registry, projects, view-placeholders and home: compliant
- [✓] docs, e2e and counts (33/32 and 19/4/15): compliant

## Fix List
Both items are optional and low priority; neither blocks.

### FIX-001 [LOW]
**Files:** app/demos/interactive-remote-employee-map/InteractiveRemoteEmployeeMap.tsx:261 and e2e/employee-map.spec.ts:184
**Issue:** Two regions are both named "People list": the `<section aria-labelledby="map-list-heading">` and the scroll `div[role="region"]`. Duplicate landmark names break an axe best-practice rule (not a WCAG AA failure). The e2e CSS-selector workaround hides the problem rather than fixing it.
**Fix:** In the component, change the scroller's `aria-label` to `"Table: People list"`, which matches the naming of Markdown table regions in `app/lib/markdown/render.ts`. In the e2e spec, use `getByRole("region", { name: "Table: People list" })`.

### FIX-002 [LOW, optional UX]
**File:** app/demos/notification-center/NotificationCenter.tsx:257 and :279
**Issue:** After a kudos validation error, the error message and `aria-invalid` stay on the field even after it is corrected, until the next submit. This is what the plan specified, so it is not a defect.
**Fix:** In the recipient and radio `onChange` handlers, clear `kudosError` when it belongs to that field. Add a jsdom test that checks the error disappears.

## PLAN_GAP Resolutions
| Gap | Resolution | Action |
|-----|-----------|--------|
| F6 regex `/token/` matches "Design tokens" | Sound. Only `design[- ]tokens?` is stripped. | None |
| docs-views wide-table check switched to `.last()` | Sound. The 3-column table is the last one. | None |
| Reduced-motion e2e thresholds | Sound. They match verification.spec.ts. | None |
| e2e "People list" locator was ambiguous | The workaround hides a duplicate name. | FIX-001 |
| SSR `<!-- -->` text splitting | Sound and standard. | None |
| "anonymised" acceptance grep not empty | Sound; the plan's grep was too strict. | None |
| `person()` helper for frozen PEOPLE | Sound. | None |
| `validateKudos` unknown sender | Sound. | None |
| Kudos error persists until the next submit | Follows the plan. | Optional FIX-002 |

## Sensitivity notes for Garth
- **Lessons learned.** Bullet 1 (an early return in the fan-out loop) and bullet 2 (credentials stored in the theme directory) publicly describe a bug and a security weakness in a past client's system. Decide whether to keep, soften or remove them.
- **Identifiability.** The integrations list (Okta SAML/SCIM, Google Calendar service account, Gravity Forms, BuddyPress, WP All Import, Sentry) together with "healthcare-sector, large remote workforce" is quite specific. Confirm you're comfortable with that level of detail.
- **Figures.** "About 20 slices", "around 26 endpoints" and "three years of Vue" are technical facts, not outcome metrics.

Verdict: PASS
