# Prototype Design Spec

Implementation-ready extraction of `prototype.html` (the visual reference for the editor-style portfolio). Nobody should need to open or decode the prototype again.

- **Source:** `.claude/docs/design/prototype.html`, a bundler export. It holds a compressed React runtime, a ~46 KB design-canvas runtime, base64 fonts and one template. The template is a single component with **all styles inline**. There are no classes, no stylesheet, no media queries, no transitions and no hover or focus rules.
- **Reference screenshots:** `.claude/docs/design/screens/` (1440 x 900).
  - `01-readme-desktop-1440.png`
  - `02-demo-panel-desktop-1440.png`
  - `03-package-json-terminal-done-1440.png`
- **Conventions in this document:**
  - "Prototype:" marks a value taken verbatim from the prototype.
  - "Proposed:" marks a recommendation where the prototype is silent or wrong.
  - "Not in prototype" marks anything genuinely absent.
  - Values with no unit are px.
  - Hex values are exact.
- **Contrast ratios** quoted below were computed with the WCAG formula.

---

## 1. Color tokens

The prototype uses **14 distinct dark-shell colors** plus a small light palette for the demo panel. Proposed token names are in the right-hand column.

### 1.1 Surfaces (charcoal, darkest to lightest)

| Hex | Prototype usage | Token |
|---|---|---|
| `#101216` | Title bar, tab strip, terminal panel | `--color-surface-0` (chrome / deepest) |
| `#14161b` | Page and `body` background (visible only as the outer canvas) | `--color-bg` |
| `#181b21` | Explorer sidebar | `--color-surface-1` |
| `#1a1d24` | Editor/content area; the active tab (matches content so it looks "open") | `--color-surface-2` |
| `#20242c` | Metadata bar, table header row | `--color-surface-3` (raised) |
| `#2a3140` | Active explorer row | `--color-surface-selected` |
| `#1f2a3a` | Callout background (blue-tinted) | `--color-callout-info-bg` |

### 1.2 Borders

| Hex | Usage | Token |
|---|---|---|
| `#262a33` | Chrome dividers: title bar bottom, explorer right, tab strip bottom, tab separators, terminal top and header bottom | `--color-border` |
| `#2c313c` | Content borders: metadata bar, table outer and row lines | `--color-border-content` |
| `#e4e7ee` | Light demo panel header divider | `--color-demo-border` |

### 1.3 Text

| Hex | Usage | Contrast | Token |
|---|---|---|---|
| `#ffffff` | Headings (h1, h2), active explorer row, active tab, terminal input text, status bar text | n/a | `--color-text-strong` |
| `#d4d7de` | Body text, global shell text, table values, terminal answers | 11.7:1 on surface-2 | `--color-text` |
| `#c2c7d2` | Explorer row labels (inactive) | 10.2:1 on surface-1 | `--color-text-explorer` (may merge with `--color-text`) |
| `#8b93a3` | Muted: title bar text, panel headers ("EXPLORER", "TERMINAL"), chevrons, inactive tab text, metadata keys, JSON separators and notes, terminal welcome line | 5.5:1 on surface-2 and 6.1:1 on surface-0 | `--color-text-muted` |
| `#5d6575` | Line numbers; folder "dot" icon | **2.9:1 on surface-2 (fails AA text)** | `--color-text-faint` |
| `#566074` | Muted text inside the light demo panel | 6.3:1 on white | `--color-demo-text-muted` |
| `#1d2330` | Primary text inside the light demo panel | n/a | `--color-demo-text` |

Proposed: lighten `--color-text-faint` to `#808899` (4.7:1 on surface-2) for line numbers. Keep the original `#5d6575` only for the non-text folder dot.

### 1.4 Blue accents

| Hex | Usage | Token |
|---|---|---|
| `#7cc4ff` | Links, callout label and left border, active-tab top bar, `.md` icon dot | `--color-accent` |
| `#b3dcff` | Link hover | `--color-accent-hover` |
| `#2b6cb0` | Status bar background (white text, 5.4:1) | `--color-accent-status` |

### 1.5 Syntax-highlight colors (JSON view, terminal prompt, file-icon dots)

