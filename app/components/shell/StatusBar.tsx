import type { RegistryEntry } from "~/content/registry";
import { describeKind } from "./explorer-state";
import { useShell } from "./ShellContext";
import { TERMINAL_PANEL_ID } from "./TerminalPanel";
import styles from "./StatusBar.module.css";

/** Compact status bar: fake branch label, current file kind, phase note and a terminal toggle. */
export function StatusBar({ activeEntry }: { activeEntry: RegistryEntry | undefined }) {
  const { terminalOpen, toggleTerminal } = useShell();
  return (
    <footer className={styles.statusBar}>
      <div className={styles.group}>
        <span className={styles.item}>
          <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M5 3v10M5 9c0-2 1.5-3 4-3h1M11 4.5a1.5 1.5 0 1 0 0-.01M5 2.5a1.5 1.5 0 1 0 0 .01M5 13.5a1.5 1.5 0 1 0 0-.01"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          main
        </span>
        <span className={styles.item}>{describeKind(activeEntry)}</span>
      </div>
      <div className={styles.group}>
        <span className={`${styles.item} ${styles.phase}`}>phase 1 · placeholder content · noindex</span>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={terminalOpen}
          aria-controls={TERMINAL_PANEL_ID}
          onClick={toggleTerminal}
        >
          Terminal
        </button>
      </div>
    </footer>
  );
}
