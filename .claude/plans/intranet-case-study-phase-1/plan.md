# Implementation plan: Hybrid WordPress + React Intranet, phase 1 case study and three demos

> Save to `.claude/plans/intranet-case-study-phase-1/plan.md`. Working directory: `/Users/garth/Sites/gartholiver.dev/.claude/worktrees/hybrid-wp-react-intranet-31942e`. **Do not commit.** The README "Lessons learned" section is an unapproved draft, and Garth approves it before anything is committed.

---

## 1. Overview

### What we're building
1. **Case-study content** for project `hybrid-wp-react-intranet`: real `README.md` and `technical-requirements.md` with no code samples and no images. It is anonymised: the client is "a healthcare-sector company with a large remote workforce", the timeframe is "early 2020s" and the hosting is "managed WordPress hosting".
2. **Three new interactive demos** that share one set of fictional fixtures (`app/fixtures/intranet/`):
   - `onboarding-wizard`: a stepped onboarding flow with progress, Back/Next/Complete, and a mock dashboard navigation that unlocks when the flow is completed.
   - `notification-center`: a "Viewing as" selector, targeted notifications, unseen and seen lists, mark-as-read and mark-all-as-read, an unread badge, a kudos form and an activity feed.
   - `interactive-remote-employee-map`: an inline SVG outline with HTML `<button>` markers, a profile card, a department filter, a table alternative and a "You" marker.
3. **Registry support for real descriptions.** Add `Project.summary?` and `ProjectView.description?`. Set the project's `status: "final"`.
4. **Copy, docs and tests**: update the home blurb, placeholder copy, docs, every hard-coded count, the existing e2e/unit assertions that depend on the old placeholder text, and add new unit and e2e tests.

### Final view order (unchanged from the brief)
1. `onboarding-wizard` (demo)
2. `notification-center` (demo)
3. `interactive-remote-employee-map` (demo)
4. `office-booking-calendar` (existing demo, unchanged)
5. `employee-directory` (placeholder)
6. `documentation-system` (placeholder)

Rationale: the order follows a new user's journey (onboard, get notified, find people, book space). The finished demos come first and the placeholders last.

### Resulting totals (checked against the current formulas)
| | Now | After |
|---|---|---|
| Views (`view` + `demo`) | 17 | **19** |
| Demos | 1 | **4** |
| Placeholder views | 16 | **15** |
| Markdown docs | 8 | **8** |
| Entries | 31 (17+8+6) | **33** (19+8+6) |
| Routes / prerender paths | 30 (17+8+5) | **32** (19+8+5) |

### Key architectural decisions
- **Decision (map rendering):** The map is a `div` with a fixed aspect ratio (`aspect-ratio: 3 / 2`). It contains a decorative `<svg aria-hidden="true">` outline (viewBox `0 0 600 400`). Each marker is an absolutely positioned HTML `<button>` at `left = x/600`, `top = y/400` (percentages). This gives real buttons, a standard focus ring and no SVG focus quirks.
- **Decision (axe `target-size`, WCAG 2.2 AA, already run by `e2e/a11y.spec.ts`):** Colleague markers are 24×24 px. The "You" marker is a pill 24 px tall and at least 40 px wide. Fixture coordinates must satisfy, for every pair, `|dx| ≥ 70 || |dy| ≥ 60` viewBox units, and for the demo user `|dx| ≥ 80 || |dy| ≥ 60`. That keeps markers apart at the narrowest map width (about 270 px at a 360 px viewport, scale ≈ 0.45). The rule is unit-tested and also e2e-tested at 360 px.
- **Decision (fictional geography):** Locations are fictional town names on a fictional landmass with four fictional regions. Real city names on an abstract outline would imply real geography. The label pattern is `"<Name>, <Department>, near <City>"`.
- **Decision (state):** Each demo has a pure rules module, a module-level store (`create*Store` plus a shared instance, `getServerSnapshot` returns the frozen `INITIAL_STATE`) and a component, exactly like `office-booking-calendar`. UI-only transient state stays in component `useState`: kudos form draft and error, onboarding slide direction, map "opened from" source, focus requests. It does not need to survive navigation.
- **Decision (focus management):** Each component uses the same local pattern: `const [focusRequest, setFocusRequest] = useState<{ ids: readonly string[]; seq: number } | null>(null)` and a `useEffect(() => { … }, [focusRequest])` that focuses the first `document.getElementById(id)` that exists. Nothing is focused on mount, on Reset or on viewer/filter change. Focus moves only on the actions listed per demo. The pattern is copied into each demo so the demos stay self-contained (per `docs/demos.md`); there is no new shared lib.
- **Decision (registry descriptions):**
  - README description = `project.summary` when set, otherwise `Project summary for ${title}. ${PLACEHOLDER}`.
  - Technical-requirements description = `Technical requirements for ${title}. ${project.summary}` when set, otherwise `Technical requirements for ${title}. ${PLACEHOLDER}`.
  - View description = `view.description` when set, otherwise the current generated text.
  - Only the three new demos get a `description`. `office-booking-calendar` stays completely unchanged.
- **Decision (frontmatter status):** both intranet Markdown files use `status: published`, as `docs/markdown-conventions.md` suggests. `render.test.ts` is changed to expect `published` for projects with `status: "final"` and `placeholder` for the others.
- **Decision (Lessons learned):** the whole list sits *inside* one `> [!placeholder] Draft — awaiting review` callout under `### Lessons learned`. It is the README's **only** `placeholder` callout, so the existing e2e locator `aside.callout[data-callout="placeholder"]` stays unique.
- **Decision (search constraint):** `e2e/pages-search.spec.ts` expects exactly 4 results for `anonymised`, and the intranet result must be the README matched in document text. So the lowercase word `anonymised` appears **only** in the intranet README body; its first occurrence is lowercase. It must **not** appear in `technical-requirements.md`, `projects.ts` summary/descriptions, `view-placeholders.ts`, demo descriptions or demo copy.
- **Decision (heading uniqueness):** existing e2e tests use substring heading/link lookups. In the README, no heading other than the original one may contain "Overview", "The problem", "My role", "Views in this project" or "Lessons learned". In the technical requirements, none may contain "Data model" or "Performance and accessibility". The README has exactly one link named `technical-requirements.md` and one named `employee-directory.html`. The technical requirements have exactly one link named `README.md`, exactly one `info` callout, and exactly one table column header containing "Requirement".
- **Decision (placeholder panels):** `viewPlaceholderCommon` stays unchanged ("Coming after the project is reviewed."); other projects share it and e2e asserts it.
- **Decision (layout):** demo layouts switch on container width (`container-type: inline-size` on the demo root, `@container (min-width: 640px)`), not viewport width, because the explorer sidebar changes the available width.
- **Decision (Mark all as read):** the button is always enabled. When nothing is unread it announces instead of being disabled.
- **Decision (map filter vs selection):** changing the department filter does not close an open profile.
- **Decision (list order):** notification lists and the people list use fixture order (newest first for notifications).
- **Decision (Back on step 1):** the onboarding Back button is `disabled` on step 1. Focus is on the heading after every move, so it is never lost.

### Out of scope
- `employee-directory` and `documentation-system` demos. Only their placeholder summaries are rewritten.
- Any change to `office-booking-calendar` (code, fixtures, tests, registry entry).
- Lazy-loading or IntersectionObserver in the map demo. It is described in the copy only.
- A marquee or animated feed. The feed is a static list.
- Other projects' content, `viewPlaceholderCommon`, the status bar text, noindex, Netlify config.
- New `PageKind`s or route modules.
- Committing.

---

## 2. File Structure

```
app/
├── content/
│   ├── projects.ts                      # [MODIFY] summary?/description? fields; intranet status final, summary, new views+order
│   ├── registry.ts                      # [MODIFY] describeReadme/describeTechnicalRequirements/describeView; use them in projectEntries()
│   ├── registry.test.ts                 # [MODIFY] counts 19/4/33/32; description tests; view order test
│   ├── view-placeholders.ts             # [MODIFY] remove map key; rewrite directory+documentation summaries; header comment
│   └── view-placeholders.test.ts        # [MODIFY] 16 → 15 (3 places)
├── data/
│   └── home.ts                          # [MODIFY] intranet blurb; placeholderCallout wording; header comment
├── demos/
│   ├── index.ts                         # [MODIFY] register 3 demos
│   ├── index.test.ts                    # [MODIFY] 4 demos resolve; DEMO_IDS length 4
│   ├── onboarding-wizard/
│   │   ├── index.ts                     # [CREATE] default export
│   │   ├── onboarding.ts                # [CREATE] pure rules
│   │   ├── onboarding.test.ts           # [CREATE]
│   │   ├── store.ts                     # [CREATE]
│   │   ├── store.test.ts                # [CREATE]
│   │   ├── OnboardingWizard.tsx         # [CREATE]
│   │   ├── OnboardingWizard.module.css  # [CREATE]
│   │   └── OnboardingWizard.test.tsx    # [CREATE] jsdom
│   ├── notification-center/
│   │   ├── index.ts                     # [CREATE]
│   │   ├── notifications.ts             # [CREATE] pure rules
│   │   ├── notifications.test.ts        # [CREATE]
│   │   ├── store.ts                     # [CREATE]
│   │   ├── store.test.ts                # [CREATE]
│   │   ├── NotificationCenter.tsx       # [CREATE]
│   │   ├── NotificationCenter.module.css# [CREATE]
│   │   └── NotificationCenter.test.tsx  # [CREATE] jsdom
│   └── interactive-remote-employee-map/
│       ├── index.ts                     # [CREATE]
│       ├── employee-map.ts              # [CREATE] pure rules
│       ├── employee-map.test.ts         # [CREATE]
│       ├── store.ts                     # [CREATE]
│       ├── store.test.ts                # [CREATE]
│       ├── InteractiveRemoteEmployeeMap.tsx         # [CREATE]
│       ├── InteractiveRemoteEmployeeMap.module.css  # [CREATE]
│       └── InteractiveRemoteEmployeeMap.test.tsx    # [CREATE] jsdom
├── fixtures/
│   ├── index.ts                         # [MODIFY] comment only: mention shared folder app/fixtures/intranet/
│   └── intranet/
│       ├── index.ts                     # [CREATE] re-exports
│       ├── people.ts                    # [CREATE] departments, teams, regions, people, lookups
│       ├── map.ts                       # [CREATE] viewBox constants + outline path
│       ├── onboarding.ts                # [CREATE] steps + dashboard nav items
│       ├── notifications.ts             # [CREATE] notifications, viewers, initial seen, kudos presets, feed
│       └── intranet.test.ts             # [CREATE] fixture integrity + spacing + sensitivity guard
└── lib/markdown/render.test.ts          # [MODIFY] status expectation per project status

content/projects/hybrid-wp-react-intranet/
├── README.md                            # [MODIFY] full rewrite (copy in §4.5)
└── technical-requirements.md            # [MODIFY] full rewrite (copy in §4.5)

e2e/
├── onboarding-wizard.spec.ts            # [CREATE]
├── notification-center.spec.ts         # [CREATE]
├── employee-map.spec.ts                 # [CREATE]
├── docs-views.spec.ts                   # [MODIFY] README/TECH expectations
├── prerender.spec.ts                    # [MODIFY] README sentence
├── verification.spec.ts                 # [MODIFY] 33/32; add demo URLs to focus + reduced-motion lists
└── a11y.spec.ts                         # [MODIFY] interactive states + hover/focus targets for new demos

docs/
├── demos.md                             # [MODIFY]
├── content-registry.md                  # [MODIFY]
├── phase-2-content-needs.md             # [MODIFY]
└── testing.md                           # [MODIFY]
README.md                                # [MODIFY] status line
```

**Verified: no change needed** (they reference slugs or URLs that still exist): `app/components/shell/explorer-state.test.ts`, `app/components/shell/Explorer.test.tsx`, `app/lib/internal-links.test.ts`, `app/lib/search.test.ts` (synthetic docs), `app/content/validate-links.test.ts` (mock anchors), `e2e/booking.spec.ts` (still navigates to the `employee-directory` placeholder), `e2e/shell.spec.ts`, `e2e/smoke.spec.ts`, `e2e/pages-search.spec.ts` (stays green only if the `anonymised` constraint in §1 holds).

---

## 3. Interfaces & Signatures

TypeScript conventions: match the existing code (double quotes, semicolons, 2-space indentation, `as const`, `Object.freeze` for initial state, `~/` alias in app code, **relative imports only** in `projects.ts` and `registry.ts`). The codebase uses `!` on indexed access, so assume `noUncheckedIndexedAccess`.

### 3.1 `app/content/projects.ts`

```ts
export interface ProjectView {
  slug: string;
  title: string;
  demoId?: string;
  /** Real one-line description (search + <meta name="description">). Replaces the generated text when set. */
  description?: string;
}

export interface Project {
  id: ProjectId;
  folder: string;
  title: string;
  tags: string[];
  status: "placeholder" | "final";
  /** Real one-line project summary. When set, README and technical-requirements descriptions use it instead of the placeholder suffix. */
  summary?: string;
  views: ProjectView[];
}
```

Intranet project object. Keep `id`, `folder`, `title`, `tags: ["WordPress", "React", "Intranet"]` and set the rest exactly as follows:
```ts
status: "final",
summary:
  "An intranet for a healthcare-sector company with a large remote workforce, built as a React single-page app inside a WordPress theme.",
views: [
  {
    slug: "onboarding-wizard",
    title: "Onboarding Wizard",
    demoId: "onboarding-wizard",
    description:
      "Interactive demo: a step-by-step onboarding flow with a progress bar, Back and Next, and a dashboard navigation that unlocks on completion. Fictional sample data.",
  },
  {
    slug: "notification-center",
    title: "Notification Center",
    demoId: "notification-center",
    description:
      "Interactive demo: notifications targeted to everyone, to teams or to named people, with unseen and seen lists, mark as read and peer kudos. Fictional sample data.",
  },
  {
    slug: "interactive-remote-employee-map",
    title: "Interactive Remote Employee Map",
    demoId: "interactive-remote-employee-map",
    description:
      "Interactive demo: a keyboard-friendly map of approximate staff locations with a department filter, profile cards and a table alternative. Fictional sample data.",
  },
  { slug: "office-booking-calendar", title: "Office Booking Calendar", demoId: "office-booking-calendar" },
  { slug: "employee-directory", title: "Employee Directory" },
  { slug: "documentation-system", title: "Documentation System" },
],
```
Update the file header comment. Replace "Titles are expanded from the folder names only — no client names, outcomes or metrics." with: "Titles come from the folder names. Optional `summary`/`description` text must stay anonymised: no client or agency names, outcomes or metrics."

### 3.2 `app/content/registry.ts`

Add these exported pure helpers above `projectEntries()`. Import the types `Project` and `ProjectView` from `./projects`.

