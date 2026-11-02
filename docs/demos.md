# Demos

A "view" in a project is either a placeholder panel or a working interactive demo. Both render inside `DemoFrame`, a light application panel inside the dark editor shell. The only demo so far is `office-booking-calendar` (`app/demos/office-booking-calendar/`, fixtures in `app/fixtures/office-booking-calendar.ts`). Use it as the reference implementation.

## Register a new demo

Example: turn `employee-directory` (project `hybrid-wp-react-intranet`) into a demo.

1. **Create the demo folder** `app/demos/employee-directory/` with a prop-less component, its CSS Module, and an `index.ts` that default-exports it (as `office-booking-calendar/index.ts` does):

   ```ts
   export { EmployeeDirectory as default } from "./EmployeeDirectory";
   ```

2. **Add fictional fixtures** in `app/fixtures/employee-directory.ts` (a single file, or a folder with an `index.ts`).
3. **Register it** in `app/demos/index.ts`: import the component and add one entry to `demoDefinitions`.

   ```ts
   const demoDefinitions = {
     "office-booking-calendar": {
       component: OfficeBookingCalendar,
       meta: `${WEEK_LABEL} · ${FLOOR_LABEL}`,
       description: "Interactive example with fictional reservations; nothing is saved",
     },
     "employee-directory": {
       component: EmployeeDirectory,
       description: "Interactive example with fictional staff; nothing is saved",
     },
   } satisfies Record<string, DemoDefinition>;
   ```

   `component` is required, `description` is the line beside the "Sample data" pill, and `meta` (optional) is the text on the right of the panel header; it defaults to the project title. Imports are static so the prerendered HTML contains the demo.
4. **Point the view at it** in `app/content/projects.ts` by adding `demoId` to the view (the registry then gives it `kind: "demo"` and `content: { type: "demo", demoId }`):

   ```ts
   { slug: "employee-directory", title: "Employee Directory", demoId: "employee-directory" },
   ```

5. **Remove its placeholder copy** from `viewPlaceholders` in `app/content/view-placeholders.ts`. `view-placeholders.test.ts` fails on stale keys.
6. **Update counts and docs:** the Type cell in that project's README "Views in this project" table (`Interactive demo (sample data)`), and the hard-coded numbers in `registry.test.ts` (1 demo) and `view-placeholders.test.ts` (16 placeholder views). Run `npm test` and `npm run test:e2e` to find any other count assertions.
7. **Add tests** (below). Nothing in the shell, routes or search changes: routes, explorer, breadcrumbs, search and prerendering all come from the registry.

If a `demoId` has no definition, or a demo entry is left unreferenced, `demos/index.test.ts` fails, and the view loader throws at build time.

## The DemoFrame contract

`app/routes/view.tsx` renders every view as:

```tsx
<DemoFrame title={entry.title} meta={demo.meta ?? project?.title} description={demo.description}>
  <demo.component />
</DemoFrame>
```

- The frame supplies the page `h1` (the entry title), the "Sample data" badge, the description line and the light WCAG-AA palette (`color-scheme: light`, scoped to the panel). **A demo renders only the panel body**: do not render its own `h1`, title, or sample-data label; start headings at `h2`.
- The demo must also say in its own body text that data is fictional and not saved (the booking demo has a `note` paragraph).
- Components receive no props. Everything they need comes from their fixtures and local code.
- Style with a CSS Module inside the demo folder. Tables and other defaults are scoped to `.md-content` in `global.css`, so demo tables start unstyled and need their own CSS.

## Fixtures

- Put synthetic data in `app/fixtures/` (kept apart from the components). It must be fictional: no real people, clients, companies or records.
- Hard-code dates and values instead of using `new Date()` or `Math.random()`. The prerendered HTML and the first client render must match, or hydration warns (the e2e hydration test fails on console warnings). The booking fixture pins one week for this reason.

## State: memory only

- Never use `localStorage`, `sessionStorage`, cookies or IndexedDB, and make no network requests. The contact e2e spec asserts this for the terminal; the booking demo relies on the same rule by design.
- Keep state in a small module-level store consumed with `useSyncExternalStore`, as `app/demos/office-booking-calendar/store.ts` does. It survives client-side navigation (the module stays loaded) and resets on a full page load. Provide a `getServerSnapshot` that returns the fixture state so the prerendered HTML and first render match.
- Offer a visible "Reset demo" control that restores the fixtures.
- Keep the rules in a pure module (`booking.ts`) so they can be unit tested without the DOM.

## Accessibility checklist

- Use semantic elements: a real `<table>` for tabular data, `<button>` for actions, labelled form controls. No `div` buttons.
- Every control is reachable and operable by keyboard with a visible focus ring; no keyboard traps.
- Announce results of actions through a polite live region. Use `useRepeatableAnnouncement` from `app/lib/announce.ts` so identical consecutive messages are still announced.
- Cell and button names are specific (for example "Reserve Desk B1 on Tuesday 3 November").
- Do not rely on colour alone; keep contrast at WCAG AA (the frame's palette already passes).
- Wide content scrolls inside its own focusable region and the page never scrolls sideways at 360px.
- Respect `prefers-reduced-motion`: no real transitions or animations when it is set (e2e checks this for the shell and demo).
- The demo must render and make sense in the prerendered HTML (no JavaScript).

## Testing expectations

- **Unit (Vitest):** pure logic (`booking.test.ts`), the store (`store.test.ts`), and component announcements/behaviour with Testing Library (`OfficeBookingCalendar.test.tsx`, which starts with `// @vitest-environment jsdom`). Reset the store in `afterEach`.
- **E2E (Playwright):** a spec like `e2e/booking.spec.ts` covering prerendered content, keyboard-only use, announcements, persistence across navigation, reload restoring fixtures, and a 360px layout.
- **Accessibility:** `e2e/a11y.spec.ts` runs axe over every registry route at 1440px and 360px automatically, so a new demo route is audited without changes; add interactive states to it if the demo has meaningful ones.

See [testing.md](testing.md) for commands.
