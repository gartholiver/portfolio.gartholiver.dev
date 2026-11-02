import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import {
  COMPLETION_TEXT,
  FIELDS,
  FIELD_META,
  LIMITS,
  hasDraft,
  isFieldStep,
  stepNumber,
  type ContactAction,
  type ContactField,
  type ContactState,
} from "./contact-flow";
import { withRepeatMarker } from "~/lib/announce";
import { contactStore } from "./contact-store";
import styles from "./ContactTerminal.module.css";

const INPUT_ID = "contact-input";
const HINT_ID = "contact-hint";
const ERROR_ID = "contact-error";

/**
 * Guided contact demo: name → email → message → review → demo completion.
 *
 * It is a demonstration only: no network requests, no Netlify Forms, no stored records. The
 * draft lives in a module-level in-memory store (see contact-store.ts), so it survives collapsing
 * the terminal and navigating between pages, and is cleared by a full refresh.
 *
 * The terminal panel moves focus to the first `[data-terminal-focus]` element when contact is
 * opened, so that attribute always marks the active input (or the primary button at review/done).
 */
export function ContactTerminal() {
  const state = useSyncExternalStore(contactStore.subscribe, contactStore.getState, contactStore.getServerState);
  const rootRef = useRef<HTMLDivElement>(null);
  const focusPending = useRef(false);

  /** Dispatch a user action; if it changed anything, move focus to the new active control. */
  function act(action: ContactAction) {
    const before = contactStore.getState();
    focusPending.current = true;
    contactStore.dispatch(action);
    if (contactStore.getState() === before) focusPending.current = false;
  }

  // After Continue / Back / Edit / Restart / a validation error: focus the active control and make
  // sure it and its buttons are visible inside the (internally scrolling) terminal body.
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    const root = rootRef.current;
    const target = root?.querySelector<HTMLElement>("[data-terminal-focus]");
    if (!root || !target) return;
    target.focus({ preventScroll: true });
    reveal(target);
  }, [state]);

  // On-screen keyboards shrink the visual viewport; keep the focused control in view.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onResize = () => {
      const root = rootRef.current;
      const active = document.activeElement;
      if (root && active instanceof HTMLElement && root.contains(active)) reveal(active);
    };
    viewport.addEventListener("resize", onResize);
    return () => viewport.removeEventListener("resize", onResize);
  }, []);

  const { step } = state;
  const answered = answeredFields(state);

  return (
    <div ref={rootRef} className={styles.terminal}>
      <p className={styles.banner}>
        <span className={styles.bannerDot} aria-hidden="true" />
        <span>Demo — nothing is sent</span>
        <span className={styles.stepInfo}>{stepLabel(step)}</span>
      </p>
      <p className={styles.line}>Welcome. Answer a few quick questions to get in touch.</p>

      {answered.map((field) => (
        <div key={field} className={styles.answer}>
          <span className={styles.command} aria-hidden="true">
            {FIELD_META[field].command}
          </span>
          <span className="sr-only">{`${FIELD_META[field].label}:`}</span>
          <span className={field === "message" ? styles.valueBlock : styles.value}>{state.values[field]}</span>
          {step === "review" ? (
            <button type="button" className={styles.inlineButton} onClick={() => act({ type: "edit", field })}>
              Edit {field}
            </button>
          ) : null}
        </div>
      ))}

      {isFieldStep(step) ? (
        <FieldStep state={state} act={act} />
      ) : step === "review" ? (
        <form
          className={styles.step}
          data-contact-step
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            act({ type: "submit" });
          }}
        >
          <p className={styles.prompt}>
            <span className={styles.command} aria-hidden="true">
              $ contact --review
            </span>{" "}
            Check your answers.
          </p>
          <p id={HINT_ID} className={styles.hint}>
            This is a demonstration. Finishing will not send anything.
          </p>
          <div className={styles.actions} data-contact-actions>
            <button type="submit" className={styles.primary} data-terminal-focus>
              Finish demo
            </button>
            <button type="button" className={styles.button} onClick={() => act({ type: "back" })}>
              Back
            </button>
            <button type="button" className={styles.button} onClick={() => act({ type: "restart" })}>
              Restart
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.step} data-contact-step>
          <p className={styles.success}>{COMPLETION_TEXT}</p>
          <div className={styles.actions} data-contact-actions>
            <button type="button" className={styles.primary} data-terminal-focus onClick={() => act({ type: "restart" })}>
              Start again
            </button>
          </div>
        </div>
      )}

      {/* Polite live region: step changes, validation errors, restart. */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-contact-live>
        {withRepeatMarker(state.announcement, state.announcementSeq)}
      </div>
    </div>
  );
}