```ts
/** README description: the real summary when supplied, otherwise the placeholder text. */
export function describeReadme(project: Pick<Project, "title" | "summary">): string;
//   project.summary ?? `Project summary for ${project.title}. ${PLACEHOLDER}`

/** Technical-requirements description. */
export function describeTechnicalRequirements(project: Pick<Project, "title" | "summary">): string;
//   project.summary ? `Technical requirements for ${project.title}. ${project.summary}`
//                   : `Technical requirements for ${project.title}. ${PLACEHOLDER}`

/** View description: the authored description, else the generated demo/placeholder line. */
export function describeView(project: Pick<Project, "title">, view: Pick<ProjectView, "demoId" | "description">): string;
//   view.description ?? (view.demoId
//     ? `Interactive sample-data demo from ${project.title}.`
//     : `Placeholder view from ${project.title}. ${PLACEHOLDER}`)
```
In `projectEntries()`, replace the three inline description expressions with `describeView(project, view)`, `describeReadme(project)` and `describeTechnicalRequirements(project)`. Nothing else changes. These helpers never throw.

### 3.3 Fixtures: `app/fixtures/intranet/`

#### `people.ts`
```ts
export const DEPARTMENTS = [
  { id: "design", name: "Product Design" },
  { id: "engineering", name: "Engineering" },
  { id: "people-culture", name: "People & Culture" },
  { id: "operations", name: "Operations" },
  { id: "support", name: "Customer Support" },
] as const;
export type DepartmentId = (typeof DEPARTMENTS)[number]["id"];
export type Department = (typeof DEPARTMENTS)[number];

export const TEAMS = [
  { id: "design-systems", name: "Design Systems", departmentId: "design" },
  { id: "platform", name: "Platform", departmentId: "engineering" },
  { id: "web", name: "Web", departmentId: "engineering" },
  { id: "talent", name: "Talent & Onboarding", departmentId: "people-culture" },
  { id: "workplace-it", name: "Workplace & IT", departmentId: "operations" },
  { id: "support-desk", name: "Support Desk", departmentId: "support" },
] as const satisfies readonly { id: string; name: string; departmentId: DepartmentId }[];
export type TeamId = (typeof TEAMS)[number]["id"];
export type Team = (typeof TEAMS)[number];

export const REGIONS = ["Northern Region", "Central Region", "Coastal Region", "Southern Region"] as const;
export type Region = (typeof REGIONS)[number];

export const PERSON_IDS = [
  "p-avery", "p-sam", "p-priya", "p-marcus", "p-tomas", "p-lena",
  "p-grace", "p-noah", "p-hana", "p-diego", "p-ruth", "p-jordan",
] as const;
export type PersonId = (typeof PERSON_IDS)[number];

export interface Person {
  id: PersonId;
  firstName: string;
  lastName: string;
  title: string;
  departmentId: DepartmentId;
  teamId: TeamId;
  managerId: PersonId | null;
  /** Fictional town. */
  city: string;
  region: Region;
  /** Pre-offset (already generalised) marker position in map viewBox units (see map.ts). */
  map: { readonly x: number; readonly y: number };
}

export const PEOPLE: readonly Person[]; // exactly the table below, in this order, each Object.freeze'd
export const DEMO_USER_ID: PersonId = "p-jordan";

export function getPerson(id: string): Person | undefined;
export function getTeam(id: string): Team | undefined;
export function getDepartment(id: string): Department | undefined;
export function fullName(person: Pick<Person, "firstName" | "lastName">): string; // `${firstName} ${lastName}`
export function isPersonId(id: string): id is PersonId;
export function isDepartmentId(id: string): id is DepartmentId;
```

PEOPLE (order matters):

| id | firstName | lastName | title | departmentId | teamId | managerId | city | region | x | y |
|---|---|---|---|---|---|---|---|---|---|---|
| p-avery | Avery | Lin | Head of Product Design | design | design-systems | null | Harbor City | Coastal Region | 80 | 120 |
| p-sam | Sam | Okafor | Senior Product Designer | design | design-systems | p-avery | Westmoor | Coastal Region | 110 | 230 |
| p-priya | Priya | Raman | Head of Engineering | engineering | platform | null | Northfield | Northern Region | 250 | 70 |
| p-marcus | Marcus | Webb | Platform Engineer | engineering | platform | p-priya | Pine Ridge | Northern Region | 360 | 100 |
| p-tomas | Tomas | Ortega | Web Team Lead | engineering | web | p-priya | Lakeview | Central Region | 200 | 160 |
| p-lena | Lena | Kowalski | Front-End Developer | engineering | web | p-tomas | Riverton | Central Region | 300 | 190 |
| p-grace | Grace | Mensah | Head of People & Culture | people-culture | talent | null | Eastbrook | Northern Region | 480 | 80 |
| p-noah | Noah | Fischer | Onboarding Coordinator | people-culture | talent | p-grace | Granite Falls | Central Region | 430 | 200 |
| p-hana | Hana | Sato | Head of Operations | operations | workplace-it | null | Southport | Southern Region | 180 | 320 |
| p-diego | Diego | Alvarez | IT Support Analyst | operations | workplace-it | p-hana | Coral Bay | Southern Region | 300 | 300 |
| p-ruth | Ruth | Adeyemi | Head of Customer Support | support | support-desk | null | Highland Springs | Southern Region | 420 | 330 |
| p-jordan | Jordan | Reyes | Support Specialist | support | support-desk | p-ruth | Maple Grove | Central Region | 520 | 260 |

Department counts: design 2, engineering 4, people-culture 2, operations 2, support 2. Total 12.

#### `map.ts`
```ts
export const MAP_WIDTH = 600;
export const MAP_HEIGHT = 400;
/** Minimum distance (viewBox units) between a marker centre and the map edge. */
export const MAP_EDGE_MARGIN = 40;
/** Stylised, generic landmass outline. Decorative only; not a real place. */
export const MAP_OUTLINE_PATH =
  "M70 70 C140 30 260 34 340 44 C420 52 500 30 548 70 C590 104 572 170 566 220 C560 280 584 330 530 360 C470 392 380 372 300 378 C220 384 140 390 92 352 C44 314 52 250 40 196 C30 140 28 100 70 70 Z";
```

#### `onboarding.ts`
```ts
export interface OnboardingStep {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}
export const ONBOARDING_STEPS: readonly OnboardingStep[]; // 5 steps, exact copy below
export interface DashboardNavItem { id: string; label: string }
export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
  { id: "home", label: "Home" },
  { id: "news-events", label: "News & Events" },
  { id: "teams", label: "Teams" },
  { id: "directory-map", label: "Directory & Map" },
  { id: "office-hub", label: "Office Hub" },
  { id: "training-resources", label: "Training & Resources" },
];
```
ONBOARDING_STEPS (exact text):
1. `id: "welcome"`, title `"Welcome to the intranet"`, paragraphs:
   - "This is where the whole company meets: news, teams, people, training and office booking, all in one place."
   - "The tour only appears until you finish it. Use Next and Back to move between steps."
2. `id: "how-it-is-organised"`, title `"How the intranet is organised"`.
   - paragraphs: "Everything is reachable from the dashboard navigation once onboarding is complete."
   - bullets: "Home: company news, events and announcements." · "Teams: a space for your department and your team." · "Directory and map: find colleagues by name, team or approximate location." · "Office Hub: book a desk or a meeting room for the days you come in." · "Training and resources: courses, guides and documents."
3. `id: "your-profile"`, title `"Set up your profile"`, paragraphs:
   - "Check your job title, team and manager. Your direct reports are listed automatically."
   - "Add your city and region so colleagues can find you on the remote employee map. Only an approximate location is ever shown."
4. `id: "getting-help"`, title `"Where to find help"`, paragraphs:
   - "Support documentation is searchable and grouped by category."
   - "Questions about access or equipment go to the IT help desk from the Support page."
   - "Your manager is listed on your profile if you are not sure who to ask."
5. `id: "ready"`, title `"Ready to start"`, paragraphs:
   - "Choose Complete onboarding to finish the tour. The dashboard header and navigation unlock straight away."
   - "In this demo nothing is recorded: choose Reset demo to see the tour again."

#### `notifications.ts`
```ts
import type { PersonId, TeamId } from "./people";

export const NOTIFICATIONS_WEEK_LABEL = "Week of 2 Nov 2026";
export type NotificationKind = "news" | "notification";
export interface NotificationAudience {
  everyone: boolean;
  teamIds: readonly TeamId[];
  personIds: readonly PersonId[];
}
export interface IntranetNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Authoring team label (fictional). */
  from: string;
  /** Hard-coded display date, e.g. "Mon 2 Nov". */
  dateLabel: string;
  audience: NotificationAudience;
}
export const NOTIFICATIONS: readonly IntranetNotification[]; // table below, newest first

export const VIEWER_IDS = ["p-jordan", "p-lena", "p-noah"] as const;
export type ViewerId = (typeof VIEWER_IDS)[number];
/** Notifications each viewer has already read when the demo loads. */
export const INITIAL_SEEN: Readonly<Record<ViewerId, readonly string[]>> = {
  "p-jordan": ["n-wellbeing"],
  "p-lena": ["n-design-tokens", "n-wellbeing"],
  "p-noah": ["n-wellbeing"],
};

export const KUDOS_PRESETS = [
  { id: "high-five", label: "High Five" },
  { id: "great-job", label: "Great Job" },
  { id: "thank-you", label: "Thank You" },
] as const;
export type KudosPresetId = (typeof KUDOS_PRESETS)[number]["id"];
export type KudosPreset = (typeof KUDOS_PRESETS)[number];

export interface KudosFeedItem { id: string; kind: "kudos"; fromId: PersonId; toId: PersonId; presetId: KudosPresetId; dateLabel: string }
export interface AnnouncementFeedItem { id: string; kind: "announcement"; text: string; dateLabel: string }
export type FeedItem = KudosFeedItem | AnnouncementFeedItem;
export const INITIAL_FEED: readonly FeedItem[]; // below, newest first
```

NOTIFICATIONS (exact, in this order):

| id | kind | title | body | from | dateLabel | everyone | teamIds | personIds |
|---|---|---|---|---|---|---|---|---|
| n-all-hands | news | All-hands call moved to Thursday | The company all-hands call on Thursday now starts an hour later. The agenda is on the News page. | Internal Communications | Mon 2 Nov | true | [] | [] |
| n-support-rota | notification | New weekend rota for the Support Desk | Check the team calendar for your weekend shifts before Friday. | Customer Support | Mon 2 Nov | false | [support-desk] | [] |
| n-design-tokens | notification | Design tokens update ships Wednesday | Pull the latest component library before starting new pages. | Engineering | Mon 2 Nov | false | [web] | [] |
| n-onboarding-buddies | notification | Onboarding buddies needed | Volunteer to welcome a new starter during their first weeks. | People & Culture | Fri 30 Oct | false | [talent] | [] |
| n-security-refresher | notification | Complete the security refresher | A short refresher module is now in Training. Please finish it by the end of the month. | Workplace & IT | Fri 30 Oct | false | [support-desk, web] | [] |
| n-equipment-lena | notification | Your equipment request was approved | Your new monitor will be shipped to your home address. | Workplace & IT | Fri 30 Oct | false | [] | [p-lena] |
| n-welcome-jordan | notification | Welcome to the team, Jordan | Your manager has added you to the Support Desk team space. | People & Culture | Thu 29 Oct | false | [] | [p-jordan] |
| n-wellbeing | news | New wellbeing guides | Updated wellbeing guides are now under Resources. | People & Culture | Thu 29 Oct | true | [] | [] |

What each viewer starts with:

| Viewer | Targeted (in order) | Unseen | Unread |
|---|---|---|---|
| Jordan | all-hands, support-rota, security-refresher, welcome-jordan, wellbeing | all-hands, support-rota, security-refresher, welcome-jordan | **4** |
| Lena | all-hands, design-tokens, security-refresher, equipment-lena, wellbeing | all-hands, security-refresher, equipment-lena | **3** |
| Noah | all-hands, onboarding-buddies, wellbeing | all-hands, onboarding-buddies | **2** |

INITIAL_FEED (in this order):
1. `{ id: "f-welcome-support", kind: "announcement", text: "Welcome to everyone who joined Customer Support this week.", dateLabel: "Mon 2 Nov" }`
2. `{ id: "f-kudos-avery-sam", kind: "kudos", fromId: "p-avery", toId: "p-sam", presetId: "great-job", dateLabel: "Fri 30 Oct" }`
3. `{ id: "f-office-hub", kind: "announcement", text: "Desk booking for next week is open in the Office Hub.", dateLabel: "Thu 29 Oct" }`
4. `{ id: "f-kudos-grace-noah", kind: "kudos", fromId: "p-grace", toId: "p-noah", presetId: "thank-you", dateLabel: "Thu 29 Oct" }`

#### `index.ts`
```ts
export * from "./people";
export * from "./map";
export * from "./onboarding";
export * from "./notifications";
```

#### `app/fixtures/index.ts`
Comment only. Append: "Data shared by several demos lives in a folder with an index.ts (app/fixtures/intranet/ is used by the onboarding, notification and map demos)." Keep `export {};`.

### 3.4 Demo 1: `app/demos/onboarding-wizard/`

#### `onboarding.ts` (pure, no React)
```ts
import { DASHBOARD_NAV_ITEMS, ONBOARDING_STEPS, type OnboardingStep } from "~/fixtures/intranet";

export interface OnboardingState { readonly stepIndex: number; readonly completed: boolean }
export const INITIAL_STATE: OnboardingState = Object.freeze({ stepIndex: 0, completed: false });
export const TOTAL_STEPS: number = ONBOARDING_STEPS.length; // 5

export type MoveResult =
  | { ok: true; state: OnboardingState; stepIndex: number }
  | { ok: false; state: OnboardingState; reason: "at-first-step" | "at-last-step" | "completed" };
export type CompleteResult =
  | { ok: true; state: OnboardingState }
  | { ok: false; state: OnboardingState; reason: "not-at-last-step" | "already-completed" };

export interface ProgressInfo { current: number; total: number; percent: number; label: string }

export function getStep(state: OnboardingState): OnboardingStep;   // ONBOARDING_STEPS[state.stepIndex]!
export function isFirstStep(state: OnboardingState): boolean;      // stepIndex === 0
export function isLastStep(state: OnboardingState): boolean;       // stepIndex === TOTAL_STEPS - 1
export function isNavUnlocked(state: OnboardingState): boolean;    // state.completed
export function progress(state: OnboardingState): ProgressInfo;
//  not completed: current = stepIndex+1, label `Step ${current} of ${total}`
//  completed: current = total, label `All ${total} steps complete`
//  percent = Math.round(current / total * 100)
export function next(state: OnboardingState): MoveResult;     // completed → "completed"; last → "at-last-step"; else +1 (new object)
export function back(state: OnboardingState): MoveResult;     // completed → "completed"; first → "at-first-step"; else -1
export function complete(state: OnboardingState): CompleteResult; // completed → "already-completed"; !last → "not-at-last-step"; else { stepIndex, completed: true }
export function reset(): OnboardingState;                     // returns INITIAL_STATE (same object)
export function describeMove(result: MoveResult): string;
export function describeComplete(result: CompleteResult): string;
export const RESET_ANNOUNCEMENT = "Demo reset. Onboarding starts again at step 1.";
export { DASHBOARD_NAV_ITEMS };
```
Failed results return the **same** `state` object. No function throws.