| Hex | Prototype usage | Token |
|---|---|---|
| `#5fc7b8` (teal) | JSON keys; terminal prompts/questions; `.tsx` dot | `--color-syntax-key` |
| `#e5b567` (amber) | JSON string values and braces; `#hashtags` in metadata; `.json` dot | `--color-syntax-string` |
| `#8b93a3` (muted) | JSON separators (`: `), notes | `--color-syntax-punct` (alias of text-muted) |
| `#5d6575` | Line numbers | `--color-syntax-line-number` (alias of text-faint) |
| `#f0a064` (orange) | `.html` dot | `--color-filetype-html` |
| `#7cc4ff` (blue) | `.md` dot | `--color-filetype-md` |
| `#e5b567` | `.json` dot | `--color-filetype-json` |
| `#5fc7b8` | `.tsx` dot | `--color-filetype-tsx` |
| `#7fe0c4` (mint) | `.bash` dot (defined; no bash file shown in the tree) | `--color-filetype-bash` |

Not in prototype: number, boolean and null colors. Proposed: reuse a violet or orange later if the stack data needs them. Phase 1 stack data is string-only, so this is not needed.

### 1.6 Status colors

| Hex | Usage | Token |
|---|---|---|
| `#7fe0c4` on `#1f3a33` | "Live preview" pill | `--color-success` / `--color-success-bg` |
| `#7fe0c4` | Terminal completion message ("Thanks - message sent (demo)") | `--color-success` |
| `#2d6a4a` on `#eef7f1` | Demo "Open" cell | `--color-demo-open-fg` / `--color-demo-open-bg` |
| `#274a8f` on `#dfe9fb` | Demo "booked" cell | `--color-demo-booked-fg` / `--color-demo-booked-bg` |

Not in prototype: error and warning colors (the terminal has no validation states). Proposed:
- `--color-error: #ff8a8a`
- `--color-warning: #e5b567`

Check both for contrast before use.

### 1.7 Shadows

The only shadow is the demo panel's `0 12px 40px rgba(0,0,0,0.4)`. Proposed token: `--shadow-demo-panel`.

---

## 2. Typography

**Families** (self-host both; both are SIL OFL 1.1, so retain the license text from the prototype header comment):

- **Interface:** `'JetBrains Mono', ui-monospace, monospace`. Token: `--font-mono`.
  - Used for: title bar, explorer, tabs and active-file header, status bar, terminal, JSON view.
  - It is the shell's inherited default (`font-family` on the root).
- **Content:** `Inter, system-ui, sans-serif`. Token: `--font-sans`.
  - Used for: the whole content area (Markdown, demo panel, JSON notes).
  - Set on the content wrapper, so it is inherited by anything rendered inside.

**Weights loaded in the prototype:** Inter 400/500/600/700 (embedded Google Fonts files; each weight maps to the same variable file); JetBrains Mono 400/500 (same story). Proposed: ship Inter variable (wght 400–700) and JetBrains Mono variable (400–500), latin plus latin-ext subsets, `font-display: swap`.

**Scale actually used:**

| Role | Font | Size / line-height | Weight | Letter-spacing | Color |
|---|---|---|---|---|---|
| Panel header label ("EXPLORER", "TERMINAL · contact.bash") | mono | 11 / normal | 400 | 0.08em, uppercase as typed | muted |
| Status bar | mono | 11 / normal | 400 | none | `#fff` |
| Title bar | mono | 12 / normal | 400 | none | muted |
| Tab / (proposed) active-file header | mono | 12 / normal | 400 | none | `#fff` active, muted inactive |
| Shell base (explorer rows, terminal) | mono | 13 / normal (explorer); 13 / 1.7 (terminal) | 400 | none | explorer `#c2c7d2`, terminal `#d4d7de` |
| JSON code | mono | 13.5 / 2 (27px row) | 400 | none | see 1.5 |
| JSON notes | sans, italic | 13 / 2 | 400 | none | muted |
| Metadata bar | sans | 13 / 1.7 (inherits) | 400, values 500 | none | muted, values `#d4d7de` |
| Callout | sans | 15 / 1.7 | 400, label 600 | none | `#d4d7de`, label accent |
| Table | sans | 14 / 1.7 | 400 (th: browser-default bold, 700) | none | `#d4d7de` |
| Body | sans | 16 / 1.7 | 400 | none | `#d4d7de` |
| h2 | sans | 22 / 1.7 inherited (~37px box); tighten to 1.3 | 700 (browser default) | none | `#fff` |
| h1 | sans | 36 / 1.2 | 700 | none | `#fff` |
| Demo panel title | sans | 18 / 1.7 | 700 | none | `#1d2330` |
| Demo panel body | sans | 13 | 400 (headers 700, cells 400 or 600) | none | see 5.3 |

