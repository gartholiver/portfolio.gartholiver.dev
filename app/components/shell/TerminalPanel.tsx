import { useEffect, useRef } from "react";
import { ContactTerminal } from "~/components/contact/ContactTerminal";
import { useShell } from "./ShellContext";
import styles from "./TerminalPanel.module.css";

export const TERMINAL_PANEL_ID = "terminal-panel";
const BODY_ID = "terminal-body";

/**
 * Collapsible contact terminal. Container only: the body renders <ContactTerminal /> (replaced by
 * the guided flow later). The body is `hidden` rather than unmounted when collapsed, so in-memory
 * drafts survive collapsing and navigation (the shell stays mounted).
 */
export function TerminalPanel() {
  const { terminalOpen, terminalIsDefault, toggleTerminal, contactFocusRequest } = useShell();
  const bodyRef = useRef<HTMLDivElement>(null);
  const handledRequest = useRef(contactFocusRequest);

  // openContact() → focus the terminal (first [data-terminal-focus] element, else the body).
  useEffect(() => {
    if (contactFocusRequest === handledRequest.current) return;
    handledRequest.current = contactFocusRequest;
    const body = bodyRef.current;
    if (!body) return;
    const target = body.querySelector<HTMLElement>("[data-terminal-focus]") ?? body;
    target.focus({ preventScroll: false });
    target.scrollIntoView?.({ block: "nearest" });
  }, [contactFocusRequest]);

  return (
    <section
      id={TERMINAL_PANEL_ID}
      className={styles.panel}
      aria-labelledby="terminal-title"
      data-open={terminalOpen}
      data-default={terminalIsDefault}
    >
      <h2 id="terminal-title" className={styles.heading}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={terminalOpen}
          aria-controls={BODY_ID}
          onClick={toggleTerminal}
        >
          <svg className={styles.chevron} width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1.5 3 5 6.5 8.5 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Terminal · contact.me</span>
        </button>
      </h2>
      <div id={BODY_ID} ref={bodyRef} className={styles.body} hidden={!terminalOpen} tabIndex={0}>
        <ContactTerminal />
      </div>
    </section>
  );
}
