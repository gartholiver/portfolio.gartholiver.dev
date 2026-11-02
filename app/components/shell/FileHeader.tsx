import { Fragment } from "react";
import { Link } from "react-router";
import { getBreadcrumbs, type RegistryEntry } from "~/content/registry";
import { getFileIconKind } from "./explorer-state";
import styles from "./FileHeader.module.css";

/**
 * Active-file header (replaces the prototype's tab strip): one "tab-like" cell for the open file
 * plus breadcrumbs. Not a tablist — there is only ever one file open.
 */
export function FileHeader({ activeEntry }: { activeEntry: RegistryEntry | undefined }) {
  if (!activeEntry) {
    return (
      <div className={styles.fileHeader}>
        <div className={styles.file}>
          <span className={styles.dot} data-kind="default" aria-hidden="true" />
          <span className={styles.name}>404</span>
        </div>
      </div>
    );
  }

  const crumbs = getBreadcrumbs(activeEntry);
  const fullPath = crumbs.map((c) => c.name).join(" › ");
  // Below 600px the middle folders collapse into "…" (CSS): keep the first and the last folder.
  // The file itself is the last crumb and is already shown in the file cell.
  const lastFolder = crumbs.length - 2;
  const isMiddle = (i: number) => i > 0 && i < lastFolder;
  const hasMiddle = lastFolder > 1;
  return (
    <div className={styles.fileHeader}>
      <div className={styles.file} title={activeEntry.explorerPath}>
        <span className={styles.dot} data-kind={getFileIconKind(activeEntry.label)} aria-hidden="true" />
        <span className={styles.name}>{activeEntry.label}</span>
      </div>
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <ol className={styles.crumbList} title={fullPath}>
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Fragment key={crumb.path}>
                {i === 1 && hasMiddle && (
                  <li className={styles.crumb} data-ellipsis="true" aria-hidden="true">
                    <span className={styles.crumbText}>…</span>
                  </li>
                )}
                <li className={styles.crumb} data-last={last} data-middle={isMiddle(i)}>
                  {crumb.url ? (
                    <Link to={crumb.url} className={styles.crumbLink} aria-current={last ? "page" : undefined}>
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className={styles.crumbText}>{crumb.name}</span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
