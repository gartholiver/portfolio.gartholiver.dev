# Markdown conventions

Case-study documents live in `content/projects/<project-id>/` as exactly two files: `README.md` (overview) and `technical-requirements.md`. They are registered in `app/content/registry.ts` (see [content-registry.md](content-registry.md)) and rendered at build time by `app/lib/markdown/render.ts` (unified: remark-parse, remark-gfm, callouts, remark-rehype, rehype-slug, stringify). The browser only receives HTML, the table of contents and the frontmatter.

## Frontmatter

YAML between `---` lines at the top of the file.

```yaml
---
title: "Headless WordPress Educational App"
role: "[Placeholder] Role to be supplied"
stack: ["WordPress", "Headless", "Education"]
status: placeholder
summary: "[Placeholder] One-sentence project summary to be supplied."
---
```

| Field | Used for |
| --- | --- |
| `title` | Parsed but **not displayed**. The page title and search title come from the registry (`projects.ts`), and the visible `h1` comes from the `# Heading` in the body |
| `role` | "role" row in the document properties block |
| `stack` | list of tags in the properties block |
| `status` | "status" badge in the properties block (`placeholder` today; use a real value such as `published` when content is final) |
| `summary` | lead paragraph under the title (optional; the READMEs set it, the technical-requirements files do not) |

The properties block also shows the document type and, from the registry, a link to the project (technical requirements) or the number of views (README). Other keys are allowed and ignored.

## Headings and table of contents

- Start the body with a single `# Title`. It becomes the page `h1`.
- `##` and `###` headings form the table of contents ("On this page" side column on wide panels, a collapsible list on narrow ones). It only appears when there are at least two headings. Do not skip levels.
- Heading ids are generated with github-slugger (the same slugs as GitHub): `## My role` becomes `#my-role`. Duplicate headings get `-1`, `-2` suffixes. Link to a section with `/portfolio/<id>#my-role`; the e2e tests cover deep links.
- `##` to `####` headings get a decorative `#` permalink that is hidden from assistive technology.

## Callouts

Obsidian-style blockquotes. The first line is `[!type]` plus an optional title; the following `>` lines are the body.

```md
> [!placeholder] Placeholder content
> Everything on this page is placeholder copy.

> [!note]
> Views use fictional sample data and placeholder branding.
```

Types: `note`, `info`, `tip`, `warning`, `placeholder`. An unknown type falls back to `note`. Without a title the type name is used ("Note"). A blockquote that does not start with `[!type]` stays a normal quote. Callouts render as `<aside class="callout" data-callout="...">`.

## Tables

GitHub-flavoured Markdown tables:

```md
| Area | Requirement | Status |
| --- | --- | --- |
| Functional | [Placeholder] Requirement to be supplied | Pending |
```

Each table is wrapped in a keyboard-focusable scroll region labelled `Table: <headers>`, so wide tables scroll in place at narrow widths. Give every table a header row. Table styles are scoped to `.md-content` (`app/styles/global.css`); they do not leak into demos.

## Links

- Link to other pages by **clean URL**, as registered: `[README](/portfolio/hybrid-wp-react-intranet)`, `[technical-requirements.md](/portfolio/hybrid-wp-react-intranet/technical-requirements)`, `[a view](/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar)`. No `.md` or `.html` file links and no trailing slash.
- Internal links that match a registry URL become client-side navigations (the shell stays mounted). Anything else (external, `#hash`-only, modified clicks) is left to the browser.
- **The build checks links** (`loadMarkdown` → `app/content/validate-links.ts`). Each `href` is resolved against the document's own URL like a browser would, so a relative `technical-requirements.md` fails; same-origin paths must be registered URLs (links to other projects are fine); a `#fragment` must be a heading id in the target document (checked only for Markdown targets). A bad link fails `npm run build` and the Vitest content tests with a message naming the file.
- **Only safe URL protocols are allowed** in links and images: `http:`, `https:`, `mailto:`, `tel:`, relative paths and `#fragments`. Anything else (`javascript:`, `data:`, …) throws during render and fails the build.
- External `http(s)://` links automatically get `rel="noopener noreferrer"`.
- Each README has a "Views in this project" table with a **Type** column typed by hand (`Placeholder panel`, `Interactive demo (sample data)`). Update it when a view becomes a demo.

## Other supported syntax

GFM task lists, strikethrough and autolinks, plus standard Markdown (lists, code, emphasis).

## Not supported

- **Raw HTML is dropped** (remark-rehype default). Use Markdown only.
- No MDX, embeds, math or diagram syntax, and no syntax highlighting for code blocks.
- No Markdown image pipeline or styling has been built or tested (`public/` currently only holds font licences). Treat images as unsupported until one is added.
- The table of contents lists only `##` and `###` headings.

## Content rules

- Mark every unfinished passage `[Placeholder]`; never invent clients, outcomes, metrics or personal details.
- Keep text anonymised. Examples in views use fictional data.
- The plain text of each document is indexed by search (`mdastPlainText` in `render.ts`), so write meaningful body text. The leading `# Title` and callout titles are left out of the indexed text so snippets do not start with the title.
