import { getBreadcrumbs, type RegistryEntry } from "~/content/registry";
import { useShell } from "./ShellContext";
import styles from "./TitleBar.module.css";

export const EXPLORER_DRAWER_ID = "explorer-drawer";

export function TitleBar({ activeEntry }: { activeEntry: RegistryEntry | undefined }) {
  const { drawerOpen, openDrawer, closeDrawer, menuButtonRef, isDrawerLayout } = useShell();
  const crumbs = activeEntry ? getBreadcrumbs(activeEntry).map((c) => c.name) : [];
  const tail = activeEntry ? crumbs[crumbs.length - 1] : "404 — file not found";
  const lead = crumbs.slice(0, -1).join(" › ");

  return (
    <header className={styles.titleBar}>
      <button
        ref={menuButtonRef}
        type="button"
        className={styles.menu}
        aria-label="Explorer"
        aria-expanded={drawerOpen}
        aria-controls={EXPLORER_DRAWER_ID}
        aria-haspopup={isDrawerLayout ? "dialog" : undefined}
        onClick={() => (drawerOpen ? closeDrawer("trigger") : openDrawer())}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <p className={styles.title}>
        <span className="sr-only">Garth Oliver, </span>
        {lead && (
          <span className={styles.lead} aria-hidden="true">
            {lead} ›{" "}
          </span>
        )}
        <span className={styles.tail}>{tail}</span>
        <span className={styles.suffix}> — portfolio</span>
      </p>
    </header>
  );
}
