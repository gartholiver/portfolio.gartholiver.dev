import { Fragment } from "react";
import { Link } from "react-router";
import { getBreadcrumbs, type RegistryEntry } from "~/content/registry";
import { FileIcon } from "~/components/icons/FileIcon";
import { getFileIconKind } from "./explorer-state";
import styles from "./FileHeader.module.css";

/**
 * Active-file header, laid out like VS Code: a tab row with one "tab-like" cell for the open file,
 * then a full-width breadcrumb bar below it. Not a tablist — there is only ever one file open.
 */
export function FileHeader({ activeEntry }: { activeEntry: RegistryEntry | undefined }) {
  if (!activeEntry) {
    return (
      <div className={styles.fileHeader}>
        <div className={styles.tabRow}>
          <div className={styles.file}>
            <FileIcon kind="default" />
            <span className={styles.name}>404</span>
          </div>
        </div>
      </div>
    );
  }

  const crumbs = getBreadcrumbs(activeEntry);
  const fullPath = crumbs.map((c) => c.name).join(" › ");
  // Below 600px the middle folders collapse into "…" (CSS): keep the first and the last folder
  // plus the file itself (the last crumb).
  const lastFolder = crumbs.length - 2;
  const isMiddle = (i: number) => i > 0 && i < lastFolder;
  const hasMiddle = lastFolder > 1;
  const iconKind = getFileIconKind(activeEntry.label);
  return (
    <div className={styles.fileHeader}>
      <div className={styles.tabRow}>
        <div className={styles.file} title={activeEntry.explorerPath}>
          <FileIcon kind={iconKind} />
          <span className={styles.name}>{activeEntry.label}</span>
        </div>
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
                  {last && <FileIcon kind={iconKind} className={styles.crumbIcon} />}
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
