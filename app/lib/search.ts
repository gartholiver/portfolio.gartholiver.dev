/**
 * Pure, dependency-free local search over the prerendered search index.
 *
 * - Case- and diacritic-insensitive (text is folded with NFD + combining-mark removal + lowercase).
 * - A query is split on whitespace; EVERY term must match somewhere in the document (AND).
 * - Ranking: title > filename > project name > tags > description > body text. Within a field an
 *   exact match beats a prefix match, which beats a word-start match, which beats a substring.
 * - Results carry highlight segments (title + snippet) so the UI can render `<mark>` without
 *   touching raw HTML strings.
 */

/** Structural subset of the server-built `SearchDocument` (see content/search-index.server.ts). */
export interface SearchableDoc {
  id: string;
  url: string;
  /** Filename shown in the explorer, e.g. `README.md`. */
  label: string;
  title: string;
  explorerPath: string;
  kind: string;
  projectTitle?: string;
  tags: string[];
  description: string;
  /** Plain-text body (Markdown docs) or the description for other pages. */
  text: string;
}

export type MatchField = "title" | "filename" | "project" | "tags" | "description" | "text";

export interface Segment {
  text: string;
  match: boolean;
}

export interface SearchResult<T extends SearchableDoc = SearchableDoc> {
  doc: T;
  score: number;
  /** Fields in which at least one term matched, best-ranked first. */
  fields: MatchField[];
  /** Document title split into plain/highlighted segments. */
  title: Segment[];
  /** Context excerpt (body match when there is one, otherwise the description) with highlights. */
  snippet: Segment[];
}

export interface SearchOptions {
  /** Maximum characters in a snippet (default 180). */
  snippetLength?: number;
  /** Maximum number of terms honoured (default 8). */
  maxTerms?: number;
}

// ---------------------------------------------------------------------------
// Folding
// ---------------------------------------------------------------------------

const COMBINING_MARKS = /\p{M}/gu;

/** Lowercase, strip diacritics. Length may differ from the input; use `foldWithMap` to map back. */
export function fold(input: string): string {
  return input.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();
}

interface Folded {
  text: string;
  /** For every UTF-16 unit in `text`: index in the original where its source character starts. */
  starts: number[];
  /** ...and where that source character ends (exclusive). */
  ends: number[];
}

/** Fold while remembering which original character produced each folded unit (for highlighting). */
export function foldWithMap(input: string): Folded {
  let text = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let i = 0;
  for (const ch of input) {
    const end = i + ch.length;
    const piece = fold(ch);
    if (!piece && starts.length) {
      // A stray combining mark (decomposed input): attach it to the previous character.
      const prevStart = starts[starts.length - 1]!;
      for (let k = starts.length - 1; k >= 0 && starts[k] === prevStart; k--) ends[k] = end;
    }
    for (let k = 0; k < piece.length; k++) {
      starts.push(i);
      ends.push(end);
    }
    text += piece;
    i = end;
  }
  return { text, starts, ends };
}

/** Split a query into unique, folded terms. */
export function tokenize(query: string, maxTerms = 8): string[] {
  const seen = new Set<string>();
  for (const part of fold(query).split(/\s+/)) {
    if (part) seen.add(part);
    if (seen.size >= maxTerms) break;
  }
  return [...seen];
}

const collapseWhitespace = (s: string) => s.replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// Highlighting & snippets
// ---------------------------------------------------------------------------

/** Merged [start, end) ranges (in original-text indices) where any term occurs. */
function matchRanges(folded: Folded, terms: readonly string[]): Array<[number, number]> {
  const raw: Array<[number, number]> = [];
  for (const term of terms) {
    if (!term) continue;
    let from = 0;
    for (;;) {
      const at = folded.text.indexOf(term, from);
      if (at === -1) break;
      raw.push([folded.starts[at]!, folded.ends[at + term.length - 1]!]);
      from = at + Math.max(1, term.length);
    }
  }
  raw.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged: Array<[number, number]> = [];
  for (const range of raw) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}