Not in prototype: h3 to h6, inline code, code-block, blockquote, small, kbd. See 5.1 for proposed values.

---

## 3. Layout

### 3.1 Desktop structure at 1440 x 900

```
+--------------------------------------------------------------------------+
| TITLE BAR  36 + 1px border (=37)   "portfolio > ... > file.ext — portfolio"|  #101216
+----------------+---------------------------------------------------------+
| EXPLORER       | TAB STRIP (prototype) 37px  -> REPLACE with active-file |
| 280px wide     |   header + breadcrumbs (see 3.3)                        |
| #181b21        +---------------------------------------------------------+
| padding 12 0   | CONTENT  (flex 1, scroll-y, min-height 420)  #1a1d24    |
| border-right   |                                                         |
| 1px #262a33    |   Inter content / light demo panel / JSON view          |
|                |                                                         |
|                +---------------------------------------------------------+
|                | TERMINAL  210px (border-top 1px #262a33)  #101216       |
|                |   header 8/16 pad, body 10/16 pad                       |
+----------------+---------------------------------------------------------+
| STATUS BAR 24px  "main" (left)            current path (right)  #2b6cb0 |
+--------------------------------------------------------------------------+
```

- **Root:** column flex, `min-height: 900`, background `#14161b`, shell font 13px mono, text `#d4d7de`.
  - Title bar, then a flex-grow row, then status bar.
  - Prototype quirk: the root is `min-height: 900` and **not** pinned to the viewport, so the whole page grows with content (it reached 1388px tall with the README, and the terminal sat far below the fold).
  - Proposed: root is `height: 100dvh`; only the explorer, content and terminal scroll internally (the plan calls for this).
- **Row:** `display: flex; flex-wrap: wrap` containing the explorer (`flex: 0 0 280px`) and the editor column (`flex: 999 1 520px; min-width: 0`).
- **The terminal lives inside the editor column**, below the content. It is not under the explorer, so the explorer runs full height.
  - This matches the brief: "bottom, right panel".
  - Measured at 1440: explorer x=0..280, editor column x=280..1440, terminal 1160 x 210.

### 3.2 Measurements

| Region | Size | Background | Border | Padding | Notes |
|---|---|---|---|---|---|
| Title bar | height 36 + 1 border = **37** (content-box) | `#101216` | bottom 1px `#262a33` | none | Flex-centered text, 12px, muted. Text is the current path with ` › ` separators plus ` — portfolio`. |
| Explorer | **280** wide (`flex 0 0 280`, border-box) | `#181b21` | right 1px `#262a33` | `12px 0` | `overflow-y: auto`. Header "EXPLORER" has `padding: 0 16px 8px`. |
| Tab strip (prototype) | **37** (10px pad + 12px text + 1px border) | `#101216` | bottom 1px `#262a33` | per tab `10px 18px` | `overflow-x: auto`. See 3.3. |
| Content | flex 1, min-height 420 | `#1a1d24` | none | per renderer | `overflow-y: auto`. Inter. |
| Terminal | **210** (border-box, `flex: none`) | `#101216` | top 1px `#262a33` | header `8px 16px`; body `10px 16px` | Header bottom border 1px `#262a33`. Body `flex 1; overflow-y: auto; line-height 1.7`. |
| Status bar | **24** (`flex: none`) | `#2b6cb0` | none | `0 14px` | `space-between`, 11px, white, centered vertically. |

### 3.3 Tab strip, replaced by the active-file header

Prototype tab: `border: 0; border-right: 1px solid #262a33; padding: 10px 18px; font 12px mono; white-space: nowrap`.
- Active: bg `#1a1d24`, text `#fff`, `box-shadow: inset 0 2px 0 #7cc4ff`.
- Inactive: bg `#101216`, text `#8b93a3`.

The plan replaces the strip with a single active-file header and breadcrumbs. Proposed, reusing prototype chrome:
- One 37px bar: bg `#101216`, border-bottom 1px `#262a33`.
- It contains one "tab-like" cell for the active file: bg `#1a1d24`, text `#fff`, 12px mono, padding `10px 18px`, `inset 0 2px 0 #7cc4ff`, and a file-type dot (7x7).
- Breadcrumbs sit in the same bar to the right of the cell: 12px mono muted, ` › ` separators, last crumb `#fff`.
- The title bar can keep the `— portfolio` text.
- At narrow widths breadcrumbs may collapse with an ellipsis, as the prototype did in the calendar crumb: `portfolio › … › views › office-booking-calendar.html`.

