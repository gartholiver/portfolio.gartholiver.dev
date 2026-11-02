import { useEffect, useRef } from "react";
import type { RegistryEntry } from "~/content/registry";
import { Explorer } from "./Explorer";
import { useShell } from "./ShellContext";
import { EXPLORER_DRAWER_ID } from "./TitleBar";
import styles from "./ExplorerDrawer.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function isVisible(el: HTMLElement) {
  return typeof el.checkVisibility === "function" ? el.checkVisibility({ visibilityProperty: true }) : el.offsetParent !== null;
}

/**
 * Wraps the explorer. On desktop it is a fixed 280px sidebar; below 900px it is an off-canvas
 * navigation drawer (role="dialog", aria-modal) that:
 *  - moves focus inside when opened (the close button),
 *  - keeps Tab/Shift+Tab inside (and the rest of the shell is `inert`, see ShellLayout),
 *  - closes on Escape, backdrop click, the close button, or navigation,
 *  - returns focus to the menu button (or to the content after navigating).
 */
export function ExplorerDrawer({ activeEntry }: { activeEntry: RegistryEntry | undefined }) {
  const { drawerOpen, closeDrawer, isDrawerLayout } = useShell();
  const ref = useRef<HTMLDivElement>(null);
  const modal = drawerOpen && isDrawerLayout;

  useEffect(() => {
    if (!modal) return;
    ref.current?.querySelector<HTMLElement>("[data-drawer-initial-focus]")?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        closeDrawer("trigger");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modal, closeDrawer]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !modal || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !ref.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !ref.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <div className={styles.backdrop} data-open={modal} onClick={() => closeDrawer("trigger")} aria-hidden="true" />
      <div
        id={EXPLORER_DRAWER_ID}
        ref={ref}
        className={styles.drawer}
        data-shell-drawer=""
        data-open={modal}
        role={modal ? "dialog" : undefined}
        aria-modal={modal ? true : undefined}
        aria-label={modal ? "Explorer" : undefined}
        onKeyDown={onKeyDown}
      >
        <Explorer activeEntry={activeEntry} onClose={() => closeDrawer("trigger")} />
      </div>
    </>
  );
}
