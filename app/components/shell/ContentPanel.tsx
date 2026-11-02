import { useEffect, useLayoutEffect, useRef } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router";
import { useShell } from "./ShellContext";
import styles from "./ContentPanel.module.css";

/** The element a URL fragment points at (decoded), if it exists on the page. */
function getHashTarget(hash: string): HTMLElement | null {
  if (!hash) return null;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // keep raw
  }
  return document.getElementById(id);
}

/**
 * True for a history REPLACE that only changed the query string (e.g. the `?q=` updates while
 * typing on /search). Such updates keep the same page, so the scroll position is left alone.
 */
export function isSearchOnlyReplace(
  prev: { pathname: string; search: string; hash: string },
  next: { pathname: string; search: string; hash: string },
  navigationType: string,
): boolean {
  return (
    navigationType === "REPLACE" &&
    prev.pathname === next.pathname &&
    prev.hash === next.hash &&
    prev.search !== next.search
  );
}

/**
 * The scrolling content panel (<main>). It — not the window — is the scroll container, so the
 * default <ScrollRestoration> doesn't apply. Instead, on every location change:
 *  - `#hash` → scroll that element into view inside this panel,
 *  - back/forward (POP) → restore the position remembered (in memory only) for that history entry,
 *  - a REPLACE that only changes `?search` (typing on /search) → leave the scroll alone,
 *  - otherwise → reset to the top.
 * Native in-page anchor clicks (`<a href="#x">`) are handled by the browser, which scrolls the
 * nearest scrollable ancestor. Moving back/forward between such fragment-only history entries does
 * not scroll a nested scroller, so a `hashchange` listener scrolls the new target into view.
 */
export function ContentPanel() {
  const { contentRef } = useShell();
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const currentKey = useRef(location.key);
  const previousLocation = useRef(location);

  useLayoutEffect(() => {
    currentKey.current = location.key;
    const previous = previousLocation.current;
    previousLocation.current = location;
    const el = contentRef.current;
    if (!el) return;
    if (isSearchOnlyReplace(previous, location, navigationType)) return;

    const target = getHashTarget(location.hash);
    if (target) {
      target.scrollIntoView();
      return;
    }
    el.scrollTop = navigationType === "POP" ? (positions.current.get(location.key) ?? 0) : 0;
    el.scrollLeft = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the history entry only
  }, [location.key]);

  useEffect(() => {
    function onHashChange() {
      const target = getHashTarget(window.location.hash);
      if (target) target.scrollIntoView();
      else if (!window.location.hash && contentRef.current) contentRef.current.scrollTop = 0;
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [contentRef]);

  return (
    <main
      id="content"
      ref={contentRef}
      className={styles.content}
      tabIndex={0}
      onScroll={(e) => positions.current.set(currentKey.current, e.currentTarget.scrollTop)}
    >
      <Outlet />
    </main>
  );
}