Exact strings:
- `describeMove` ok: `` `Step ${n} of ${TOTAL_STEPS}: ${title}.` `` where `n` is the new step's 1-based index and `title` its title. Example: `"Step 2 of 5: How the intranet is organised."`
- at-first-step: `"You're already on the first step."`
- at-last-step: `"You're already on the last step. Choose Complete onboarding to finish."`
- completed: `"Onboarding is already complete."`
- `describeComplete` ok: `"Onboarding complete. The dashboard navigation is now unlocked."`
- not-at-last-step: `"Finish every step before completing onboarding."`
- already-completed: `"Onboarding is already complete."`

#### `store.ts`
```ts
export interface OnboardingStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): OnboardingState;
  getServerSnapshot(): OnboardingState; // always INITIAL_STATE
  next(): MoveResult;
  back(): MoveResult;
  complete(): CompleteResult;
  reset(): void;
}
export function createOnboardingStore(initial?: OnboardingState): OnboardingStore; // default INITIAL_STATE
export const onboardingStore: OnboardingStore;
```
Same `commit` pattern as `bookingStore`: notify only when the next state `!==` the current state.

#### `OnboardingWizard.tsx`
`export function OnboardingWizard()` is prop-less. Structure, in order:
1. Root: `<div className={styles.root} data-demo="onboarding-wizard">`.
2. `<p className={styles.note}>`: "Sample data: these onboarding steps are fictional and nothing is saved. Your progress is kept only while you browse this site; refreshing the page or choosing Reset demo starts the tour again."
3. Toolbar `<div className={styles.toolbar}>` containing:
   - `<p data-testid="onboarding-progress-label" className={styles.progressLabel}>{progress.label}</p>`
   - `<button type="button" className={styles.reset}>Reset demo</button>`. On click: `onboardingStore.reset(); setMotion(null); announce(RESET_ANNOUNCEMENT)`. No focus request.
4. Status: `<p role="status" aria-live="polite" aria-atomic="true" data-testid="onboarding-status" className={styles.status}>{message}</p>`, using `useRepeatableAnnouncement()`.
5. Card `<section className={styles.card} aria-labelledby={headingId}>`, where `headingId` is `"onboarding-step-heading"`, or `"onboarding-complete-heading"` once completed.
   - Progress bar: `<div role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={progress.current} aria-valuetext={progress.label} className={styles.track}><div className={styles.fill} style={{ width: `${progress.percent}%` }} /></div>`
   - If not completed:
     - `<div className={styles.stepViewport}>`
     - `<div key={step.id} className={styles.step} data-testid="onboarding-step" data-motion={motion ?? undefined}>`
     - `<h2 id="onboarding-step-heading" tabIndex={-1} className={styles.stepTitle}>{step.title}</h2>`
     - Each paragraph as `<p>`. Bullets, if any, as `<ul className={styles.bullets}>`.
     - Actions `<div className={styles.actions}>`:
       - `<button type="button" disabled={isFirstStep(state)}>Back</button>`
       - Then either `<button type="button" className={styles.primary}>Next</button>`, or on the last step `<button type="button" className={styles.primary}>Complete onboarding</button>` instead of Next.
   - If completed:
     - `<h2 id="onboarding-complete-heading" tabIndex={-1}>Onboarding complete</h2>`
     - `<p>The dashboard header and navigation are now unlocked. In the real intranet this step saved a flag on the user's account, so the redirect to onboarding stopped. Here nothing is saved; choose Reset demo to start again.</p>`
     - No Back or Next.
6. Mock navigation `<section className={styles.nav} aria-labelledby="onboarding-nav-heading">`:
   - `<h2 id="onboarding-nav-heading">Dashboard navigation (preview)</h2>`
   - `<p data-testid="onboarding-nav-state">`: "Locked until onboarding is complete." or "Unlocked: the header and navigation are now available."
   - `<ul className={styles.navList}>`. Each item is `<li className={unlocked ? styles.navOpen : styles.navLocked}><span>{label}</span> <span className={styles.navTag}>{unlocked ? "Available" : "Locked"}</span></li>`. These are not links or buttons.
7. `<p className={styles.rule}>`: "In the real intranet, new users were redirected to this flow on every page until they finished it. Each step was a training page written by an administrator, and completing the last step set a flag on the user's account that unlocked the dashboard header and navigation."

Handlers:
- `Next`: `const r = onboardingStore.next(); announce(describeMove(r)); if (r.ok) { setMotion("forward"); requestFocus(["onboarding-step-heading"]); }`
- `Back`: the same with `back()` and `"back"`.
- `Complete`: `const r = onboardingStore.complete(); announce(describeComplete(r)); if (r.ok) { setMotion(null); requestFocus(["onboarding-complete-heading"]); }`

State hook: `useSyncExternalStore(onboardingStore.subscribe, onboardingStore.getSnapshot, onboardingStore.getServerSnapshot)`.

Local state: `motion: "forward" | "back" | null` (initially null) and `focusRequest` (§1 pattern).

#### `OnboardingWizard.module.css`
- `.root { container-type: inline-size; display: flex; flex-direction: column; gap: 14px; min-width: 0; }`
- Copy `.note`, `.rule`, `.toolbar`, `.reset` and `.status` from the booking CSS.
- Card: `.card { border: 1px solid var(--color-demo-border); border-radius: var(--radius-lg); padding: 16px; }`
- Progress: `.track { height: 8px; background: #e4e7ee; border-radius: var(--radius-pill); overflow: hidden; }` and `.fill { height: 100%; background: #2b6cb0; }`
- `.stepViewport { overflow: hidden; padding: 4px; margin: 0 -4px; }`. This keeps focus rings visible and the slide from widening the page.
- Buttons min-height 40px. `.primary { background: #2b6cb0; color: #fff; border: 1px solid #2b6cb0 }`. Disabled: `opacity: .55; cursor: not-allowed`.
- Nav: `.navList` is a flex-wrap list with gap 8px; `.navLocked` uses background `#fff4e5`, colour `#8a4b00`; `.navOpen` uses `var(--color-demo-open-bg)` and `var(--color-demo-open-fg)`. Items have min-height 36px and padding 6px 10px.
- Motion appears **only** inside this block:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    .step[data-motion="forward"] { animation: slide-in-forward 200ms ease-out; }
    .step[data-motion="back"] { animation: slide-in-back 200ms ease-out; }
    .fill { transition: width 200ms ease; }
    .reset, .actions button { transition: background-color 120ms ease; }
  }
  @keyframes slide-in-forward { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
  @keyframes slide-in-back { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
  ```
- Never declare `transition` or `animation` outside that media block.

#### `index.ts`
`export { OnboardingWizard as default } from "./OnboardingWizard";`

### 3.5 Demo 2: `app/demos/notification-center/`

#### `notifications.ts` (pure)
```ts
import { …fixtures… } from "~/fixtures/intranet";

export interface NotificationState {
  readonly viewerId: ViewerId;
  readonly seen: Readonly<Record<ViewerId, readonly string[]>>;
  readonly feed: readonly FeedItem[];
  readonly kudosSent: number;
}
export const INITIAL_STATE: NotificationState; // frozen: { viewerId: "p-jordan", seen: INITIAL_SEEN, feed: INITIAL_FEED, kudosSent: 0 }

export function isViewerId(id: string): id is ViewerId;
export function getNotification(id: string): IntranetNotification | undefined;
export function isTargeted(notification: IntranetNotification, personId: PersonId): boolean;
//  audience.everyone || audience.personIds.includes(personId) || audience.teamIds.includes(person.teamId)
export function notificationsFor(personId: PersonId): IntranetNotification[];  // fixture order
export function unseenFor(state: NotificationState, viewerId: ViewerId): IntranetNotification[]; // targeted && !seen, fixture order
export function seenFor(state: NotificationState, viewerId: ViewerId): IntranetNotification[];   // targeted && seen, fixture order
export function unreadCount(state: NotificationState, viewerId: ViewerId): number;
export function describeAudience(notification: IntranetNotification, viewerId: ViewerId): string;
//  everyone → "Everyone"; else parts: each team → `${team.name} team`, each person → viewer ? "You" : fullName; joined ", "
export function unreadPhrase(count: number): string; // 1 → "1 unread notification", else `${n} unread notifications`

export type SetViewerResult =
  | { ok: true; state: NotificationState; viewerId: ViewerId; unread: number }
  | { ok: false; state: NotificationState; reason: "unknown-viewer"; viewerId: string };
export function setViewer(state: NotificationState, viewerId: string): SetViewerResult; // same viewer → ok, same state object

export type MarkReadResult =
  | { ok: true; state: NotificationState; notificationId: string; title: string; unread: number }
  | { ok: false; state: NotificationState; reason: "unknown-notification" | "not-targeted" | "already-read"; notificationId: string };
export function markRead(state: NotificationState, notificationId: string): MarkReadResult; // acts on state.viewerId

export type MarkAllResult =
  | { ok: true; state: NotificationState; count: number }
  | { ok: false; state: NotificationState; reason: "nothing-unread" };
export function markAllRead(state: NotificationState): MarkAllResult;

export type KudosError = "unknown-sender" | "missing-recipient" | "unknown-recipient" | "self" | "missing-message" | "unknown-message";
export type KudosField = "recipient" | "message" | null;
export type KudosValidation =
  | { ok: true; fromId: PersonId; toId: PersonId; presetId: KudosPresetId }
  | { ok: false; reason: KudosError; field: KudosField };
export function validateKudos(fromId: string, toId: string, presetId: string): KudosValidation;
//  Check order: unknown-sender (field null) → missing-recipient ("" after trim) → unknown-recipient → self
//               → missing-message ("") → unknown-message. Only the first error is returned.
export type SendKudosResult =
  | { ok: true; state: NotificationState; item: KudosFeedItem }
  | { ok: false; state: NotificationState; reason: KudosError; field: KudosField };
export function sendKudos(state: NotificationState, toId: string, presetId: string): SendKudosResult;
//  sender = state.viewerId; on ok prepend { id: `kudos-${state.kudosSent + 1}`, kind: "kudos", fromId, toId, presetId, dateLabel: "Just now" }, kudosSent + 1
export function reset(): NotificationState; // INITIAL_STATE

export function feedItemText(item: FeedItem): string;
//  kudos: `${from} gave ${to} kudos: ${presetLabel}`; announcement: item.text
export function describeViewer(result: SetViewerResult): string;
export function describeMarkRead(result: MarkReadResult): string;
export function describeMarkAll(result: MarkAllResult, viewerId: ViewerId): string;
export function describeKudos(result: SendKudosResult): string;
export const RESET_ANNOUNCEMENT = "Demo reset. The sample notifications, read states and kudos were restored.";
```
Failed results return the same state object. `markRead` adds the id to `seen[viewerId]` and leaves other viewers untouched (new `seen` object). Nothing throws.

Exact strings:
- `describeViewer` ok: `` `Now viewing as ${fullName} (${teamName} team). ${unreadPhrase(unread)}.` `` Example: `"Now viewing as Lena Kowalski (Web team). 3 unread notifications."` Failure: `"That person is not part of this demo."`
- `describeMarkRead` ok: `` `Marked as read: ${title}. ${unreadPhrase(unread)} left.` `` Example: `"Marked as read: New weekend rota for the Support Desk. 3 unread notifications left."`
  - already-read: `` `${title} is already marked as read.` ``
  - not-targeted: `"That notification isn't addressed to the person you're viewing as."`
  - unknown-notification: `"That notification is not part of this demo."`
- `describeMarkAll` ok: `` `Marked ${count} ${count === 1 ? "notification" : "notifications"} as read. No unread notifications left.` `` Nothing-unread: `` `There are no unread notifications for ${fullName(viewer)}.` ``
- `describeKudos` ok: `` `Kudos sent: ${from} gave ${to} a ${label}.` `` Example: `"Kudos sent: Jordan Reyes gave Lena Kowalski a High Five."` Errors:
  - unknown-sender: `"Choose who you are viewing as before sending kudos."`
  - missing-recipient: `"Choose a colleague to send kudos to."`
  - unknown-recipient: `"That colleague isn't part of this demo."`
  - self: `"You can't send kudos to yourself."`
  - missing-message: `"Choose a kudos message."`
  - unknown-message: `"That kudos message isn't available."`

#### `store.ts`
```ts
export interface NotificationStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): NotificationState;
  getServerSnapshot(): NotificationState; // INITIAL_STATE
  setViewer(viewerId: string): SetViewerResult;
  markRead(notificationId: string): MarkReadResult;
  markAllRead(): MarkAllResult;
  sendKudos(toId: string, presetId: string): SendKudosResult;
  reset(): void;
}
export function createNotificationStore(initial?: NotificationState): NotificationStore;
export const notificationStore: NotificationStore;
```

#### `NotificationCenter.tsx`
`export function NotificationCenter()`. Local state: `recipient: string` (initially `""`), `presetId: string` (initially `""`), `kudosError: { field: KudosField; message: string } | null`, and `focusRequest`.

Order of the panel:
1. `<div className={styles.root} data-demo="notification-center">`
2. Note: "Sample data: every person, team and message here is fictional, and nothing is saved. Changes are kept only while you browse this site; refreshing the page or choosing Reset demo restores the sample notifications."
3. Toolbar:
   - `<label htmlFor="nc-viewer">Viewing as</label>` and `<select id="nc-viewer" value={state.viewerId}>`. The options are VIEWER_IDS in order, with these texts: `"Jordan Reyes (you), Support Desk team"`, `"Lena Kowalski, Web team"`, `"Noah Fischer, Talent & Onboarding team"`. Build them as `` `${fullName}${id === DEMO_USER_ID ? " (you)" : ""}, ${teamName} team` ``.
   - onChange: `const r = notificationStore.setViewer(e.target.value); announce(describeViewer(r)); setKudosError(null); if (recipient === e.target.value) setRecipient("");`
   - `Reset demo` button. On click: `notificationStore.reset(); setRecipient(""); setPresetId(""); setKudosError(null); announce(RESET_ANNOUNCEMENT)`.
4. `<p role="status" aria-live="polite" aria-atomic="true" data-testid="notification-status">`
5. Inbox `<section aria-labelledby="nc-inbox-heading">`:
   - `<div className={styles.inboxHeader}><h2 id="nc-inbox-heading">Notifications for {fullName(viewer)}</h2><p className={styles.badge} data-testid="unread-count">{n} unread</p></div>`
   - `<p className={styles.muted}>{firstName} is on the {teamName} team in {departmentName}. Each notification is addressed to everyone, to whole teams or to named people.</p>`
   - `<div className={styles.listHeader}><h3 id="nc-unseen-heading" tabIndex={-1}>Unseen</h3><button type="button" id="nc-mark-all">Mark all as read</button></div>`
   - `<ul data-testid="unseen-list" aria-labelledby="nc-unseen-heading">`. Each item is `<li className={styles.item}>` containing:
     - `<h4>{title}</h4>`
     - `<p>{body}</p>`
     - `<p className={styles.meta}>{kind === "news" ? "News post" : "Notification"} from {from} · {dateLabel} · Sent to: {describeAudience(n, viewerId)}</p>`
     - `<button type="button" id={`nc-mark-${id}`} aria-label={`Mark as read: ${title}`}>Mark as read</button>`
   - If there are no unseen items, render `<p data-testid="unseen-empty">You're all caught up.</p>` in place of the `<ul>`.
   - `<h3 id="nc-seen-heading">Seen</h3>` and `<ul data-testid="seen-list" aria-labelledby="nc-seen-heading">`. Items are the same minus the button; instead there is `<span className={styles.readTag}>Read</span>`. The empty state is `<p>Nothing read yet.</p>`.
