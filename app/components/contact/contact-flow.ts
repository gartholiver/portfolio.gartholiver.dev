/**
 * Pure state machine for the guided contact demo: name → email → message → review → done.
 * Nothing here touches the DOM, the network or storage. The demo never sends anything.
 */

export type ContactField = "name" | "email" | "message";
export type ContactStep = ContactField | "review" | "done";

export const FIELDS: readonly ContactField[] = ["name", "email", "message"];

export const LIMITS: Record<ContactField, number> = { name: 100, email: 254, message: 2000 };

export const FIELD_META: Record<ContactField, { command: string; question: string; label: string }> = {
  name: { command: "$ contact --name", question: "What's your name?", label: "name" },
  email: { command: "$ contact --email", question: "What's your email?", label: "email" },
  message: { command: "$ contact --message", question: "What would you like to talk about?", label: "message" },
};

export const COMPLETION_TEXT = "Demo complete — nothing was sent.";

export type ContactValues = Record<ContactField, string>;

export interface ContactError {
  field: ContactField;
  message: string;
}

export interface ContactState {
  step: ContactStep;
  /** Accepted (trimmed, validated) answers. A field may also hold a valid draft saved by Back. */
  values: ContactValues;
  /** Text currently in the active input (prefilled from `values` when a step is entered). */
  draft: string;
  error: ContactError | null;
  /** True when a step was entered from the review screen; submitting returns to review. */
  editing: boolean;
  /** Text for the polite live region describing the latest change. */
  announcement: string;
  /** Increments with every change of announcement so identical messages can be re-announced. */
  announcementSeq: number;
}

export type ContactAction =
  | { type: "input"; value: string }
  | { type: "submit" }
  | { type: "back" }
  | { type: "edit"; field: ContactField }
  | { type: "restart" };

const EMPTY_VALUES: ContactValues = { name: "", email: "", message: "" };

// Deliberately lenient: something@something.tld, no whitespace, a single "@".
const EMAIL_RE = /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@.]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Returns an error message, or null when the (trimmed) value is acceptable for the field. */
export function validateField(field: ContactField, raw: string): string | null {
  const value = raw.trim();
  if (value === "") {
    switch (field) {
      case "name":
        return "Please enter your name.";
      case "email":
        return "Please enter your email address.";
      case "message":
        return "Please enter a message.";
    }
  }
  if (value.length > LIMITS[field]) return `Please keep this under ${LIMITS[field]} characters.`;
  if (field === "email" && !isValidEmail(value)) {
    return "That doesn't look like an email address. Try name@example.com.";
  }
  return null;
}

export function stepNumber(step: ContactStep): number {
  const index = FIELDS.indexOf(step as ContactField);
  return index === -1 ? FIELDS.length : index + 1;
}

export function isFieldStep(step: ContactStep): step is ContactField {
  return (FIELDS as readonly string[]).includes(step);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function announce(state: ContactState, announcement: string): ContactState {
  return { ...state, announcement, announcementSeq: state.announcementSeq + 1 };
}

function stepAnnouncement(step: ContactStep, editing: boolean): string {
  if (isFieldStep(step)) {
    const meta = FIELD_META[step];
    return editing
      ? `Editing ${meta.label}. ${meta.question} Continue returns to review.`
      : `Step ${stepNumber(step)} of ${FIELDS.length}: ${meta.question}`;
  }
  if (step === "review") return "Review your answers. Edit any of them, or finish the demo. Nothing is sent.";
  return "Demo complete. Nothing was sent. Start again to begin a new draft.";
}

export function createInitialState(): ContactState {
  return {
    step: "name",
    values: { ...EMPTY_VALUES },
    draft: "",
    error: null,
    editing: false,
    announcement: "",
    announcementSeq: 0,
  };
}

function enter(state: ContactState, step: ContactStep, editing: boolean, prefix = ""): ContactState {
  const draft = isFieldStep(step) ? state.values[step] : "";
  const next: ContactState = { ...state, step, editing, draft, error: null };
  return announce(next, `${prefix}${stepAnnouncement(step, editing)}`);
}

/** True when there is anything to clear (used to decide whether to show Restart). */
export function hasDraft(state: ContactState): boolean {
  return state.step !== "name" || state.draft !== "" || FIELDS.some((f) => state.values[f] !== "");
}

export function contactReducer(state: ContactState, action: ContactAction): ContactState {
  switch (action.type) {
    case "input": {
      if (!isFieldStep(state.step)) return state;
      return { ...state, draft: action.value, error: null };
    }

    case "submit": {
      if (state.step === "done") return state;
      if (state.step === "review") return enter(state, "done", false);

      const field = state.step;
      const message = validateField(field, state.draft);
      if (message) {
        return announce({ ...state, error: { field, message } }, `Error: ${message}`);
      }
      const values = { ...state.values, [field]: state.draft.trim() };
      const accepted = { ...state, values };
      if (state.editing) return enter(accepted, "review", false, `${capitalize(FIELD_META[field].label)} updated. `);
      const next = FIELDS[FIELDS.indexOf(field) + 1];
      return enter(accepted, next ?? "review", false);
    }

    case "back": {
      if (state.step === "done") return state;
      if (state.step === "review") return enter(state, "message", false);
      if (state.editing) return enter(state, "review", false);
      if (state.step === "name") return state;

      // Keep a valid half-typed answer so going back never loses text; drop invalid ones.
      const field = state.step;
      const values =
        validateField(field, state.draft) === null ? { ...state.values, [field]: state.draft.trim() } : state.values;
      const previous = FIELDS[FIELDS.indexOf(field) - 1] ?? "name";
      return enter({ ...state, values }, previous, false);
    }

    case "edit": {
      if (state.step !== "review") return state;
      return enter(state, action.field, true);
    }

    case "restart": {
      const fresh = createInitialState();
      return {
        ...fresh,
        announcement: `Draft cleared. Starting over. ${stepAnnouncement("name", false)}`,
        announcementSeq: state.announcementSeq + 1,
      };
    }
  }
}