function FieldStep({ state, act }: { state: ContactState; act: (action: ContactAction) => void }) {
  const field = state.step as ContactField;
  const meta = FIELD_META[field];
  const error = state.error?.field === field ? state.error.message : null;
  const isMessage = field === "message";
  const hint = isMessage ? "Enter adds a new line · Ctrl/Cmd+Enter to continue" : "Press Enter or choose Continue.";
  const describedBy = [error ? ERROR_ID : null, HINT_ID].filter(Boolean).join(" ");

  const common = {
    id: INPUT_ID,
    value: state.draft,
    maxLength: LIMITS[field] + 50, // validation reports "too long"; this only stops runaway pastes
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": true,
    spellCheck: false,
    "data-terminal-focus": true,
    className: styles.input,
  } as const;

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
      event.preventDefault();
      act({ type: "submit" });
    }
  }

  return (
    <form
      className={styles.step}
      data-contact-step
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        act({ type: "submit" });
      }}
    >
      <label htmlFor={INPUT_ID} className={styles.prompt}>
        <span className={`${styles.command} ${styles.promptCommand}`} aria-hidden="true">
          {meta.command}
        </span>{" "}
        {meta.question}
      </label>
      <div className={styles.field}>
        <span className={styles.chevron} aria-hidden="true">
          &gt;
        </span>
        {isMessage ? (
          <textarea
            key={field}
            {...common}
            rows={2}
            autoComplete="off"
            onKeyDown={onKeyDown}
            onChange={(event) => typeInto({ type: "input", value: event.target.value })}
          />
        ) : (
          <input
            key={field}
            {...common}
            type={field === "email" ? "email" : "text"}
            inputMode={field === "email" ? "email" : "text"}
            autoComplete={field === "email" ? "email" : "name"}
            autoCapitalize={field === "email" ? "none" : "words"}
            onChange={(event) => typeInto({ type: "input", value: event.target.value })}
          />
        )}
      </div>
      <p id={HINT_ID} className={styles.hint}>
        {hint}
      </p>
      {error ? (
        <p id={ERROR_ID} className={styles.error}>
          {error}
        </p>
      ) : null}
      <div className={styles.actions} data-contact-actions>
        <button type="submit" className={styles.primary}>
          Continue
        </button>
        {field !== "name" || state.editing ? (
          <button type="button" className={styles.button} onClick={() => act({ type: "back" })}>
            {state.editing ? "Back to review" : "Back"}
          </button>
        ) : null}
        {hasDraft(state) ? (
          <button type="button" className={styles.button} onClick={() => act({ type: "restart" })}>
            Restart
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** Typing never moves focus; dispatch straight to the store. */
function typeInto(action: ContactAction) {
  contactStore.dispatch(action);
}

function stepLabel(step: ContactState["step"]): string {
  if (isFieldStep(step)) return `Step ${stepNumber(step)} of ${FIELDS.length}`;
  return step === "review" ? "Review" : "Done";
}

function answeredFields(state: ContactState): ContactField[] {
  const { step } = state;
  if (step === "review" || step === "done") return [...FIELDS];
  if (state.editing) return FIELDS.filter((field) => field !== step);
  return FIELDS.slice(0, FIELDS.indexOf(step as ContactField));
}

/** Space at the top of the scroll area taken by the sticky "Demo" banner. */
const BANNER_CLEARANCE = 34;

function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/**
 * Scroll the terminal body so the active control and the step's buttons are visible. The buttons
 * win when both fit; if they don't, the control itself (just below the sticky banner) wins.
 * Jumps instantly (no smooth scrolling), so reduced-motion is respected by construction.
 */
function reveal(target: HTMLElement) {
  const container = scrollParent(target);
  if (!container) return;
  const view = container.getBoundingClientRect();
  const actions = target.closest("[data-contact-step]")?.querySelector<HTMLElement>("[data-contact-actions]");

  const bottomEdge = actions?.getBoundingClientRect().bottom ?? target.getBoundingClientRect().bottom;
  const overflowBelow = bottomEdge + 6 - view.bottom;
  if (overflowBelow > 0) container.scrollTop += overflowBelow;

  const hiddenAbove = view.top + BANNER_CLEARANCE - target.getBoundingClientRect().top;
  if (hiddenAbove > 0) container.scrollTop -= hiddenAbove;
}