6. Kudos `<section aria-labelledby="nc-kudos-heading">`:
   - `<h2 id="nc-kudos-heading">Send kudos</h2>`
   - `<p className={styles.muted}>Send a colleague a quick thank-you. It appears in the activity feed below.</p>`
   - `<form id="nc-kudos-form" noValidate onSubmit=…>`:
     - `<label htmlFor="nc-kudos-recipient">Colleague</label>`
     - `<select id="nc-kudos-recipient" value={recipient} aria-invalid={kudosError?.field === "recipient" || undefined} aria-describedby={kudosError?.field === "recipient" ? "nc-kudos-error" : undefined}>`. First option is `<option value="">Choose a colleague</option>`, then every PEOPLE entry except the viewer, as `` `${fullName} (${teamName})` ``.
     - `<fieldset aria-describedby={kudosError?.field === "message" ? "nc-kudos-error" : undefined}><legend>Message</legend>`. For each preset: `<label className={styles.preset}><input type="radio" name="nc-kudos-preset" id={`nc-kudos-preset-${id}`} value={id} checked={presetId === id} aria-invalid={kudosError?.field === "message" || undefined} onChange=…/> {label}</label>`.
     - If there is an error: `<p id="nc-kudos-error" className={styles.error}>{message}</p>`
     - `<button type="submit">Send kudos</button>`
   - onSubmit: `e.preventDefault(); const r = notificationStore.sendKudos(recipient, presetId); const text = describeKudos(r); announce(text);`
     - If ok: `setRecipient(""); setPresetId(""); setKudosError(null);`
     - Else: `setKudosError({ field: r.field, message: text }); requestFocus([r.field === "message" ? "nc-kudos-preset-high-five" : "nc-kudos-recipient"]);`
7. Feed `<section aria-labelledby="nc-feed-heading">`:
   - `<h2 id="nc-feed-heading">Activity feed</h2>`
   - `<p className={styles.muted}>Kudos and company announcements, newest first.</p>`
   - `<ul data-testid="activity-feed">`. Each item is `<li><span className={item.kind === "kudos" ? styles.kindKudos : styles.kindAnnouncement}>{item.kind === "kudos" ? "Kudos" : "Announcement"}</span> <span>{feedItemText(item)}</span> <span className={styles.feedDate}>{item.dateLabel}</span></li>`.
8. Rule paragraph: "In the real intranet, administrators addressed each notification to everyone, to whole teams or to named people. Saving it added it to each recipient's unseen list, and marking it as read moved it to their seen list. Change Viewing as to see how targeting changes what each person gets."

Mark handlers:
- One: `const before = unseenFor(state, state.viewerId).map(n => n.id); const i = before.indexOf(id); const r = notificationStore.markRead(id); announce(describeMarkRead(r)); if (r.ok) { const nextId = before[i + 1] ?? before[i - 1]; requestFocus(nextId ? [`nc-mark-${nextId}`, "nc-unseen-heading"] : ["nc-unseen-heading"]); }`
- All: `const r = notificationStore.markAllRead(); announce(describeMarkAll(r, state.viewerId)); if (r.ok) requestFocus(["nc-unseen-heading"]);`

#### `NotificationCenter.module.css`
- `.root` copies the onboarding root: `container-type: inline-size`, flex column, gap 14px.
- `.badge { display: inline-block; padding: 2px 10px; border-radius: var(--radius-pill); background: #2b6cb0; color: #fff; font-weight: 700; font-size: 13px; margin: 0; }`
- `.item { border: 1px solid var(--color-demo-border); border-radius: var(--radius-md); padding: 12px; }`. Item lists have `list-style: none; padding: 0; display: grid; gap: 10px;`.
- `.readTag { background: #f1f3f7; color: #566074 }`.
- `.preset`: the radio group is `display: flex; flex-wrap: wrap; gap: 8px 16px`. Each label is `display: inline-flex; align-items: center; gap: 6px; min-height: 36px`. Inputs are `width: 18px; height: 18px; margin: 0`.
- `.error { color: #b42318; font-weight: 600; }`
- `.kindKudos { background: var(--color-demo-booked-bg); color: var(--color-demo-booked-fg) }` and `.kindAnnouncement { background: var(--color-demo-open-bg); color: var(--color-demo-open-fg) }`.
- Selects: `max-width: 100%; min-height: 36px`.
- All buttons min-height 36px.
- Transitions only inside `@media (prefers-reduced-motion: no-preference)`.

#### `index.ts`
`export { NotificationCenter as default } from "./NotificationCenter";`

### 3.6 Demo 3: `app/demos/interactive-remote-employee-map/`

#### `employee-map.ts` (pure)
```ts
export type DepartmentFilter = DepartmentId | "all";
export interface MapState { readonly department: DepartmentFilter; readonly selectedId: PersonId | null }
export const INITIAL_STATE: MapState = Object.freeze({ department: "all", selectedId: null });

export type FilterResult =
  | { ok: true; state: MapState; department: DepartmentFilter; count: number }
  | { ok: false; state: MapState; reason: "unknown-department"; department: string };
export type SelectResult =
  | { ok: true; state: MapState; personId: PersonId }
  | { ok: false; state: MapState; reason: "unknown-person"; personId: string };

export function visiblePeople(state: MapState): readonly Person[];   // PEOPLE order, filtered
export function setDepartment(state: MapState, department: string): FilterResult; // same value → ok + same state object; keeps selectedId
export function selectPerson(state: MapState, personId: string): SelectResult;   // same person → ok + same state object
export function closeProfile(state: MapState): MapState;              // already null → same state object
export function reset(): MapState;                                     // INITIAL_STATE
export function getManager(person: Person): Person | undefined;
export function getDirectReports(person: Person): Person[];           // PEOPLE order
export function isDemoUser(person: Person): boolean;                  // id === DEMO_USER_ID
export function describeLocation(person: Person): string;             // `near ${city}, ${region}`
export function markerLabel(person: Person): string;
//  `${isDemoUser ? "You: " : ""}${fullName}, ${departmentName}, near ${city}`
export function markerPosition(person: Person): { left: string; top: string };
//  left = `${Math.round((x / MAP_WIDTH) * 100000) / 1000}%`, top likewise with MAP_HEIGHT
export function formatPeople(count: number): string;                  // 1 → "1 person", else `${n} people`
export function summaryLabel(state: MapState): string;                // `Showing ${visible} of ${PEOPLE.length} people`
export function describeFilter(result: FilterResult): string;
//  ok all → `Showing all ${PEOPLE.length} people.`; ok dept → `Showing ${formatPeople(count)} in ${departmentName}.`
//  failure → "That department is not part of this demo."
export const RESET_ANNOUNCEMENT = "Demo reset. All departments are shown and no profile is open.";
```

#### `store.ts`
```ts
export interface EmployeeMapStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): MapState;
  getServerSnapshot(): MapState; // INITIAL_STATE
  setDepartment(department: string): FilterResult;
  selectPerson(personId: string): SelectResult;
  closeProfile(): void;
  reset(): void;
}
export function createEmployeeMapStore(initial?: MapState): EmployeeMapStore;
export const employeeMapStore: EmployeeMapStore;
```

#### `InteractiveRemoteEmployeeMap.tsx`
`export function InteractiveRemoteEmployeeMap()`. Local state: `openedFrom = useRef<"marker" | "list" | "card">("marker")` and `focusRequest`.

1. `<div className={styles.root} data-demo="interactive-remote-employee-map">`
2. Note: "Sample data: every person and place on this map is fictional, and nothing is saved. Locations are approximate by design: each marker shows roughly where someone is based, never an address."
3. Toolbar:
   - `<label htmlFor="map-department">Department</label>`
   - `<select id="map-department" value={state.department}>`. Options: `all` → `All departments (12)`, then each department in DEPARTMENTS order as `` `${name} (${count})` ``. onChange: `announce(describeFilter(employeeMapStore.setDepartment(e.target.value)))`.
   - `<p data-testid="map-summary">{summaryLabel(state)}</p>`
   - `Reset demo` button. On click: `employeeMapStore.reset(); announce(RESET_ANNOUNCEMENT)`.
4. `<p role="status" aria-live="polite" aria-atomic="true" data-testid="map-status">`
5. `<div className={styles.layout}>`:
   - Map: `<div className={styles.map} role="group" aria-label="Map of approximate employee locations" data-testid="map-markers">`
     - `<svg className={styles.outline} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true" focusable="false"><path d={MAP_OUTLINE_PATH} /></svg>`
     - For each `visiblePeople(state)` person: `<button type="button" id={`map-marker-${id}`} className={cx(styles.marker, isDemoUser && styles.markerYou, selected && styles.markerSelected)} style={markerPosition(p)} aria-label={markerLabel(p)} aria-current={selected ? "true" : undefined} onClick={() => open(p.id, "marker")}>`. Its content is `"You"` for the demo user, otherwise `<span className={styles.dot} aria-hidden="true" />`.
   - Card: `<section className={styles.card} aria-labelledby="map-profile-heading" data-testid="profile-card">`
     - No selection: `<h2 id="map-profile-heading">Profile</h2><p>Choose a person on the map or in the people list to see their profile.</p>`
     - Selected:
       - `<h2 id="map-profile-heading" tabIndex={-1}>{fullName}{isDemoUser ? " (you)" : ""}</h2>`
       - `<dl>` with these rows:
         - Title
         - Department
         - Team
         - Location: `{describeLocation(p)} (approximate)`
         - Manager: either `<button type="button" className={styles.linkButton} aria-label={`View profile: ${fullName(m)}`} onClick={() => open(m.id, "card")}>{fullName(m)}</button>` or the text `No manager listed`
         - Direct reports: `<ul>` of the same buttons, or `None`
       - `<button type="button" id="map-close-profile">Close profile</button>`
6. People list `<section aria-labelledby="map-list-heading">`:
   - `<h2 id="map-list-heading">People list</h2>`
   - `<p className={styles.muted}>The same people as the map, in a table.</p>`
   - `<div className={styles.scroller} role="region" aria-label="People list" tabIndex={0}><table className={styles.table}>`
   - `<caption className={styles.visuallyHidden}>Fictional colleagues and their approximate locations. Choose a name to open their profile.</caption>`
   - Header row: Name | Title | Department | Team | Location (all `<th scope="col">`).
   - Rows follow `visiblePeople(state)`. The name cell is `<th scope="row"><button type="button" id={`map-row-${id}`} className={styles.linkButton} aria-label={`View profile: ${fullName}${isDemoUser ? " (you)" : ""}`} onClick={() => open(id, "list")}>{fullName}{isDemoUser && <span className={styles.youTag}>You</span>}</button></th>`. The Location cell is `describeLocation(p)`.
7. Legend `<ul className={styles.legend} aria-label="Legend">` with three items:
   - "Colleague (round marker)"
   - "You (marker labelled You)"
   - "Selected profile (ringed marker)"
   
   Each has an `aria-hidden` swatch.
8. Rule: "In the real intranet, each person's city and state were geocoded on the server when their profile changed, markers were offset slightly so no exact location was shown, and the map loaded only when it scrolled into view. Selecting a marker opened that person's profile."

Handlers:
- `open(id, source)`: `const r = employeeMapStore.selectPerson(id); if (r.ok) { openedFrom.current = source; requestFocus(["map-profile-heading"]); }`
- `close`: `const id = state.selectedId; employeeMapStore.closeProfile(); if (id) requestFocus(openedFrom.current === "list" ? [`map-row-${id}`, `map-marker-${id}`, "map-department"] : [`map-marker-${id}`, `map-row-${id}`, "map-department"]);`

#### `InteractiveRemoteEmployeeMap.module.css`
- `.root { container-type: inline-size; … }`
- `.layout { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }` and `@container (min-width: 640px) { .layout { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); align-items: start; } }`
- `.map { position: relative; width: 100%; aspect-ratio: 3 / 2; background: #f3f6fa; border: 1px solid var(--color-demo-border); border-radius: var(--radius-lg); }`
- `.outline { position: absolute; inset: 0; width: 100%; height: 100%; } .outline path { fill: #e3ebf5; stroke: #8a97ab; stroke-width: 2; }`
- `.marker { position: absolute; transform: translate(-50%, -50%); width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: transparent; display: grid; place-items: center; cursor: pointer; }`
- `.dot { width: 14px; height: 14px; border-radius: 50%; background: #2b6cb0; border: 2px solid #fff; box-shadow: 0 0 0 1px #1f4f8a; }`
- `.markerYou { width: auto; min-width: 40px; height: 24px; padding: 0 8px; border-radius: var(--radius-pill); background: #1f4f8a; color: #fff; font: inherit; font-size: 12px; font-weight: 700; border: 2px solid #fff; box-shadow: 0 0 0 1px #1d2330; }`
- `.markerSelected { box-shadow: 0 0 0 3px #1d2330; }` (for the You marker, combine it with the existing ring)
- `.markerYou:focus-visible { outline: 2px solid #1d2330; outline-offset: 2px; }`
- `.scroller` and `.table` follow the booking pattern, with `.table { min-width: 640px }`. Rows have `min-height` via padding 8px and `.linkButton { min-height: 32px; background: none; border: 0; color: #1f5a9e; text-decoration: underline; font: inherit; cursor: pointer; padding: 0 2px; }`
- `.youTag { margin-left: 6px; padding: 0 6px; border-radius: var(--radius-pill); background: #1f4f8a; color: #fff; font-size: 12px; text-decoration: none; display: inline-block; }`
- No transitions or animations, or only inside `@media (prefers-reduced-motion: no-preference)`.