### 3.4 Status bar content

Left: `main` (a fake git branch). Right: the current crumb, with the same text as the title bar crumb. Both are 11px white on `#2b6cb0`.

### 3.5 Responsive behavior in the prototype

Not in prototype in any intentional form. There is no `<meta viewport>` and no media queries.
- **Effect on a phone:** the browser lays out at the legacy 980px width, so the page renders as a scaled-down desktop. (In an emulated 375px browser the layout width measured **980px**.)
- **The only adaptive behavior** is accidental flex-wrap: if the layout viewport is under 800px (280 + 520), the editor column wraps below the explorer. Nothing hides, collapses or turns into a drawer.
- Internal wrapping that does work, and should be kept:
  - Metadata bar wraps (`flex-wrap`, gap `8px 24px`).
  - Demo panel header wraps (gap 8).
  - Table and demo grid scroll horizontally in their own containers (`overflow-x: auto`).
  - Explorer labels wrap onto a second line (e.g. `office-booking-` / `calendar.html`; row grows from 25.5 to 43px). This satisfies "keep long filenames readable".
  - JSON rows wrap (`flex-wrap`).

Proposed (from the plan): below 900px, the explorer becomes a dismissible drawer and the terminal starts collapsed.

---

## 4. Explorer

### 4.1 Row anatomy

Every row is a full-width `<button>` (reset: `border: 0; background: transparent; text-align: left; font: inherit`):

```
[ padding-left ][chevron slot 10px][gap 8][dot 7x7][gap 8][label ...]
```

- `display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box`.
- `padding: 4px 12px`, with `padding-left = 12 + level * 14`:
  - Level 0 = 12px, level 1 = 26px, level 2 = 40px, level 3 = 54px.
  - Indent step is **14px per level**.
- Font 13px mono, normal line-height.
  - A single-line row measures **25.5px** (4 + ~17.5 + 4).
  - A wrapped two-line row measures 43px.
  - Proposed: set an explicit `line-height: 17px` or a min-height of about 26px so rows are stable.
- Label color `#c2c7d2`.
- **Chevron slot:** a fixed 10px-wide span, muted `#8b93a3`.
  - It holds a text glyph: `⌄` when expanded, `›` when collapsed.
  - **Files get an empty slot**, so the dots of files and folders align at the same level.
  - Proposed: use an inline SVG chevron instead of Unicode (so it does not depend on font fallback), and rotate it on expand (see 6).
- **Icon:** a **7 x 7 rounded square** (`border-radius: 2px`, `flex: none`), not a glyph. Folders use `#5d6575`. Files use per-extension colors:

| Extension | Dot color | Token |
|---|---|---|
| folder | `#5d6575` | `--color-filetype-folder` |
| `.md` | `#7cc4ff` | `--color-filetype-md` |
| `.html` | `#f0a064` | `--color-filetype-html` |
| `.json` | `#e5b567` | `--color-filetype-json` |
| `.tsx` | `#5fc7b8` | `--color-filetype-tsx` |
| `.bash` | `#7fe0c4` | `--color-filetype-bash` |

### 4.2 Tree contents shown in the prototype

The prototype shows only one expanded project:

```
portfolio                                  (level 0, expanded  ⌄)
  hybrid-wp-react-intranet                 (level 1, expanded  ⌄)
    views                                  (level 2, expanded  ⌄)
      office-booking-calendar.html         (level 3, html)
      interactive-remote-employee-map.html
      employee-directory.html
      documentation-system.html
    README.md                              (level 2, md)
    technical-requirements.md
  headless-wp-educational-app              (level 1, collapsed ›)
  legal-doc-wp-ordering-system             (level 1, collapsed ›)
  multi-location-inventory-sales-system    (level 1, collapsed ›)
docs                                       (level 0, collapsed ›)
index.html                                 (level 0, html)
package.json                               (level 0, json)
search.tsx                                 (level 0, tsx)
```

