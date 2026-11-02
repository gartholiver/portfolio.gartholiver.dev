import { useRef } from "react";
import type { TocItem } from "~/lib/markdown/render";
import { nestToc } from "~/lib/markdown/toc";
import styles from "./MarkdownDocView.module.css";

function TocList({ toc }: { toc: readonly TocItem[] }) {
  return (
    <ul className={styles.tocList}>
      {nestToc(toc).map(({ item, children }) => (
        <li key={item.id}>
          <a href={`#${item.id}`}>{item.text}</a>
          {children.length > 0 && (
            <ul className={styles.tocSub}>
              {children.map((child) => (
                <li key={child.id}>
                  <a href={`#${child.id}`}>{child.text}</a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Wide screens: a sticky "On this page" list in the side column (hidden below the breakpoint). */
export function SideToc({ toc }: { toc: readonly TocItem[] }) {
  return (
    <nav aria-label="Table of contents" className={styles.sideToc}>
      <p className={styles.tocHeading}>On this page</p>
      <TocList toc={toc} />
    </nav>
  );
}

/** Narrow screens: a compact collapsible list under the title (hidden at the wide breakpoint). */
export function InlineToc({ toc }: { toc: readonly TocItem[] }) {
  const details = useRef<HTMLDetailsElement>(null);
  return (
    <nav
      aria-label="Table of contents"
      className={styles.inlineToc}
      // Picking a section collapses the list so the target is visible.
      onClick={(e) => {
        if (e.target instanceof Element && e.target.closest("a")) details.current?.removeAttribute("open");
      }}
    >
      <details ref={details}>
        <summary>Contents</summary>
        <TocList toc={toc} />
      </details>
    </nav>
  );
}