#### `index.ts`
`export { InteractiveRemoteEmployeeMap as default } from "./InteractiveRemoteEmployeeMap";`

### 3.7 `app/demos/index.ts`
Add the imports `import { NOTIFICATIONS_WEEK_LABEL, ONBOARDING_STEPS, PEOPLE } from "~/fixtures/intranet";` and the three default component imports. Add these entries after `office-booking-calendar`:
```ts
"onboarding-wizard": {
  component: OnboardingWizard,
  meta: `New starter tour · ${ONBOARDING_STEPS.length} steps`,
  description: "Interactive example with fictional onboarding steps; nothing is saved",
},
"notification-center": {
  component: NotificationCenter,
  meta: NOTIFICATIONS_WEEK_LABEL,
  description: "Interactive example with fictional people and notifications; nothing is saved",
},
"interactive-remote-employee-map": {
  component: InteractiveRemoteEmployeeMap,
  meta: `${PEOPLE.length} fictional colleagues · approximate locations`,
  description: "Interactive example with fictional people and approximate locations; nothing is saved",
},
```

### 3.8 `app/content/view-placeholders.ts`
- Delete the `view:hybrid-wp-react-intranet:interactive-remote-employee-map` key.
- `employee-directory.summary`: `"[Placeholder] This panel will present the intranet's employee directory: staff profiles searchable by name, department and team, each showing a person's title, manager and direct reports. It will be rebuilt with fictional staff."`
- `documentation-system.summary`: `"[Placeholder] This panel will present the intranet's documentation system: support and training documents grouped by category, searchable, and shown only to the roles allowed to see them. It will be rebuilt with fictional documents."`
- Header comment: replace "Statements are deliberately generic and derived from the view's name only" with "Statements are generic unless the project has been reviewed (the intranet's two remaining panels describe the real feature)".

### 3.9 `app/data/home.ts`
- `projectBlurbs["hybrid-wp-react-intranet"]`: `"An intranet for a healthcare-sector company with a large remote workforce: a React app built into a WordPress theme, with onboarding, targeted notifications, a staff map and office booking."`
- `placeholderCallout`: `"The introduction and most project descriptions are placeholders. Final copy will be supplied in phase 2. No client names, outcomes or metrics are stated anywhere on this site."`
- Header comment: "…the short descriptions below are placeholders keyed by project id, except hybrid-wp-react-intranet, which is final."

---

## 4. Data Flow

### 4.1 Build and registry
`projects.ts` (views, `demoId`, `description`, `summary`) → `registry.ts projectEntries()` (descriptions via the helpers) → `routes.ts`, prerender paths, explorer, search sources. `routes/view.tsx` loader: `requireEntry(url)`. It throws at build time if a `demoId` has no definition in `demos/index.ts`, or a placeholder has no copy. The component renders `<DemoFrame title meta description><demo.component/></DemoFrame>`.

### 4.2 Demo runtime (all three)
```
user event → component handler → store.action(args)
  → pure rule fn(state, args) → Result { ok, state, … }
  → store.commit(result.state)  (notify only if !== current)
  → useSyncExternalStore re-render
handler → announce(describeX(result))       (polite live region, useRepeatableAnnouncement)
handler → requestFocus([...ids])            (only on listed actions) → useEffect focuses first existing id
```
- **Prerender and hydration:** `getServerSnapshot()` returns `INITIAL_STATE`. Local state starts at fixed defaults. No `Date`, `Math.random`, storage or network. The first client render therefore matches the HTML.
- **Persistence:** module-level store instances survive client-side navigation. A full reload re-evaluates modules, so state is back to the fixtures.

### 4.3 Error propagation
- Pure functions **never throw**. Invalid input returns `{ ok: false, reason, state: <same object> }`.
- Stores return the result unchanged and do not notify on failure.
- Components turn every result (ok or not) into announcement text with the `describe*` functions. Kudos failures are also shown inline (`#nc-kudos-error`) and move focus to the invalid field.
- Build-time problems (a missing demo, missing placeholder copy, broken Markdown links) throw in the loader or `loadMarkdown` and fail `npm run build` or Vitest. That is the existing behaviour.

### 4.4 Focus rules (exhaustive)
| Demo | Action | Focus target(s) |
|---|---|---|
| onboarding | Next/Back ok | `#onboarding-step-heading` |
| onboarding | Complete ok | `#onboarding-complete-heading` |
| onboarding | Reset, mount, failed action | unchanged |
| notifications | Mark as read ok | next unseen item's `#nc-mark-<id>`, else previous, else `#nc-unseen-heading` |
| notifications | Mark all ok | `#nc-unseen-heading` |
| notifications | Kudos error | `#nc-kudos-recipient` (recipient/null field) or `#nc-kudos-preset-high-five` (message) |
| notifications | Viewer change, kudos success, Reset | unchanged |
| map | open profile (marker/list/card) | `#map-profile-heading` |
| map | Close profile | list-opened: `#map-row-<id>` → `#map-marker-<id>` → `#map-department`; otherwise `#map-marker-<id>` → `#map-row-<id>` → `#map-department` |
| map | Filter, Reset | unchanged |

### 4.5 Case-study Markdown (exact content)

#### `content/projects/hybrid-wp-react-intranet/README.md`
````markdown
---
title: "Hybrid WordPress + React Intranet"
role: "Sole developer: React front end, WordPress theme and back end"
stack: ["WordPress", "PHP", "React", "Redux Toolkit", "React Router", "Tailwind CSS", "Headless UI", "webpack", "ACF Pro", "REST API"]
status: published
summary: "One place for a remote workforce to connect: a React single-page app built into a WordPress theme, with onboarding, targeted notifications, a staff map, office booking and role-based access."
---

# Hybrid WordPress + React Intranet

## Overview

An intranet built in the early 2020s for a healthcare-sector company with a large remote workforce. Staff signed in once and found news, events, teams, a searchable directory, a map of where colleagues were based, training, documentation and office booking in one place.

This case study is anonymised: the company is described only by its sector, and every person, place and message in the demos is fictional.

### The problem

Most of the workforce was remote and spread across many locations. People had no single place to find colleagues, follow company news, learn how things worked when they joined, or book space on the days they came into an office. The intranet had to become that central place, and it had to feel like an application rather than a set of web pages.

### The constraint

WordPress was the only platform offered, on managed WordPress hosting, and the host did not support running WordPress headless with a separate front end. Content management, sign-in, the API and the application itself all had to ship together as a WordPress theme.

### The approach

I built the intranet as a React single-page app inside the theme. WordPress stays in charge of what it does well: users and roles, content editing, custom post types and fields, and single sign-on. Before the app starts, the theme's page template checks the visitor on the server. Logged-out visitors go to the login page, new users who have not finished onboarding go to the onboarding flow, and pages their role may not see are refused. The template then hands the app the current user, site options, a security token for the API and that user's access rules, and React takes over routing and rendering. Everything after that comes from a custom REST API.

## My role

I was the sole developer, responsible for the theme, the custom REST API, the data model and the whole React application. A UI/UX designer produced the designs in Figma, and I turned them into the interface and the behaviour behind it.

Everything was hand-coded, before AI-assisted coding tools were part of my workflow. It was also my first substantial React project, after about three years of working mainly in Vue, so I learned React, Redux Toolkit and React Router in depth while delivering a full product.

## Views in this project

Each view is an illustrative example rebuilt with fictional sample data. Nothing in them comes from the real intranet, and nothing you do in them is saved.

| File | Title | Type |
| --- | --- | --- |
| [onboarding-wizard.html](/portfolio/hybrid-wp-react-intranet/views/onboarding-wizard) | Onboarding Wizard | Interactive demo (sample data) |
| [notification-center.html](/portfolio/hybrid-wp-react-intranet/views/notification-center) | Notification Center | Interactive demo (sample data) |
| [interactive-remote-employee-map.html](/portfolio/hybrid-wp-react-intranet/views/interactive-remote-employee-map) | Interactive Remote Employee Map | Interactive demo (sample data) |
| [office-booking-calendar.html](/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar) | Office Booking Calendar | Interactive demo (sample data) |
| [employee-directory.html](/portfolio/hybrid-wp-react-intranet/views/employee-directory) | Employee Directory | Placeholder panel |
| [documentation-system.html](/portfolio/hybrid-wp-react-intranet/views/documentation-system) | Documentation System | Placeholder panel |

> [!note]
> Views use fictional sample data and placeholder branding. The office booking demo shows desk booking for one sample week; the real feature booked meeting rooms against each room's live calendar.

## Highlights

### Features

- **Onboarding that can't be skipped.** New users are redirected on the server until they finish a short series of training pages written by administrators. Completing it unlocks the dashboard header and navigation.
- **Targeted notifications.** Administrators address a notification to everyone, to whole teams or to named people. Each person has their own unseen and seen lists, and news posts can notify the whole company.
- **Peer kudos.** Colleagues send each other preset messages such as High Five, Great Job or Thank You, which appear in a feed alongside company announcements.
- **Remote employee map.** Each profile's city and state is geocoded on the server, markers are offset so no one's exact location is shown, the map loads only when it scrolls into view, and every marker opens that person's profile.
- **Office booking.** Room availability comes from each room's Google Calendar through a service account, and a booking request creates the calendar event and invites the attendees.
- **Role-based access.** Administrators choose which roles can use each area (support, resources, directory, teams, training and the office hub), and search only returns posts the current role may see.
- **Single sign-on.** Staff sign in through Okta using SAML, accounts are provisioned through SCIM, and a separate fallback login page covers the cases single sign-on cannot.
- **People and teams.** Department and team spaces, profiles with managers and direct reports, badges, open positions, events, birthdays and work anniversaries, and documentation searchable by category.

### Lessons learned

> [!placeholder] Draft — awaiting review
> These reflections are drafted from a review of the original code and are not yet approved.
>
> - **Fan-out on save does not scale.** Saving a notification looped over every user to update their unseen list, so the work grew with the size of the company. A custom table, or a queued background job, would scale better. An early return inside that loop could also stop the fan-out partway, leaving some people without the notification.
> - **Secrets belong outside the theme.** Integration credentials were stored inside the theme directory. They should live outside it, in environment configuration.
> - **Generalise locations once.** Map offsets were randomised on every render, so markers shifted slightly each time the map was drawn. Storing one offset per person would keep the privacy benefit and make the map stable.
> - **Type the contract between PHP and React.** A lot of state arrived through one global bootstrap object. Typed contracts, with TypeScript on the React side, would catch mismatches earlier.
> - **Weigh headless or blocks today.** With hosting that supports it, a headless WordPress back end or a block-based approach would remove much of the custom glue between the theme and the app.

## Related documents

- [technical-requirements.md](/portfolio/hybrid-wp-react-intranet/technical-requirements) — architecture, integrations, data model and requirements
````

#### `content/projects/hybrid-wp-react-intranet/technical-requirements.md`
````markdown
---
title: "Hybrid WordPress + React Intranet — Technical Requirements"
role: "Sole developer: React front end, WordPress theme and back end"
stack: ["WordPress", "PHP", "React", "Redux Toolkit", "React Router", "Tailwind CSS", "Headless UI", "webpack", "ACF Pro", "REST API"]
status: published
---

# Technical Requirements

How the intranet was put together: a WordPress theme that runs the server-side checks, a custom REST API, and a React single-page app that renders everything the user sees.

## Architecture

### Platform

A single WordPress install on managed WordPress hosting serves both the content and the application. The host did not support running WordPress headless, so the React app is bundled with webpack into the theme and mounted by the theme's page template.

### Server-side checks

The page template runs before React mounts:

1. Logged-out visitors are redirected to the login page.
2. Users who have not completed onboarding are redirected to the onboarding flow.
3. Pages the user's role may not see are blocked.

Only then does the template output the React root. It bootstraps the current user, ACF options, a REST nonce and the user's restriction map into the page through WordPress script localisation (wp_localize_script).

### React application

React 18 with Redux Toolkit (about 20 slices) for shared state, React Router 6 for client-side routing, and Tailwind CSS with Headless UI for the interface. PostCSS runs in the webpack build, and Sentry reports front-end errors.

### REST API

A custom REST namespace exposes around 26 endpoints. Every route rejects logged-out requests, and cross-origin requests are limited to the site's own origin.

| Endpoint group | Used for |
| --- | --- |
| Search | Site-wide search, filtered by the user's role |
| News and events | Company news, events and the dashboard feed |
| Users and directory | Profiles, directory listings, managers and direct reports |
| Map members | Generalised locations for the employee map |
| Birthdays and anniversaries | Celebration blocks on the dashboard |
| Training progress | Onboarding steps and completion |
| Notifications | Unseen and seen lists, mark as read |
| Teams | Department and team spaces |
| Resources | Documents and links by category |
| Room calendars and booking | Room events and an availability check before booking |
| Peer messages and announcements | Kudos and the announcement feed |

### Integrations

- **Okta single sign-on** through SAML, with SCIM user provisioning, both via plugins, plus a separate fallback login page.
- **Google Calendar** through a service account: each meeting room has its own calendar, which is read for availability.
- **Gravity Forms** for booking requests: a submission creates the calendar event and invites the attendees.
- **BuddyPress** for peer messages (kudos).
- **WP All Import** for bulk user data.
- **Sentry** for front-end error monitoring.

## Requirements

| Area | Requirement | Implementation |
| --- | --- | --- |
| Access | Only signed-in staff can see any page or data | The page template redirects logged-out visitors before the app mounts; every custom REST route rejects logged-out requests; cross-origin requests are limited to the site origin |
| Onboarding | New users finish onboarding before using the intranet | A server-side redirect to the onboarding flow until the user's completion flag is set; the steps are training posts written by administrators |
| Roles | Areas are restricted by role | Administrator-configured role lists per area (support, resources, directory, teams, training, office hub); blocked pages are refused on the server; search results are filtered by per-post role restrictions |
| Notifications | Targeted announcements with read state | Per-user unseen and seen lists, filled on save for the chosen teams and named users; news posts can notify everyone |
| Recognition | Peer kudos | Preset messages sent to a colleague as BuddyPress messages and shown in a feed with company announcements |
| Location | A staff map without exact addresses | City and state geocoded on the server when a profile is updated; markers offset on the client; the map loads when scrolled into view |
| Booking | Room booking against live calendars | Each room's Google Calendar is read through a service account; an availability check runs before booking; a Gravity Forms submission creates the event with invitees |
| Identity | Single sign-on and provisioning | Okta via SAML and SCIM through plugins, with a fallback login page |
| Monitoring | Front-end errors are visible | Sentry in the React bundle |

## Data model

### Custom post types

Training (the onboarding steps), training documents, events, badges, open positions, resources, support documents, rooms, notifications, and teams and departments. ACF Pro defines their fields and the site-wide options.

### Users and relationships

Each user profile holds the job title, team, manager, city and state, and the geocoded coordinates. Direct reports are derived from the manager field. Bulk user data was loaded with WP All Import.