/** Split `text` into segments, flagging the parts that match any (already folded) term. */
export function highlight(text: string, terms: readonly string[]): Segment[] {
  if (!text) return [];
  const ranges = terms.length ? matchRanges(foldWithMap(text), terms) : [];
  if (!ranges.length) return [{ text, match: false }];
  const out: Segment[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) out.push({ text: text.slice(cursor, start), match: false });
    out.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), match: false });
  return out;
}

/**
 * Excerpt of `text` around the first occurrence of any term, with highlights. Falls back to the
 * start of the text when nothing matches. Whitespace is collapsed first.
 */
export function makeSnippet(text: string, terms: readonly string[], maxLength = 180): Segment[] {
  const flat = collapseWhitespace(text);
  if (!flat) return [];
  const folded = foldWithMap(flat);
  const ranges = terms.length ? matchRanges(folded, terms) : [];

  let start = 0;
  if (ranges.length) {
    // Leave a little lead-in before the first match.
    start = Math.max(0, ranges[0]![0] - Math.floor(maxLength / 4));
    if (start > 0) {
      // Snap to a word boundary (look back up to 20 chars, otherwise forward).
      const back = flat.lastIndexOf(" ", start);
      start = back !== -1 && start - back <= 20 ? back + 1 : start;
    }
  }
  let end = Math.min(flat.length, start + maxLength);
  if (end < flat.length) {
    const back = flat.lastIndexOf(" ", end);
    if (back > start + maxLength / 2) end = back;
  }
  // Never cut a match in half at the right edge when it starts inside the window.
  for (const [s, e] of ranges) {
    if (s < end && e > end && e - start <= maxLength * 1.5) end = e;
  }

  const excerpt = flat.slice(start, end);
  const segments = highlight(excerpt, terms);
  if (start > 0 && segments.length) segments[0] = { ...segments[0]!, text: `…${segments[0]!.text}` };
  if (end < flat.length) {
    const last = segments.length - 1;
    segments[last] = { ...segments[last]!, text: `${segments[last]!.text}…` };
  }
  return segments;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const FIELD_ORDER: MatchField[] = ["title", "filename", "project", "tags", "description", "text"];

const isWordChar = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);

/** Best position kind for `term` in `haystack`: 3 = exact, 2 = prefix, 1 = word start, 0 = substring, -1 = none. */
function matchQuality(haystack: string, term: string): number {
  if (!haystack || !term) return -1;
  if (haystack === term) return 3;
  let best = -1;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(term, from);
    if (at === -1) break;
    if (at === 0) return 2;
    if (!isWordChar(haystack[at - 1])) best = Math.max(best, 1);
    else best = Math.max(best, 0);
    from = at + 1;
  }
  return best;
}

function countOccurrences(haystack: string, term: string, cap: number): number {
  let n = 0;
  let from = 0;
  while (n < cap) {
    const at = haystack.indexOf(term, from);
    if (at === -1) break;
    n++;
    from = at + term.length;
  }
  return n;
}

/** Points per field, indexed by match quality (substring, word start, prefix, exact). */
const SCORES: Record<MatchField, [number, number, number, number]> = {
  title: [90, 105, 120, 140],
  filename: [80, 90, 100, 110],
  project: [55, 60, 62, 65],
  tags: [40, 45, 50, 55],
  description: [20, 25, 25, 25],
  text: [10, 10, 10, 10],
};

interface FoldedDoc {
  title: string;
  /** Filename, plus its stem without extension. */
  filename: string[];
  project: string;
  tags: string[];
  description: string;
  text: string;
}

const foldedCache = new WeakMap<object, FoldedDoc>();

function foldDoc(doc: SearchableDoc): FoldedDoc {
  let f = foldedCache.get(doc);
  if (!f) {
    const label = fold(doc.label);
    const dot = label.lastIndexOf(".");
    f = {
      title: fold(doc.title),
      filename: dot > 0 ? [label, label.slice(0, dot)] : [label],
      project: fold(doc.projectTitle ?? ""),
      tags: doc.tags.map(fold),
      description: fold(doc.description),
      text: fold(collapseWhitespace(doc.text)),
    };
    foldedCache.set(doc, f);
  }
  return f;
}