Prototype quirks (do not copy):
- Only 3 files are wired (README.md, office-booking-calendar.html, package.json).
- Folders never actually toggle (the `v` / `>` states are hardcoded).
- `docs` is shown collapsed, so the `.bash` dot is never rendered (the color is defined in the dot map only).
- Within a folder the prototype lists folders first, then files; keep that ordering convention (`views` before `README.md`) as in the brief.

### 4.3 States

| State | Prototype | Proposed (not in prototype) |
|---|---|---|
| Default | transparent bg, `#c2c7d2` | same |
| **Active** (selected file) | bg `#2a3140`, text `#fff` | keep; add a 2px `#7cc4ff` left inset bar if more affordance is needed |
| **Hover** | **Not in prototype** (cursor pointer only) | bg `rgba(255,255,255,0.04)`, text `#fff` |
| **Focus-visible** | **Not in prototype** (browser default only) | `outline: 2px solid #7cc4ff; outline-offset: -2px` |
| Folder open/close | not wired | chevron rotates, aria-expanded on the button |
| Explorer header | "EXPLORER", 11px, letter-spacing 0.08em, muted | same |

---

## 5. Content renderers

### 5.1 Markdown document view (README.md in the prototype)

Wrapper: `<article>` with `max-width: 760; margin: 0 auto; padding: 40px 32px 56px; font-size: 16; line-height: 1.7; color #d4d7de` (Inter inherited from the content area).

Order and spacing, top to bottom:

1. **Metadata bar** (Obsidian "properties" feel):
   - `display: flex; flex-wrap: wrap; gap: 8px 24px; padding: 12px 16px; margin-bottom: 28`
   - bg `#20242c`; `border: 1px solid #2c313c; border-radius: 8`
   - 13px, muted `#8b93a3`
   - Items: `type: <b>case study</b>`, `stack: <b>WordPress + React</b>`, `views: <b>4</b>`.
     - `<b>` is weight 500, color `#d4d7de`.
   - Tags: `#intranet #wordpress #react`, amber `#e5b567`, a single span.
2. **h1:** `margin: 0 0 16; 36px / 1.2; weight 700; #fff`.
3. **Lead paragraph:** `margin: 0 0 24`. Body paragraphs elsewhere use `margin 0 0 32` before an h2. The last paragraph uses `margin: 0`.
4. **Callout** ("Tip"):
   - `margin: 0 0 32; padding: 14px 18px; background #1f2a3a; border-left: 3px solid #7cc4ff; border-radius: 4px; font-size: 15`
   - Label `<b>` weight 600, color `#7cc4ff`, followed by an em-dash and text. Italic `<i>` for emphasis.
   - Only the "Tip / info" variant exists. Not in prototype: warning, note, danger variants.
5. **h2 "Contents":** `margin: 0 0 12; 22px; #fff`; weight is the browser default 700.
6. **Table of contents:** a `<ul>`, `margin: 0 0 36; padding-left: 22`. Items are links to in-page anchors (`#overview`, `#views`, `#outcomes`), styled as ordinary links (underlined, `#7cc4ff`, hover `#b3dcff`).
7. **Sections:** `h2` with an `id` (the anchor target), `margin: 0 0 12`, then content, then an extra `32px` below the last paragraph of a section. Section bodies in the prototype are bracketed placeholder text such as `[THE PROBLEM, THE APPROACH, AND MY ROLE — two or three short paragraphs.]`.
8. **Table:**
   - Wrapper: `overflow-x: auto; margin: 0 0 32; border: 1px solid #2c313c; border-radius: 8`
   - Table: `border-collapse: collapse; width: 100%; font-size: 14`
   - Header row: bg `#20242c`, `text-align: left`
   - Cells (th and td): `padding: 10px 14px`
   - Body cells: `border-top: 1px solid #2c313c`
   - First column holds a link per view (with `href` anchors, no row hover). Second column: descriptions in placeholders.
   - Columns: "View" and "What it does".
9. **Links:** global `a { color #7cc4ff } a:hover { color #b3dcff }`, default underline.

Not in prototype (markdown features required by the plan or common in Obsidian reading view). Proposed values consistent with the above:

| Element | Proposed |
|---|---|
| h3 | 18px / 1.4, weight 600, `#fff`, margin `24 0 8` |
| Ordered list | same padding/margin as `ul`; marker color muted |
| Inline code | mono, 0.9em, bg `#20242c`, border `1px solid #2c313c`, radius 4, padding `1px 6px`, color `#e5b567` |
| Code block | bg `#101216`, border `1px solid #2c313c`, radius 8, padding `14px 16px`, mono 13/1.7, `overflow-x: auto` |
| Blockquote | `border-left: 3px solid #2c313c`, padding-left 16, muted |
| Horizontal rule | `1px solid #2c313c`, margin `32 0` |
| Heading anchors / scroll-margin | `scroll-margin-top: 16` to land cleanly under the header |