### Notifications

Each user has two ACF relationship lists: unseen and seen. When an administrator saves a notification, it is added to the unseen list of every member of the chosen teams and of every named user. Marking it as read moves it to the seen list. News posts have a notify-everyone flag that targets every user.

> [!info]
> The demos in this portfolio rebuild these behaviours with fictional people, teams and messages. No data, credentials or branding from the real intranet is used.

## Security and access

- Every page and every REST route requires a signed-in user, and REST requests carry a nonce.
- Role-specific gating is configured by administrators per area and enforced on the server, both for pages and for search results.
- Single sign-on and SCIM provisioning keep accounts in step with the company's identity provider.
- The employee map never shows an exact location: coordinates come from city and state only, and markers are offset.

## Performance and accessibility

### Performance

- After the first page load, navigation happens in the browser without full page loads.
- The bootstrapped user, options and access rules let the app render its shell without waiting for extra requests.
- The employee map loads only when it scrolls into view, using IntersectionObserver.
- Geocoding runs once, on the server, when a profile changes, never on each map view.

### Accessibility

- Interface components such as menus and dialogs came from Headless UI, which provides their keyboard and focus behaviour.
- The portfolio demos go further: semantic controls, visible focus, polite announcements, no meaning carried by colour alone, and a table alternative to the map.

## Related views

- [onboarding-wizard.html](/portfolio/hybrid-wp-react-intranet/views/onboarding-wizard) — onboarding flow
- [notification-center.html](/portfolio/hybrid-wp-react-intranet/views/notification-center) — targeted notifications and kudos
- [interactive-remote-employee-map.html](/portfolio/hybrid-wp-react-intranet/views/interactive-remote-employee-map) — approximate staff locations
- [office-booking-calendar.html](/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar) — desk booking
- [employee-directory.html](/portfolio/hybrid-wp-react-intranet/views/employee-directory)
- [documentation-system.html](/portfolio/hybrid-wp-react-intranet/views/documentation-system)
- [README.md](/portfolio/hybrid-wp-react-intranet) — project summary
````

Check before saving:
- The technical requirements contain no "anonymised".
- Each has one `info` callout (TECH) or one `placeholder` callout (README).
- TECH has exactly one column header containing "Requirement".
- No heading other than the original contains "Data model" or "Performance and accessibility".
- README links `technical-requirements.md` once and `employee-directory.html` once; TECH links `README.md` once.

### 4.6 Docs

**`docs/demos.md`**
- Replace line 3 with: "There are four demos. `office-booking-calendar` (`app/demos/office-booking-calendar/`, fixtures in `app/fixtures/office-booking-calendar.ts`) is the reference implementation. `onboarding-wizard`, `notification-center` and `interactive-remote-employee-map` share fictional people, teams and messages in `app/fixtures/intranet/`."
- Step 4: add "Optionally add `description` (a real one-line description for search and `<meta name="description">`)."
- Step 6: change the counts to "(4 demos)", "(15 placeholder views)" and add "`e2e/verification.spec.ts` (entries/routes) only changes when views are added".
- Fixtures section: add "Data shared by several demos lives in a folder with an `index.ts` (`app/fixtures/intranet/`)."
- Testing expectations: add "Focus moves only after explicit actions (never on mount or reset)."

**`docs/content-registry.md`**
- After "Entry model", add a short "Real descriptions" subsection explaining `Project.summary?` and `ProjectView.description?` and the three formulas from §3.2.
- Step 5: change the counts to "(15 placeholder views)" and "(33 entries, 32 routes)".

**`docs/phase-2-content-needs.md`**
- §1 table: hybrid `[x] | [x]`. Add a line: "`hybrid-wp-react-intranet` README → Lessons learned is a draft in a `> [!placeholder] Draft — awaiting review` callout; [ ] Garth approves or edits it, then removes the callout."
- §1 paragraph on descriptions: note that `Project.summary` and `ProjectView.description` exist and that the intranet uses them, with `status: "final"`.
- §2 heading → "The 15 placeholder views". Intranet list:
  - `[x] interactive-remote-employee-map (now a demo)`
  - `[ ] employee-directory (summary describes the real feature; still a placeholder)`
  - `[ ] documentation-system (same)`
  - New line: "Also new demos: `onboarding-wizard`, `notification-center`."
  - Replace the office-booking sentence with: "[ ] `office-booking-calendar` rework: the real feature booked meeting rooms against Google Calendar through a service account and a Gravity Forms request; the demo still shows fictional desk booking."
- §3: `[ ] projectBlurbs: one sentence per project (hybrid-wp-react-intranet done; 3 remaining)`.

**`docs/testing.md`**
- Demos row: add `app/demos/{onboarding-wizard,notification-center,interactive-remote-employee-map}/*.test.ts(x)` and `app/fixtures/intranet/intranet.test.ts`.
- e2e table: add `onboarding-wizard.spec.ts`, `notification-center.spec.ts`, `employee-map.spec.ts` with one-line descriptions.

**`README.md`** (line 7): "…search, four working demos (`office-booking-calendar`, `onboarding-wizard`, `notification-center`, `interactive-remote-employee-map`) and the contact demo are done. The `hybrid-wp-react-intranet` case study is written (its Lessons learned is a draft awaiting review); all other case-study text is placeholder copy and the site is `noindex`."

---

## 5. Edge Cases & Error Handling

Test IDs in the right column refer to §6.

### 5.1 Registry (`registry.ts`, `projects.ts`)
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| R1 | Project with summary | `{title:"T", summary:"S."}` | `describeReadme` → `"S."`; `describeTechnicalRequirements` → `"Technical requirements for T. S."` |
| R2 | Project without summary | `{title:"T"}` | `"Project summary for T. Placeholder — content to be supplied in phase 2."` / `"Technical requirements for T. Placeholder — content to be supplied in phase 2."` |
| R3 | View with description | `{demoId:"x", description:"D."}` | `"D."` |
| R4 | Demo view without description | `{demoId:"x"}`, title T | `"Interactive sample-data demo from T."` |
| R5 | Placeholder view without description | `{}`, title T | `"Placeholder view from T. Placeholder — content to be supplied in phase 2."` |
| R6 | Counts after change | registry | 19 views, 4 demos, 8 markdown, 33 entries, 32 prerender paths |
| R7 | Intranet view order | `getProject("hybrid-wp-react-intranet").views` | slugs `[onboarding-wizard, notification-center, interactive-remote-employee-map, office-booking-calendar, employee-directory, documentation-system]`; first four have demoIds equal to their slugs |
| R8 | No `anonymised` in intranet registry text | all intranet entry descriptions | none matches `/anonymi[sz]ed/i` |

### 5.2 Fixtures (`app/fixtures/intranet`)
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| F1 | Referential integrity | PEOPLE | ids equal PERSON_IDS in order; every team/department exists; `team.departmentId === person.departmentId`; every managerId exists, is in the same department and is not the person; no manager cycles |
| F2 | Marker spacing | every pair | `abs(dx) >= 70 || abs(dy) >= 60`; pairs including p-jordan: `abs(dx) >= 80 || abs(dy) >= 60` |
| F3 | Markers inside the map | every person | `40 <= x <= 560`, `40 <= y <= 360`, integers |
| F4 | Notification audiences valid | NOTIFICATIONS | ids unique; each has everyone, a team or a person; every team/person id exists |
| F5 | Initial seen valid | INITIAL_SEEN | every id is targeted at that viewer; viewers are on 3 distinct teams |
| F6 | Sensitivity guard | `JSON.stringify` of every fixture export | no `@`, no `http`, no `password`/`key`/`token`/`secret` (case-insensitive) |
| F7 | Onboarding content | ONBOARDING_STEPS | 5 steps, unique ids, non-empty titles and paragraphs; 6 unique nav items |

### 5.3 Onboarding rules (`onboarding.ts`)
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| O1 | Initial progress | INITIAL_STATE | `{current:1,total:5,percent:20,label:"Step 1 of 5"}`, nav locked |
| O2 | Next from step 1 | INITIAL_STATE | ok, stepIndex 1, INITIAL unchanged; `"Step 2 of 5: How the intranet is organised."` |
| O3 | Back on first step | INITIAL_STATE | ok false, `at-first-step`, same state; `"You're already on the first step."` |
| O4 | Next on last step | `{stepIndex:4, completed:false}` | ok false, `at-last-step`; `"You're already on the last step. Choose Complete onboarding to finish."` |
| O5 | Complete before last | `{stepIndex:2, completed:false}` | ok false, `not-at-last-step`; `"Finish every step before completing onboarding."` |
| O6 | Complete on last | `{stepIndex:4, completed:false}` | ok, completed true; progress `{current:5,percent:100,label:"All 5 steps complete"}`; nav unlocked; `"Onboarding complete. The dashboard navigation is now unlocked."` |
| O7 | Actions after completion | `{stepIndex:4, completed:true}` | next/back → `completed` and `"Onboarding is already complete."`; complete → `already-completed` and `"Onboarding is already complete."` |
| O8 | Back from step 3 | `{stepIndex:2, completed:false}` | ok, stepIndex 1; `"Step 2 of 5: How the intranet is organised."` |
| O9 | Reset | any | returns the INITIAL_STATE object |

### 5.4 Onboarding store and component
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| OS1 | Snapshots | new store | `getSnapshot()` and `getServerSnapshot()` are INITIAL_STATE |
| OS2 | Failed actions don't notify | `back()` at step 1, `complete()` at step 1 | listener not called |
| OS3 | Reset when pristine | `reset()` | listener not called |
| OC1 | Next moves focus and announces | click Next | `#onboarding-step-heading` focused with text "How the intranet is organised"; status `"Step 2 of 5: How the intranet is organised."` |
| OC2 | Back disabled on step 1 | initial render | Back `disabled` |
| OC3 | Complete flow | Next ×4, Complete | heading "Onboarding complete" focused; 6× "Available", 0× "Locked"; no Next or Back buttons |
| OC4 | Repeated Reset announcements | Reset ×3 | visible text identical, raw text alternates (zero-width marker) |
| OC5 | No focus on mount or reset | render, click Reset | `document.activeElement` is not the step heading |
| OC6 | Reduced motion | `prefers-reduced-motion: reduce`, click Next | no running animations; `.step` computed `animation-name` is `none` |
| OC7 | Motion allowed | no-preference, click Next | `.step` `animation-name` is `slide-in-forward…` (not `none`); before any move it is `none` |

### 5.5 Notification rules (`notifications.ts`)
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| N1 | Targeting: everyone | `n-all-hands` | targeted for p-jordan, p-lena, p-noah |
| N2 | Targeting: team | `n-support-rota` | targeted for p-jordan only (of the viewers) |
| N3 | Targeting: person | `n-equipment-lena` | p-lena only |
| N4 | Targeting: two teams | `n-security-refresher` | p-jordan and p-lena, not p-noah |
| N5 | Initial unread | INITIAL_STATE | jordan 4, lena 3, noah 2; Jordan's unseen ids `[n-all-hands, n-support-rota, n-security-refresher, n-welcome-jordan]`; seen `[n-wellbeing]` |
| N6 | Mark read ok | Jordan, `n-support-rota` | ok, unread 3; seen includes it; Lena's seen unchanged; INITIAL not mutated; `"Marked as read: New weekend rota for the Support Desk. 3 unread notifications left."` |
| N7 | Already read | Jordan, `n-wellbeing` | `already-read`, same state; `"New wellbeing guides is already marked as read."` |
| N8 | Not targeted | Jordan, `n-design-tokens` | `not-targeted`; `"That notification isn't addressed to the person you're viewing as."` |
| N9 | Unknown notification | Jordan, `n-nope` | `unknown-notification`; `"That notification is not part of this demo."` |
| N10 | Mark all | Jordan | ok, count 4; unread 0; `"Marked 4 notifications as read. No unread notifications left."` |
| N11 | Mark all with nothing unread | after N10 | `nothing-unread`, same state; `"There are no unread notifications for Jordan Reyes."` |
| N12 | Set viewer ok | `p-lena` | ok, unread 3; `"Now viewing as Lena Kowalski (Web team). 3 unread notifications."` |
| N13 | Same viewer | `p-jordan` on INITIAL | ok, same state object |
| N14 | Unknown viewer | `p-sam` | `unknown-viewer`, same state; `"That person is not part of this demo."` |
| N15 | Read state per viewer | Jordan marks all, then setViewer lena | Lena unread still 3 |
| N16 | Kudos: missing recipient | `("p-jordan","","high-five")` | `missing-recipient`, field `recipient`; `"Choose a colleague to send kudos to."` |
| N17 | Kudos: unknown recipient | `("p-jordan","p-nobody","high-five")` | `unknown-recipient`, field `recipient`; `"That colleague isn't part of this demo."` |
| N18 | Kudos: self | `("p-jordan","p-jordan","high-five")` | `self`, field `recipient`; `"You can't send kudos to yourself."` |
| N19 | Kudos: missing message | `("p-jordan","p-lena","")` | `missing-message`, field `message`; `"Choose a kudos message."` |
| N20 | Kudos: unknown message | `("p-jordan","p-lena","hug")` | `unknown-message`, field `message`; `"That kudos message isn't available."` |
| N21 | Kudos: unknown sender | `("p-nobody","p-lena","high-five")` | `unknown-sender`, field `null`; `"Choose who you are viewing as before sending kudos."` |
| N22 | Kudos: both missing | `("p-jordan","","")` | first error only: `missing-recipient` |
| N23 | Send kudos ok | INITIAL, `("p-lena","high-five")` | ok; `feed[0]` = `{id:"kudos-1",kind:"kudos",fromId:"p-jordan",toId:"p-lena",presetId:"high-five",dateLabel:"Just now"}`; kudosSent 1; feed length 5; `"Kudos sent: Jordan Reyes gave Lena Kowalski a High Five."`; `feedItemText` → `"Jordan Reyes gave Lena Kowalski kudos: High Five"` |
| N24 | Second kudos id | after N23, `("p-sam","thank-you")` | id `"kudos-2"` |
| N25 | Failed kudos | invalid input | same state object |
| N26 | Audience text | Jordan: security-refresher / welcome-jordan / all-hands; Lena: welcome-jordan | `"Support Desk team, Web team"` / `"You"` / `"Everyone"` / `"Jordan Reyes"` |
| N27 | Reset | any | INITIAL_STATE object |
| N28 | unreadPhrase | 1 / 0 / 3 | `"1 unread notification"` / `"0 unread notifications"` / `"3 unread notifications"` |