/** Score one term against one document. Returns the best field score and which fields matched. */
function scoreTerm(f: FoldedDoc, term: string): { score: number; fields: Set<MatchField> } | null {
  const fields = new Set<MatchField>();
  let best = 0;
  const consider = (field: MatchField, quality: number, bonus = 0) => {
    if (quality < 0) return;
    fields.add(field);
    best = Math.max(best, SCORES[field][quality]! + bonus);
  };

  consider("title", matchQuality(f.title, term));
  consider("filename", Math.max(...f.filename.map((name) => matchQuality(name, term))));
  consider("project", matchQuality(f.project, term));
  consider("tags", Math.max(-1, ...f.tags.map((tag) => matchQuality(tag, term))));
  consider("description", matchQuality(f.description, term));
  const bodyHits = countOccurrences(f.text, term, 6);
  if (bodyHits) consider("text", 0, Math.min(bodyHits - 1, 5));

  return fields.size ? { score: best, fields } : null;
}

const KIND_RANK: Record<string, number> = { markdown: 0, demo: 1, view: 2, stack: 3, about: 3, blog: 3, home: 3 };

function tieRank(doc: SearchableDoc): number {
  if (doc.kind === "markdown") return doc.label === "README.md" ? 0 : 1;
  return 2 + (KIND_RANK[doc.kind] ?? 4);
}

// ---------------------------------------------------------------------------
// Public search
// ---------------------------------------------------------------------------

/**
 * Search `docs` for `query`. Returns [] for an empty/whitespace query. Results are ordered by score
 * (desc), then README → technical requirements → views → other pages, then index order.
 */
export function search<T extends SearchableDoc>(
  docs: readonly T[],
  query: string,
  options: SearchOptions = {},
): SearchResult<T>[] {
  const terms = tokenize(query, options.maxTerms);
  if (!terms.length) return [];
  const phrase = terms.join(" ");

  const scored: Array<{ result: SearchResult<T>; index: number; rank: number }> = [];
  docs.forEach((doc, index) => {
    const f = foldDoc(doc);
    let score = 0;
    const fields = new Set<MatchField>();
    for (const term of terms) {
      const hit = scoreTerm(f, term);
      if (!hit) return; // AND semantics: every term must match somewhere
      score += hit.score;
      hit.fields.forEach((field) => fields.add(field));
    }
    // A multi-word query that appears verbatim in the title or filename is a very strong signal.
    if (terms.length > 1 && (f.title.includes(phrase) || f.filename.some((n) => n.includes(phrase)))) score += 30;

    const orderedFields = FIELD_ORDER.filter((field) => fields.has(field));
    const snippetSource = fields.has("text") ? doc.text : doc.description || doc.text;
    scored.push({
      index,
      rank: tieRank(doc),
      result: {
        doc,
        score,
        fields: orderedFields,
        title: highlight(doc.title, terms),
        snippet: makeSnippet(snippetSource, terms, options.snippetLength ?? 180),
      },
    });
  });

  scored.sort((a, b) => b.result.score - a.result.score || a.rank - b.rank || a.index - b.index);
  return scored.map((s) => s.result);
}

/** Human-readable "what is this" label for a result. */
export function describeKind(doc: Pick<SearchableDoc, "kind" | "label">): string {
  switch (doc.kind) {
    case "markdown":
      return doc.label === "README.md" ? "Case study" : "Technical requirements";
    case "demo":
      return "Interactive demo";
    case "view":
      return "Placeholder view";
    default:
      return "Page";
  }
}

/** Plain-text label for a matched field (used in "Matched in …" captions). */
export function describeField(field: MatchField): string {
  switch (field) {
    case "title":
      return "title";
    case "filename":
      return "filename";
    case "project":
      return "project name";
    case "tags":
      return "tags";
    case "description":
      return "description";
    case "text":
      return "document text";
  }
}
