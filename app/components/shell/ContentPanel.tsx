import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router";
import { useShell } from "./ShellContext";
import styles from "./ContentPanel.module.css";

/**
 * The scrolling content panel (<main>). It — not the window — is the scroll container, so the
 * default <ScrollRestoration> doesn't apply. Instead, on every location change:
 *  - `#hash` → scroll that element into view inside this panel,
 *  - back/forward (POP) → restore the position remembered (in memory only) for that history entry,
 *  - otherwise → reset to the top.
 * Native in-page anchor clicks (`<a href="#x">`) are handled by the browser, which scrolls the
 * nearest scrollable ancestor.
 */
export function ContentPanel() {
  const { contentRef } = useShell();
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const currentKey = useRef(location.key);

  useLayoutEffect(() => {
    currentKey.current = location.key;
    const el = contentRef.current;
    if (!el) return;

    if (location.hash) {
      let id = location.hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        // keep raw
      }
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    el.scrollTop = navigationType === "POP" ? (positions.current.get(location.key) ?? 0) : 0;
    el.scrollLeft = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the history entry only
  }, [location.key]);

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