### 5.6 Notification store and component
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| NS1 | Snapshots | new store | INITIAL_STATE for both |
| NS2 | Failed actions don't notify | `markRead("n-wellbeing")`, `setViewer("p-jordan")`, `sendKudos("", "")` | listener not called |
| NC1 | Mark one, focus moves to next | click "Mark as read: New weekend rota for the Support Desk" | status N6 text; focus on button "Mark as read: Complete the security refresher"; badge "3 unread" |
| NC2 | Mark last remaining | Jordan: mark welcome-jordan when it is the only unseen item (mark all others first) | focus `#nc-unseen-heading`; "You're all caught up." visible |
| NC3 | Mark all | click Mark all as read | status N10 text; focus `#nc-unseen-heading`; badge "0 unread"; click again → N11 text |
| NC4 | Viewer switch | select p-lena | heading "Notifications for Lena Kowalski"; badge "3 unread"; "Your equipment request was approved" visible; "Welcome to the team, Jordan" absent; status N12 text |
| NC5 | Kudos empty submit | submit with nothing chosen | status and `#nc-kudos-error` show N16 text; focus on `#nc-kudos-recipient`; `aria-invalid="true"` |
| NC6 | Kudos no message | recipient p-lena, submit | N19 text; focus `#nc-kudos-preset-high-five` |
| NC7 | Kudos success | p-lena + High Five, submit | N23 announcement; first feed item contains "Jordan Reyes gave Lena Kowalski kudos: High Five" and "Just now"; recipient select value `""`; error removed |
| NC8 | Viewer switch to the chosen recipient | recipient p-lena, then viewer p-lena | recipient select value resets to `""` and the options exclude Lena |
| NC9 | Repeated Reset | Reset ×3 | alternating raw text, same visible `RESET_ANNOUNCEMENT` |

### 5.7 Map rules (`employee-map.ts`)
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| M1 | Initial | INITIAL_STATE | 12 visible; `summaryLabel` "Showing 12 of 12 people" |
| M2 | Filter Engineering | `"engineering"` | ok, count 4; visible ids `[p-priya, p-marcus, p-tomas, p-lena]`; `"Showing 4 people in Engineering."` |
| M3 | Filter all | `"all"` from engineering | ok, count 12; `"Showing all 12 people."` |
| M4 | Unknown department | `"finance"` | `unknown-department`, same state; `"That department is not part of this demo."` |
| M5 | Same filter | `"all"` on INITIAL | ok, same state object |
| M6 | Select person | `"p-avery"` | ok, selectedId p-avery |
| M7 | Unknown person | `"p-nobody"` | `unknown-person`, same state |
| M8 | Same person | `"p-avery"` when already selected | ok, same state object |
| M9 | Filter keeps selection | select p-avery, then filter engineering | selectedId still p-avery |
| M10 | Close when nothing is open | INITIAL | same state object |
| M11 | Relationships | lena / avery / priya / sam / jordan | manager(lena)=tomas; manager(avery)=undefined; reports(priya)=[marcus, tomas]; reports(avery)=[sam]; reports(sam)=[]; manager(jordan)=ruth |
| M12 | Labels | avery / jordan | `"Avery Lin, Product Design, near Harbor City"` / `"You: Jordan Reyes, Customer Support, near Maple Grove"`; `describeLocation(avery)` = `"near Harbor City, Coastal Region"` |
| M13 | Positions | avery / jordan | `{left:"13.333%", top:"30%"}` / `{left:"86.667%", top:"65%"}` |
| M14 | formatPeople | 1 / 2 | `"1 person"` / `"2 people"` |
| M15 | Reset | any | INITIAL_STATE object |

### 5.8 Map store and component
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| MS1 | Snapshots | new store | INITIAL_STATE |
| MS2 | No-ops don't notify | `setDepartment("all")`, `setDepartment("finance")`, `closeProfile()`, `selectPerson("p-nobody")` | listener not called |
| MC1 | Marker opens card | click "Avery Lin, Product Design, near Harbor City" | `#map-profile-heading` focused with text "Avery Lin"; card shows "Head of Product Design", "near Harbor City, Coastal Region (approximate)", "No manager listed", direct report button "View profile: Sam Okafor" |
| MC2 | Card navigation then close | in Avery's card click "View profile: Sam Okafor", then Close profile | heading "Sam Okafor" focused; after close, focus on marker "Sam Okafor, Product Design, near Westmoor" |
| MC3 | List open then close | click table button "View profile: Lena Kowalski", then Close | heading "Lena Kowalski" focused; after close, focus on `#map-row-p-lena` |
| MC4 | Close when the person is filtered out | open Avery via marker, filter engineering, Close | focus `#map-department` |
| MC5 | Filter | select engineering | status M2 text; 4 markers; 4 table rows; summary "Showing 4 of 12 people" |
| MC6 | Current user | initial render | marker named "You: Jordan Reyes, Customer Support, near Maple Grove" with visible text "You"; table row contains "You"; opening it gives heading "Jordan Reyes (you)" |
| MC7 | Repeated Reset | Reset ×3 | alternating raw text, visible RESET_ANNOUNCEMENT |
| MC8 | 360 px layout | viewport 360×740 | no page overflow; every marker box inside the map box; no two marker boxes intersect |

### 5.9 Content and e2e regressions
| # | Scenario | Input | Expected Behavior |
|---|---|---|---|
| C1 | Markdown status | each project doc | intranet docs `published`, others `placeholder` |
| C2 | "anonymised" search | `/search?q=anonymised` | still 4 results; intranet README "Matched in document text", first mark "anonymised" |
| C3 | Links valid | both intranet docs | `findLinkProblems` → `[]` |
| C4 | Placeholder copy | view-placeholders | 15 entries, distinct, `[Placeholder]` prefix, no digits, no map key |

---

## 6. Test Specification

General rules for every component test:
- Start the file with `// @vitest-environment jsdom`.
- Use `cleanup()` and `<store>.reset()` in `afterEach`.
- Use the helper `const visible = (t: string | null) => (t ?? "").replace(/​/g, "")`.

### `app/content/registry.test.ts` (modify)
```
test "contains 19 views (4 demos), 8 Markdown docs and the top-level pages"    [R6]
  Change: views 19; demos 4; markdown 8; entries 19 + 8 + 6.
test "prerenders exactly the routable entries"                                  [R6]
  Change: getPrerenderPaths() length 19 + 8 + 5.
test "orders the intranet views as in the case study"                           [R7]  (new)
  Input: getProject("hybrid-wp-react-intranet")!.views
  Expected: slugs exactly R7 list; first four views have demoId === slug; last two have no demoId; project.status === "final"
test "describes projects and views from real copy when supplied"                [R1–R5]  (new)
  Input: describeReadme({ title: "T", summary: "S." }), describeTechnicalRequirements(same),
         describeReadme({ title: "T" }), describeTechnicalRequirements({ title: "T" }),
         describeView({ title: "T" }, { demoId: "x", description: "D." }),
         describeView({ title: "T" }, { demoId: "x" }), describeView({ title: "T" }, {})
  Expected: exact strings from R1–R5
test "uses the intranet summary and view descriptions in the registry"          [R1, R3, R4, R5]  (new)
  Expected: getEntryById("doc:hybrid-wp-react-intranet:readme").description === project.summary;
            technical-requirements === `Technical requirements for Hybrid WordPress + React Intranet. ${summary}`;
            each of the 3 new views' description === view.description;
            office-booking-calendar === "Interactive sample-data demo from Hybrid WordPress + React Intranet.";
            employee-directory === "Placeholder view from Hybrid WordPress + React Intranet. Placeholder — content to be supplied in phase 2.";
            doc:headless-wp-educational-app:readme === "Project summary for Headless WordPress Educational App. Placeholder — content to be supplied in phase 2."
test "keeps 'anonymised' out of intranet registry descriptions"                 [R8]  (new)
  Expected: no intranet entry description matches /anonymi[sz]ed/i
  Why: protects the e2e "anonymised" search count (C2)
```

### `app/content/view-placeholders.test.ts` (modify) [C4]
```
Change every 16 → 15 (test title, toHaveLength, both Set sizes).
test "no longer has copy for the map, and describes the intranet panels" (new)
  Expected: viewPlaceholders["view:hybrid-wp-react-intranet:interactive-remote-employee-map"] is undefined;
            employee-directory summary contains "manager and direct reports"; documentation-system summary contains "grouped by category"
```

### `app/lib/markdown/render.test.ts` (modify) [C1, C3]
```
test "%s is well-formed content" (rename from "…placeholder content")
  Change: expect(doc.frontmatter.status).toBe(getProject(entry.projectId!)!.status === "final" ? "published" : "placeholder")
  (import getProject from "~/content/registry"; the rest unchanged — the ≥3 h2, h3, table and callout assertions must pass for the new docs)
```

### `app/demos/index.test.ts` (modify)
```
test "resolves every demo to a component" — it.each over ["office-booking-calendar","onboarding-wizard","notification-center","interactive-remote-employee-map"]: component is a function, description is truthy and matches /nothing is saved/
test "registers exactly four demos" — DEMO_IDS has length 4
(keep the existing tests)
```

### `app/fixtures/intranet/intranet.test.ts` (new)
```
test_people_reference_valid_teams_departments_and_managers   [F1]
  Input: PEOPLE
  Expected: ids === [...PERSON_IDS]; getTeam/getDepartment defined; team.departmentId === person.departmentId; manager in same department and !== self; walking managerId reaches null within 12 steps
test_department_counts                                        [F1]
  Expected: design 2, engineering 4, people-culture 2, operations 2, support 2
test_markers_are_spaced_for_24px_targets                       [F2]
  Expected: every pair: |dx| >= 70 || |dy| >= 60; pairs with p-jordan: |dx| >= 80 || |dy| >= 60
  Why: prevents the axe target-size failure at 360px
test_markers_inside_map                                        [F3]
  Expected: integers; MAP_EDGE_MARGIN <= x <= MAP_WIDTH - MAP_EDGE_MARGIN; same for y
test_notification_audiences_are_valid                          [F4]
test_initial_seen_only_contains_targeted_notifications         [F5]
  Expected: also VIEWER_IDS map to 3 distinct teamIds
test_fixtures_contain_nothing_sensitive                         [F6]
  Input: JSON.stringify({ PEOPLE, TEAMS, DEPARTMENTS, NOTIFICATIONS, INITIAL_FEED, ONBOARDING_STEPS, DASHBOARD_NAV_ITEMS, KUDOS_PRESETS })
  Expected: not.toMatch(/@|https?:|password|secret|token|api[_ -]?key/i)
test_onboarding_fixtures                                        [F7]
  Expected: 5 steps with unique ids and non-empty title/paragraphs; 6 nav items with unique ids
```

### `app/demos/onboarding-wizard/onboarding.test.ts` (new)
```
test_initial_progress                          [O1]  progress(INITIAL_STATE) toEqual {current:1,total:5,percent:20,label:"Step 1 of 5"}; isNavUnlocked false
test_next_from_first_step                      [O2]  result ok, stepIndex 1, INITIAL_STATE.stepIndex still 0; describeMove exact
test_back_on_first_step                        [O3]
test_next_on_last_step                         [O4]
test_back_from_middle                          [O8]
test_complete_before_last_step                 [O5]
test_complete_on_last_step                     [O6]  includes progress and isNavUnlocked true
test_actions_after_completion                  [O7]
test_reset_returns_initial_object              [O9]
Why: covers every transition and every announcement string.
```

### `app/demos/onboarding-wizard/store.test.ts` (new)
```
test_snapshots                                  [OS1]
test_notifies_on_change_not_on_failure          [OS2]  next() → 1 call; back() at step 1 and complete() at step 1 on a fresh store → 0 calls
test_reset_quiet_when_pristine_and_notifies_once [OS3]
test_unsubscribe_and_independent_stores
```

### `app/demos/onboarding-wizard/OnboardingWizard.test.tsx` (new)
```
test_next_moves_focus_and_announces    [OC1]
test_back_disabled_on_first_step       [OC2]
test_complete_unlocks_navigation       [OC3]  getAllByText("Available") length 6, queryAllByText("Locked") length 0, queryByRole("button",{name:"Next"}) null
test_reset_repeats_announcement        [OC4]
test_no_focus_on_mount_or_reset        [OC5]
test_progressbar_semantics             [O1]   role progressbar name "Onboarding progress": aria-valuenow "1", aria-valuemax "5", aria-valuetext "Step 1 of 5"
```

### `app/demos/notification-center/notifications.test.ts` (new)
```
test_targeting_everyone / _team / _person / _two_teams          [N1–N4]
test_initial_unseen_and_seen                                     [N5]
test_mark_read_ok_is_immutable_and_per_viewer                    [N6]
test_mark_read_failures                                          [N7, N8, N9]
test_mark_all_and_nothing_unread                                 [N10, N11]
test_set_viewer                                                  [N12, N13, N14]
test_read_state_is_per_viewer                                    [N15]
test_validate_kudos_each_error_in_order                          [N16–N22]
test_send_kudos_prepends_feed_item_with_counter_id               [N23, N24]
test_failed_kudos_returns_same_state                             [N25]
test_describe_audience                                           [N26]
test_reset                                                       [N27]
test_unread_phrase                                               [N28]
```

### `app/demos/notification-center/store.test.ts` (new)
```
test_snapshots                              [NS1]
test_failed_actions_do_not_notify           [NS2]
test_mark_read_notifies_once
test_reset_quiet_when_pristine
test_unsubscribe_and_independent_stores
```

### `app/demos/notification-center/NotificationCenter.test.tsx` (new)
```
test_mark_one_moves_focus_to_next_item     [NC1]
test_mark_last_item_focuses_heading        [NC2]
test_mark_all                              [NC3]
test_viewer_switch_changes_targeting       [NC4]
test_kudos_requires_recipient              [NC5]
test_kudos_requires_message                [NC6]
test_kudos_success_updates_feed            [NC7]
test_switching_viewer_clears_self_recipient [NC8]
test_reset_repeats_announcement            [NC9]
```

### `app/demos/interactive-remote-employee-map/employee-map.test.ts` (new)
```
test_initial_visible_and_summary        [M1]
test_filter_engineering                 [M2]
test_filter_all                         [M3]
test_unknown_department                 [M4]
test_same_filter_is_noop                [M5]
test_select_person                      [M6]
test_unknown_person                     [M7]
test_same_person_is_noop                [M8]
test_filter_keeps_selection             [M9]
test_close_when_nothing_open            [M10]
test_relationships                      [M11]
test_labels_and_location                [M12]
test_marker_positions                   [M13]
test_format_people                      [M14]
test_reset                              [M15]
```

### `app/demos/interactive-remote-employee-map/store.test.ts` (new)
```
test_snapshots                 [MS1]
test_noops_do_not_notify       [MS2]
test_select_and_close_notify
test_unsubscribe_and_independent_stores
```

### `app/demos/interactive-remote-employee-map/InteractiveRemoteEmployeeMap.test.tsx` (new)
```
test_renders_12_markers_and_12_rows          [M1]  within(getByTestId("map-markers")).getAllByRole("button") length 12; table rowheaders 12
test_marker_opens_profile                    [MC1]
test_card_navigation_and_close_restores_marker_focus [MC2]
test_list_open_and_close_restores_row_focus  [MC3]
test_close_after_filter_focuses_select       [MC4]
test_filter_updates_markers_rows_and_status  [MC5]
test_current_user_is_labelled                [MC6]
test_reset_repeats_announcement              [MC7]
```