There is no home page, TOC sidebar, or reading progress in the prototype.

### 5.2 Home page

**Not in prototype.** The explorer lists `index.html`, but clicking it does nothing. The nearest reference is the README layout (title, lead paragraph, callout, linked list). Build it from the Markdown article chrome: max-width 760, h1 36/1.2, lead paragraph, a card or link list for the 4 projects, and a contact action.

### 5.3 Light "demo application panel" inside the dark shell

Used for `office-booking-calendar.html`.

- **Wrapper:** `padding: 32` around everything. The panel and its label row share `max-width: 880; margin: 0 auto`.
- **Label row** (above the panel): `display: flex; align-items: center; gap: 10; margin: 0 auto 14; font-size: 12; color #8b93a3`.
  - **Pill:** `padding: 3px 10px; border-radius: 99; background #1f3a33; color #7fe0c4`, text "Live preview".
  - **Text:** "Interactive example — placeholder data". This is the "sample-data label" the plan requires.
- **Panel:** `background #fff; color #1d2330; border-radius: 10; box-shadow: 0 12px 40px rgba(0,0,0,0.4); overflow: hidden`.
- **Panel header:** `padding: 20px 24px; border-bottom: 1px solid #e4e7ee; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8`.
  - Title "Office booking": bold, 18px.
  - Meta "Week of Nov 2 · Floor 2": `#566074`.
- **Body:** `overflow-x: auto; padding: 16px 24px 24px`.
- **Grid:** `display: grid; grid-template-columns: 64px repeat(5, minmax(96px, 1fr)); gap: 6; font-size: 13`.
  - Column headers Mon to Fri: bold, centered, `#566074`.
  - Row label ("Desk A1", "Desk A2", "Desk B1", "Desk B2"): weight 600, `#566074`, transparent bg. In a 64px column, "Desk A2" wraps to two lines at this width, which makes that row taller. Proposed: widen the label column to about 80px.
  - Cell: `padding: 12px 6px; border-radius: 6; text-align: center`.
    - Open: bg `#eef7f1`, text `#2d6a4a`, weight 400, label "Open".
    - Booked: bg `#dfe9fb`, text `#274a8f`, weight 600, label = initials (AK, MR, JT, LS).
- **Fixture:** 4 desks (A1, A2, B1, B2) by 5 weekdays. A cell is booked when `(deskIndex + dayIndex) % 3 === 0`, with initials `['AK','MR','JT','LS'][(i+j)%4]`. Replace this with the plan's fixed sample week.
- **Not in prototype:**
  - Any interactivity: no click, hover, focus, selection, cancel or reset controls.
  - A "your reservation" state, disabled state or empty state.
  - Proposed: your reservation uses a stronger accent (for example `#2b6cb0` bg and white text); controls use the same 6px radius; focus ring `#2b6cb0` 2px.
- Contrast pairs inside the panel pass: `#2d6a4a` on `#eef7f1` is 5.9:1, `#274a8f` on `#dfe9fb` is 7.0:1.

### 5.4 JSON / package.json view

Container: `padding: 28px 24px; font: 13.5px / 2 'JetBrains Mono'`. Each line is a flex row (`gap: 20; flex-wrap: wrap`) of three columns:

| Column | Width | Style |
|---|---|---|
| Line number | `width: 28; text-align: right` | `#5d6575` |
| Code | `flex: 1 1 340`; `padding-left: depth * 20` | color `#d4d7de` base, see below |
| Note | `flex: 1 1 260` | `#8b93a3`, Inter, italic, 13px |

Code coloring:
- Key (including quotes): `#5fc7b8`.
- Separator `: `: `#8b93a3`.
- Value and braces and trailing commas: `#e5b567`. Braces `{` `}` are in the value color, so they read as amber.
- Indent is 20px per level (top level 0, children 20, grandchildren 40).

