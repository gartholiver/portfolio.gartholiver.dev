import { useEffect } from "react";
import { useLocation } from "react-router";
import { getEntryByPathname } from "~/content/registry";
import { ContentPanel } from "./ContentPanel";
import { ExplorerDrawer } from "./ExplorerDrawer";
import { FileHeader } from "./FileHeader";
import { RouteAnnouncer } from "./RouteAnnouncer";
import { useShell } from "./ShellContext";
import { StatusBar } from "./StatusBar";
import { TerminalPanel } from "./TerminalPanel";
import { TitleBar } from "./TitleBar";
import styles from "./ShellLayout.module.css";

/** The persistent editor shell. Rendered by the layout route, so it stays mounted across navigation. */
export function ShellLayout() {
  const { pathname } = useLocation();
  const activeEntry = getEntryByPathname(pathname);
  const { drawerOpen, closeDrawer, contentRef } = useShell();

  // Any location change (links, back/forward) dismisses the drawer; focus goes to the content.
  useEffect(() => {
    closeDrawer("content");
  }, [pathname, closeDrawer]);

  // While the modal drawer is open, the rest of the shell is inert (no focus, no AT access).
  const inert = drawerOpen;

  return (
    <div className={styles.shell}>
      <a
        href="#content"
        className={styles.skipLink}
        inert={inert}
        onClick={(e) => {
          e.preventDefault();
          contentRef.current?.focus();
        }}
      >
        Skip to main content
      </a>
      <div className={styles.titleRow} inert={inert}>
        <TitleBar activeEntry={activeEntry} />
      </div>
      <div className={styles.body}>
        <ExplorerDrawer activeEntry={activeEntry} />
        <div className={styles.editor} inert={inert}>
          <FileHeader activeEntry={activeEntry} />
          <ContentPanel />
          <TerminalPanel />
        </div>
      </div>
      <div className={styles.statusRow} inert={inert}>
        <StatusBar activeEntry={activeEntry} />
      </div>
      <RouteAnnouncer activeEntry={activeEntry} />
    </div>
  );
}