### `e2e/onboarding-wizard.spec.ts` (new; model on `booking.spec.ts`)
Setup:
- `DEMO = "/portfolio/hybrid-wp-react-intranet/views/onboarding-wizard"`.
- Reuse the `collectErrors`, `main`, `status` and `explorer` helpers from booking.spec.
- Default viewport 1440×900.

```
test "prerendered HTML contains step 1 and the locked navigation"
  Expected (request.get text): contains "Welcome to the intranet", "Step 1 of 5", 'role="progressbar"', "Locked", "nothing is saved"
test "renders step 1 with progress semantics"                          [O1, OC2]
  progressbar aria-valuenow "1", aria-valuetext "Step 1 of 5"; Back disabled; 6× "Locked"; errors []
test "Next and Back move focus to the step heading and announce"     [OC1, O8]
  Next → heading "How the intranet is organised" focused; status "Step 2 of 5: How the intranet is organised."
  Back → heading "Welcome to the intranet" focused; status "Step 1 of 5: Welcome to the intranet."
test "completing onboarding unlocks the dashboard navigation"        [OC3, O6]
  Next ×4 → "Complete onboarding" visible and Next count 0; click → heading "Onboarding complete" focused;
  status "Onboarding complete. The dashboard navigation is now unlocked."; 6× "Available"; testid onboarding-nav-state "Unlocked: the header and navigation are now available."
test "progress persists across navigation; reload restores the fixtures"
  Next ×2 → explorer link "notification-center.html" → explorer link "onboarding-wizard.html"
  → progress label "Step 3 of 5" and heading "Set up your profile" NOT focused → reload → "Step 1 of 5"; errors []
test "Reset demo restores step 1, announces and keeps focus"         [O9]
  After completing → Reset → "Step 1 of 5"; status "Demo reset. Onboarding starts again at step 1."; Reset focused
test "announcements repeat on repeated Reset"                         [OC4]  (same pattern as booking)
test "keyboard-only: Tab to Next, Enter, Tab to Back, Space"
  Tab until Next focused (≤ 60); outline-style solid; Enter → step heading focused;
  Tab → Back focused; Tab → Next focused; Space → status "Step 3 of 5: Set up your profile."
test "slides only when motion is allowed"                             [OC7]
  initial testid onboarding-step animation-name "none"; click Next → animation-name not "none"
describe "reduced motion" (test.use({ reducedMotion: "reduce" }))
  test "no animation or transition on step change"                   [OC6]
    click Next; testid onboarding-step animation-name "none";
    document.getAnimations().length 0; progress fill transitionDuration "0s"
describe "at 360px"
  test "fits without horizontal scroll and completes"
    horizontalOverflow {doc:0, main:0} before and after completing; errors []
```

### `e2e/notification-center.spec.ts` (new)
```
test "prerendered HTML contains the default viewer's inbox"
  contains "Notifications for Jordan Reyes", "4 unread", "Welcome to the team, Jordan", "Send kudos", "nothing is saved"
test "unseen and seen lists for the default viewer"                   [N5]
  unseen-list li count 4; seen-list li count 1; unread-count "4 unread"
test "Viewing as shows targeted notifications per person"             [NC4, N12]
  selectOption("#nc-viewer", "p-lena") → status "Now viewing as Lena Kowalski (Web team). 3 unread notifications."; "3 unread"; contains "Your equipment request was approved"; not "Welcome to the team, Jordan"
  selectOption "p-noah" → "2 unread"; contains "Onboarding buddies needed"; not "Design tokens update ships Wednesday"
test "mark one as read moves it to Seen and focuses the next item"    [NC1, N6]
test "mark all as read, then again"                                   [NC3, N10, N11]
test "read state is kept per viewer"                                  [N15]
  Jordan mark all → viewer Lena → "3 unread" → viewer Jordan → "0 unread"
test "kudos validation and success"                                   [NC5, NC6, NC7]
  Send kudos → status "Choose a colleague to send kudos to." + recipient focused + aria-invalid "true";
  select p-lena → Send → "Choose a kudos message." + radio High Five focused;
  check High Five → Send → "Kudos sent: Jordan Reyes gave Lena Kowalski a High Five."; activity-feed first li contains "Jordan Reyes gave Lena Kowalski kudos: High Five" and "Just now"
test "state persists across navigation; reload restores"
  mark all → explorer to "onboarding-wizard.html" and back → "0 unread" → reload → "4 unread"; errors []
test "Reset demo restores and announces; focus stays"                 [N27]
  status "Demo reset. The sample notifications, read states and kudos were restored."; feed li count 4
test "announcements repeat on repeated Reset"                          [NC9]
test "keyboard-only: Tab to the first Mark as read and press Enter"
  target button "Mark as read: All-hands call moved to Thursday"; Enter → focus on "Mark as read: New weekend rota for the Support Desk"
describe "at 360px": no horizontal overflow before and after sending kudos
describe "reduced motion": after mark all, getAnimations().length 0 and no element under [data-demo] with transition-duration > 0.011s
```

### `e2e/employee-map.spec.ts` (new)
```
test "prerendered HTML contains markers, list and approximate-location copy"
  contains 'aria-label="Avery Lin, Product Design, near Harbor City"', "You: Jordan Reyes, Customer Support, near Maple Grove", "<table", "Showing 12 of 12 people", "approximate", "nothing is saved"
test "renders 12 marker buttons and a 12-row people list"             [M1, MC6]
  getByTestId("map-markers").getByRole("button") count 12; table rowheader count 12; you-marker toHaveText "You"
test "a marker opens the profile card and moves focus to it"          [MC1]
test "manager and direct-report links navigate the card; Close returns focus to the marker" [MC2]
test "the people list opens profiles; Close returns focus to the row" [MC3]
test "department filter updates map, list and summary"                [MC5, M3]
  selectOption("#map-department","engineering") → status "Showing 4 people in Engineering."; 4 markers; 4 rowheaders; summary "Showing 4 of 12 people"; back to "all" → "Showing all 12 people."
test "state persists across navigation; reload restores"
  filter engineering + open Priya → explorer away/back → summary "Showing 4 of 12 people", card heading "Priya Raman" → reload → "Showing 12 of 12 people", heading "Profile"
test "Reset demo restores and announces; focus stays"                  [M15]
  status "Demo reset. All departments are shown and no profile is open."
test "keyboard-only: Tab to a marker and open it with Enter"
  Tab until marker "Avery Lin, Product Design, near Harbor City" focused (≤ 80); outline-style solid; Enter → heading "Avery Lin" focused
describe "at 360px"
  test "markers stay inside the map and never overlap; no page scroll"   [MC8, F2]
    overflow {doc:0, main:0}; each marker box within map box (±0.5); pairwise boxes don't intersect;
    people-list region scrollWidth > clientWidth
describe "reduced motion": getAnimations().length 0 after opening a profile
```

### Existing e2e (modify)
```
e2e/verification.spec.ts
  "the registry has the expected shape": 31 → 33, 30 → 32.
  "keyboard focus is always visible": add [`${HYBRID}/views/onboarding-wizard`,1440], [`${HYBRID}/views/notification-center`,1440], [`${HYBRID}/views/interactive-remote-employee-map`,1440].
  reduced motion "desktop shell, markdown, TOC and demo…": add the three demo URLs to the path list.
e2e/docs-views.spec.ts (README test):
  props toContainText("Sole developer"); tag loop over ["WordPress","React","Redux Toolkit"]; props.getByText("published",{exact:true});
  summary getByText("One place for a remote workforce to connect: a React single-page app built into a WordPress theme, with onboarding, targeted notifications, a staff map, office booking and role-based access.");
  placeholder-callout assertion unchanged (comment: "the draft Lessons learned callout").
  "prerendered HTML contains the document text": HYBRID text → "This case study is anonymised: the company is described only by its sector, and every person, place and message in the demos is fictional."; TECH text → "A single WordPress install on managed WordPress hosting serves both the content and the application."
e2e/prerender.spec.ts: same README sentence replaces line 64.
e2e/a11y.spec.ts — inside "axe: interactive states at ${vp.name}px" add:
  test "onboarding wizard mid-flow and completed": Next → audit "onboarding: step 2"; Next ×3 + Complete → audit "onboarding: completed"
  test "notification center: viewer switch, mark read, kudos error and success":
    selectOption #nc-viewer p-lena; click "Mark as read: All-hands call moved to Thursday"; audit;
    click Send kudos → error visible; audit "kudos error"; selectOption #nc-kudos-recipient p-jordan; check "High Five"; Send; audit "kudos sent"
  test "employee map filtered with an open profile, then reset":
    selectOption #map-department engineering; click marker "Priya Raman, Engineering, near Northfield"; heading focused; audit; Reset; audit
  hover/focus targets list: add
    ["onboarding Next", `${HYBRID}/views/onboarding-wizard`, p => p.getByRole("button",{ name: "Next", exact: true })],
    ["notification Mark as read", `${HYBRID}/views/notification-center`, p => p.getByRole("button",{ name: "Mark as read: All-hands call moved to Thursday" })],
    ["map marker", `${HYBRID}/views/interactive-remote-employee-map`, p => p.getByRole("button",{ name: "Avery Lin, Product Design, near Harbor City" })]
```

### Integration coverage (between modules)
- `demos/index.test.ts` checks the demo registry against the content registry.
- `registry.test.ts` checks routing, counts and descriptions.
- `render.test.ts` checks link validation against the new view URLs (C3).
- The e2e verification/prerender/a11y loops run over all 32 routes automatically, so the new demo routes are audited without extra code.

### What doesn't need testing
- CSS colours and contrast values beyond the axe audit: axe covers contrast, and the palette reuses tokens that are already checked.
- The SVG outline path geometry: decorative and `aria-hidden`.
- `index.ts` re-export files: covered by the demo registry test.
- Each fixture copy string word for word: only strings used in assertions are pinned.
- `DemoFrame`, `PlaceholderPanel` and `useRepeatableAnnouncement`: unchanged and already tested.
- Other projects' content and the office booking demo: unchanged and covered by existing tests.

---

## 7. Acceptance Criteria

### Registry and content
- [ ] `projects.ts` and `registry.ts` still use relative imports only (no `~/`, `?raw`, CSS).
- [ ] The intranet project has `status: "final"`, `summary`, and the 6 views in the stated order. The 3 new views have `demoId` and `description`.
- [ ] Registry: 33 entries, 32 routes, 19 views, 4 demos, 15 placeholders, 8 Markdown docs.
- [ ] Intranet README/TR/view descriptions contain no "Placeholder" text, except `employee-directory` and `documentation-system`.
- [ ] `view-placeholders.ts` has 15 keys, with no `interactive-remote-employee-map` key.
- [ ] Both intranet Markdown docs have `status: published`, no code blocks, no images, no `[Placeholder]` outside the Lessons draft callout, and all links pass validation.
- [ ] "anonymised" appears only in the intranet README body (`grep -rni anonymi content/projects/hybrid-wp-react-intranet/technical-requirements.md app/content app/demos app/fixtures/intranet` returns nothing).
- [ ] No client name, agency name, real staff name, email, credential, ACF field key or brand colour appears anywhere (manual review by Garth).

### Fixtures
- [ ] `app/fixtures/intranet/` exports exactly the names in §3.3, and every integrity, spacing and sensitivity test passes.

### Each demo
- [ ] Prop-less component with a CSS Module and an `index.ts` default export, registered in `app/demos/index.ts` with `description` and `meta`.
- [ ] Module store with `getServerSnapshot` = `INITIAL_STATE`. The pure rules module has 100% branch coverage of its result reasons in the tests.
- [ ] `grep -rnE "Math\.random|Date\.now|new Date|localStorage|sessionStorage|document\.cookie|indexedDB|fetch\(" app/demos/onboarding-wizard app/demos/notification-center app/demos/interactive-remote-employee-map app/fixtures/intranet` returns nothing.
- [ ] Visible "Reset demo"; one polite `role="status"` region using `useRepeatableAnnouncement`; body text says the data is fictional and nothing is saved.
- [ ] Headings start at h2; there is no h1 in the demo.
- [ ] Prerendered HTML contains the meaningful starting state (e2e "prerendered HTML …" tests).
- [ ] Keyboard-only use works; focus moves exactly per §4.4.
- [ ] No horizontal page scroll at 360 px; transitions and animations exist only under `prefers-reduced-motion: no-preference`.
- [ ] No meaning by colour alone: "Locked"/"Available", "Read", the "Kudos"/"Announcement" labels, the "You" marker text and the legend.
- [ ] axe passes at 1440 and 360 for the route and the interactive states.

### Docs
- [ ] `docs/demos.md`, `docs/content-registry.md`, `docs/phase-2-content-needs.md`, `docs/testing.md` and `README.md` are updated as described in §4.6. `app/data/home.ts` has the real blurb.

### Overall system
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run test:e2e` passes. It builds and then runs Playwright; never run a build while e2e is running.
- [ ] The README Lessons learned section is inside a single `> [!placeholder] Draft — awaiting review` callout, and changes are left uncommitted for Garth's approval.

---

## 8. Implementation Order

1. **`app/fixtures/intranet/*` + `intranet.test.ts`, and the comment in `app/fixtures/index.ts`.** Everything else depends on them. Run `npx vitest run app/fixtures`.
2. **The three demos.** Each needs only step 1. They can be built in parallel:
   - 2a `onboarding-wizard`: `onboarding.ts` → tests → `store.ts` → tests → component, CSS and tests → `index.ts`
   - 2b `notification-center`: same sequence
   - 2c `interactive-remote-employee-map`: same sequence
3. **`app/demos/index.ts` and `index.test.ts`.** Depends on 2. The "vice versa" check in `index.test.ts` will fail until step 4 lands, so do 3 and 4 together before running the suite.
4. **`projects.ts`, `registry.ts` (helpers), `registry.test.ts`, `view-placeholders.ts` and its test.** Depends on 3, because a `demoId` needs a registered demo.
5. **Markdown rewrite (both intranet files) and the `render.test.ts` status change.** Depends on 4, because the links to the new view URLs must be registered.
6. **`app/data/home.ts` and the docs (`docs/*.md`, `README.md`).** Depends on 4 and 5 for the final counts and wording. Can run in parallel with 7.
7. **e2e: modify `verification`, `docs-views`, `prerender` and `a11y`; create the 3 new specs.** Depends on 2–5.
8. **Verify:** `npm run typecheck` → `npm test` → `npm run test:e2e`. Do not run `npm run build` separately while Playwright is running.

- Can run in parallel: 2a, 2b and 2c; step 6 alongside step 7.