Content shown (13 lines): `{`; `"name": "portfolio"`; `"description"`; `"stack": {` with `language`, `ui`, `styling`; `},`; `"ai": {` with `assistant`, `usage`; `}`; `}`. Plain-language notes appear to the right of every key line ("The site's name", "What this site is for", "What it's built with", "Typed JavaScript", "Interface library", "How the design is coded", "How I work with AI tools", "Go-to assistant", "Where it helps most"). Placeholders are bracketed uppercase strings (`"[YOUR CHOICE]"`, `"[PREFERRED MODEL]"`, `"[HOW YOU USE IT]"`). That matches the plan's "keep AI preferences visibly pending".

Prototype bug to fix: the note column drifts. Notes on nested lines sit about 10px right of top-level ones (x=945 vs 955 at 1440) because the code column's padding is added to its flex-basis. Proposed: use a CSS grid `grid-template-columns: 28px minmax(0, 1fr) minmax(0, 0.8fr)` (or a fixed note column) so notes align, and wrap/stack the note under the code on narrow screens.

Not in prototype: numeric, boolean, null or array colors; copy button; hover highlight of a line; current-line highlight.

### 5.5 Terminal / contact

Panel: 210px tall, `#101216`, `border-top: 1px solid #262a33`.

- **Header:** `padding: 8px 16px; font-size: 11; letter-spacing: 0.08em; color #8b93a3; border-bottom: 1px solid #262a33`. Text: `TERMINAL · contact.bash`.
- **Body:** `flex: 1; overflow-y: auto; padding: 10px 16px; line-height: 1.7` (13px mono, about 22px per line).
- **Greeting line (muted):** "Welcome. Answer a few quick questions to get in touch."
- **Answered line:** `<span color #5fc7b8>{question}</span> <span color #d4d7de>{answer}</span>`.
  - Example: `What's your name?` (teal) followed by `Ada` (light).
  - The prompt has no `$` or `>` symbol and no "caret". Questions end in `?`.
- **Active prompt:** a row `display: flex; gap: 8; align-items: center` with the teal question and a native `<input>`.
  - Input: `flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; color #fff; font: inherit 13px`.
  - `aria-label="Your answer"`.
  - Placeholder "type here, then press Enter" in the browser's default placeholder gray.
  - `outline: 0` removes focus indication, so **do not copy it**; use a visible caret and focus ring.
- **Completion:** `color #7fe0c4`, text "Thanks — message sent (demo). I'll be in touch soon." The plan replaces this with "Demo complete — nothing was sent."
- **Flow:** the questions are "What's your name?", "What's your email?", "What would you like to talk about?" (3 steps, then done). Enter with a trimmed non-empty value appends to history and advances. Blank input is ignored silently.
- **Not in prototype:** email validation, error messaging, Continue buttons, review step, restart or correction controls, multiline input, collapse and expand control, focus handoff from the `contact.bash` explorer entry.

### 5.6 About, Blog (docs/index), Search, 404

**Not in prototype.** Treat them as variants of the Markdown article chrome (5.1) and the callout (for the "coming in phase 2" empty state). Search is not shown.

---

## 6. Interactions and animation

| Behavior | Prototype |
|---|---|
| Explorer click | Selects a view (state swap). Only 3 files respond. No navigation or URL change. No expand/collapse. |
| Tab click | Selects the same views; the active tab changes bg, text and top bar. |
| Hover | Only links change color (`#7cc4ff` to `#b3dcff`). Buttons just show `cursor: pointer`. |
| Focus | Only browser defaults (buttons) and none on the terminal input. |
| Terminal | Enter submits an answer, appends it to history, advances one question. No autofocus management. |
| Transitions / animations | **None.** No `transition`, `animation`, `@keyframes` or scroll behavior anywhere. |
| Page title | `Portfolio — editor layout` (static). |
| Title/status crumb | Changes per selected view: `portfolio › hybrid-wp-react-intranet › README.md`, `portfolio › … › views › office-booking-calendar.html`, `package.json`. |

Proposed (all subtle; none present in the prototype):
- Hover and active-row bg changes: `120ms ease`.
- Chevron rotation: `150ms ease`.
- Terminal expand/collapse and the mobile drawer: `200ms ease`.
- Wrap all of it in `@media (prefers-reduced-motion: reduce)` to disable transitions.

---

## 7. Do NOT carry over

