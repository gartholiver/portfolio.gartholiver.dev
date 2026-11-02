import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { useShell } from "~/components/shell/ShellContext";
import { describeField, describeKind, search, type Segment, type SearchableDoc } from "~/lib/search";
import shared from "./Page.module.css";
import styles from "./SearchPage.module.css";

const DEBOUNCE_MS = 200;

function Marked({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) => (s.match ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
    </>
  );
}

/** Most common tags on project documents, used as one-click example searches. */
function suggestionTerms(index: readonly SearchableDoc[], limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const doc of index) {
    if (!doc.projectTitle) continue;
    for (const tag of doc.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * Local search UI. The page is prerendered without a query, so the first render is always the
 * empty state; `?q=` is read in an effect after hydration (no hydration mismatch) and written back
 * with `replace` as the user types.
 */
export function SearchPage({ title, index }: { title: string; index: readonly SearchableDoc[] }) {
  const { openContact } = useShell();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [draft, setDraft] = useState(""); // what is in the input
  const [query, setQuery] = useState(""); // debounced value that drives results + the URL
  const [hydrated, setHydrated] = useState(false);
  const writes = useRef<string[]>([]); // values we wrote to the URL whose echo hasn't arrived yet
  const inputRef = useRef<HTMLInputElement>(null);

  // The search page itself is not a useful result.
  const docs = useMemo(() => index.filter((d) => d.kind !== "search"), [index]);
  const suggestions = useMemo(() => suggestionTerms(docs), [docs]);

  // URL -> state: first load after hydration, and external changes (back/forward, shared links).
  useEffect(() => {
    setHydrated(true);
    const echo = writes.current.indexOf(urlQuery);
    if (echo !== -1) {
      writes.current.splice(0, echo + 1);
      return;
    }
    writes.current = [];
    setDraft(urlQuery);
    setQuery(urlQuery);
  }, [urlQuery]);

  // Input -> committed query (debounced).
  useEffect(() => {
    if (draft === query) return;
    const timer = setTimeout(() => setQuery(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, query]);

  // Committed query -> URL (replace, so typing doesn't fill the history).
  useEffect(() => {
    if (!hydrated) return;
    const latest = writes.current.length ? writes.current[writes.current.length - 1]! : urlQuery;
    if (query === latest) return;
    writes.current.push(query);
    setSearchParams(query ? { q: query } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the committed query
  }, [query, hydrated]);

  const trimmed = query.trim();
  const results = useMemo(() => search(docs, query), [docs, query]);
  const hasQuery = hydrated && trimmed.length > 0;

  const commit = (value: string) => {
    setDraft(value);
    setQuery(value);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    commit(draft);
  };

  let announcement = "";
  if (hasQuery) {
    announcement =
      results.length === 0
        ? `No results for “${trimmed}”.`
        : `${results.length} ${results.length === 1 ? "result" : "results"} for “${trimmed}”.`;
  }

  return (
    <article className={`${shared.page} ${shared.narrow}`}>
      <p className={shared.eyebrow}>search.tsx</p>
      <h1>{title}</h1>
      <p className={shared.lead}>
        Find case studies, documents and pages by title, filename, project, tag or text.
      </p>

      <form role="search" className={styles.form} onSubmit={onSubmit}>
        <label htmlFor="site-search" className={styles.label}>
          Search this site
        </label>
        <div className={styles.inputWrap}>
          <svg className={styles.glass} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3.25 3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            id="site-search"
            name="q"
            type="search"
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. WordPress, README, calendar"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
          />
        </div>
      </form>

      {/* Polite live region: result count, updated when the debounced query changes. */}
      <p className={styles.status} aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {hasQuery && results.length > 0 && (
        <ul className={styles.results} aria-label="Search results">
          {results.map(({ doc, fields, title: titleSegments, snippet }) => (
            <li key={doc.id} className={styles.result}>
              <h2 className={styles.titleRow}>
                <Link to={doc.url} className={styles.link}>
                  <Marked segments={titleSegments} />
                </Link>
              </h2>
              <p className={styles.meta}>
                <span className={styles.kind}>{describeKind(doc)}</span>
                <span className={styles.path}>{doc.explorerPath}</span>
                {doc.projectTitle && doc.projectTitle !== doc.title && <span>{doc.projectTitle}</span>}
              </p>
              {snippet.length > 0 && (
                <p className={styles.snippet}>
                  <Marked segments={snippet} />
                </p>
              )}
              <p className={styles.matched}>Matched in {fields.map(describeField).join(", ")}</p>
            </li>
          ))}
        </ul>
      )}

      {hasQuery && results.length === 0 && (
        <section className={styles.panel} aria-labelledby="search-none">
          <h2 id="search-none">No results</h2>
          <p>
            Nothing matched “{trimmed}”. Check the spelling, try fewer or different words, or{" "}
            <button type="button" className={styles.linkButton} onClick={() => commit("")}>
              clear the search
            </button>
            .
          </p>
          <p>
            Looking for me directly? <button type="button" className={styles.linkButton} onClick={openContact}>Open the contact terminal</button>{" "}
            (a demo — nothing is sent).
          </p>
        </section>
      )}

      {!hasQuery && (
        <section className={styles.panel} aria-labelledby="search-empty">
          <h2 id="search-empty">Start typing to search</h2>
          <p>
            Search covers {docs.length} pages: project READMEs, technical requirements, example views and site
            pages. Matches in titles and filenames rank above matches in body text, and capitalisation and accents
            are ignored.
          </p>
          {suggestions.length > 0 && (
            <>
              <p id="search-try">Try one of these:</p>
              <ul className={styles.chips} aria-labelledby="search-try">
                {suggestions.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      className={styles.chip}
                      onClick={() => {
                        commit(term);
                        inputRef.current?.focus();
                      }}
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className={styles.browse}>
            Prefer to browse? Head back to the <Link to="/">home page</Link>.
          </p>
        </section>
      )}
    </article>
  );
}
