import styles from "./ContactTerminal.module.css";

/**
 * Placeholder for the guided contact flow (name → email → message → review → demo completion),
 * which replaces this component in a later task. The terminal panel renders it in its body slot
 * and moves focus to the first `[data-terminal-focus]` element when the panel is opened via
 * `openContact()` — keep that attribute on whichever element should receive focus (e.g. the
 * first prompt input).
 */
export function ContactTerminal() {
  return (
    <div className={styles.terminal}>
      <p className={styles.line} data-terminal-focus tabIndex={-1}>
        Welcome. The guided contact demo is coming soon.
      </p>
      <p className={styles.line}>This is a demonstration only: nothing you type here will be sent anywhere.</p>
    </div>
  );
}