1. **The tab strip** (three tabs, `role="tablist"`). Replace it with the single active-file header plus breadcrumbs (plan). Do not keep tab close buttons or overflow scrolling.
2. **Hard-coded explorer state** (`⌄` / `›` glyphs fixed in data, three wired files, three expanded folders). Drive everything from the content registry and the URL.
3. **Pixel-only responsiveness.** The prototype has no viewport meta, no breakpoints and no drawer. Do not rely on its flex-wrap fallback.
4. **`min-height: 900` root.** Pin the shell to the viewport instead.
5. **JSON note-column drift** (flex-basis plus indent). Use a grid.
6. **`outline: 0` on the terminal input** and missing focus styles generally.
7. **Faint line-number color `#5d6575` as text** (2.9:1). Lighten it.
8. **Inline styles** (everything). Convert to CSS Modules plus shared tokens.
9. **Prototype terminal behavior.** The completion text says "message sent", but the plan requires "Demo complete — nothing was sent." Also add validation, a review step and Continue buttons.
10. **The mixed-concern component** (`DCLogic` / `sc-for` / `sc-if` runtime and the `hz:` meta tags). That is the bundler's canvas runtime, not part of the design.
11. **Prototype copy:** `[ONE-SENTENCE SUMMARY]` placeholders, the fake `Week of Nov 2 · Floor 2`, and initials AK/MR/JT/LS, if they imply real people. Use the plan's clearly labeled synthetic data.
12. **Hotlinked JetBrains Mono files** from `fonts.gstatic.com` (cyrillic, greek, etc.). Self-host instead (the plan requires it).
13. **A fake git "main" in the status bar** is cosmetic; keep it only if desired. It is not information about the site.

---

## 8. Quick reference: proposed `:root` tokens

```css
:root {
  /* surfaces */
  --color-bg: #14161b;
  --color-surface-0: #101216;
  --color-surface-1: #181b21;
  --color-surface-2: #1a1d24;
  --color-surface-3: #20242c;
  --color-surface-selected: #2a3140;
  --color-callout-info-bg: #1f2a3a;
  /* borders */
  --color-border: #262a33;
  --color-border-content: #2c313c;
  /* text */
  --color-text-strong: #ffffff;
  --color-text: #d4d7de;
  --color-text-explorer: #c2c7d2;
  --color-text-muted: #8b93a3;
  --color-text-faint: #808899;       /* proposed; prototype #5d6575 fails AA */
  --color-icon-folder: #5d6575;
  /* accents */
  --color-accent: #7cc4ff;
  --color-accent-hover: #b3dcff;
  --color-accent-status: #2b6cb0;
  /* syntax / file types */
  --color-syntax-key: #5fc7b8;
  --color-syntax-string: #e5b567;
  --color-filetype-md: #7cc4ff;
  --color-filetype-html: #f0a064;
  --color-filetype-json: #e5b567;
  --color-filetype-tsx: #5fc7b8;
  --color-filetype-bash: #7fe0c4;
  /* status */
  --color-success: #7fe0c4;
  --color-success-bg: #1f3a33;
  /* demo panel (light) */
  --color-demo-bg: #ffffff;
  --color-demo-text: #1d2330;
  --color-demo-text-muted: #566074;
  --color-demo-border: #e4e7ee;
  --color-demo-open-bg: #eef7f1;  --color-demo-open-fg: #2d6a4a;
  --color-demo-booked-bg: #dfe9fb; --color-demo-booked-fg: #274a8f;
  --shadow-demo-panel: 0 12px 40px rgba(0, 0, 0, 0.4);
  /* type */
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-sans: Inter, system-ui, sans-serif;
  /* layout */
  --size-titlebar: 36px;      /* + 1px border */
  --size-explorer: 280px;
  --size-fileheader: 37px;    /* matches prototype tab strip */
  --size-terminal: 210px;
  --size-statusbar: 24px;
  --explorer-indent: 14px;    /* per level; base padding-left 12px */
  --radius-sm: 4px;           /* callout */
  --radius-md: 6px;           /* demo cells */
  --radius-lg: 8px;           /* metadata bar, tables */
  --radius-xl: 10px;          /* demo panel */
  --radius-pill: 99px;
}
```

---

## 9. Sources of uncertainty

- Hover, focus, active, disabled, error and animation values are **proposals**, not extracted (the prototype has none).
- The prototype is a fixed-width design canvas (1440 x 900). Behavior below about 800px is accidental, and the narrow-screen rules come from the plan.
- Home, About, Blog, Search, 404 and non-README Markdown elements have **no visual reference**.
