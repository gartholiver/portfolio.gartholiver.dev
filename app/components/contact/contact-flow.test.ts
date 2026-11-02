import { describe, expect, it } from "vitest";
import {
  COMPLETION_TEXT,
  contactReducer,
  createInitialState,
  hasDraft,
  isValidEmail,
  validateField,
  type ContactAction,
  type ContactState,
} from "./contact-flow";

function run(actions: ContactAction[], from: ContactState = createInitialState()): ContactState {
  return actions.reduce(contactReducer, from);
}
const type = (value: string): ContactAction => ({ type: "input", value });
const submit: ContactAction = { type: "submit" };

const atReview = () =>
  run([type("Ada"), submit, type("ada@example.com"), submit, type("Hello\nthere"), submit]);

describe("validation", () => {
  it("requires a trimmed, non-empty value for every field", () => {
    expect(validateField("name", "   ")).toMatch(/name/i);
    expect(validateField("email", "")).toMatch(/email/i);
    expect(validateField("message", "\n \t")).toMatch(/message/i);
    expect(validateField("name", " Ada ")).toBeNull();
  });

  it("accepts reasonable email addresses and rejects obviously wrong ones", () => {
    for (const ok of ["ada@example.com", " a.b+c@sub.example.co.uk ", "x@y.io", "名前@例え.jp"]) {
      expect(isValidEmail(ok), ok).toBe(true);
    }
    for (const bad of ["ada", "ada@", "@example.com", "ada@example", "ada@@example.com", "a da@example.com", "ada@.com", "ada@example."]) {
      expect(isValidEmail(bad), bad).toBe(false);
    }
    expect(validateField("email", "nope")).toMatch(/doesn't look like an email/);
  });

  it("rejects over-long values", () => {
    expect(validateField("name", "x".repeat(101))).toMatch(/under 100/);
  });
});

describe("step transitions", () => {
  it("starts at name with an empty draft", () => {
    const state = createInitialState();
    expect(state.step).toBe("name");
    expect(hasDraft(state)).toBe(false);
  });

  it("goes name → email → message → review → done", () => {
    let state = run([type("Ada"), submit]);
    expect(state.step).toBe("email");
    expect(state.draft).toBe("");
    state = run([type("ada@example.com"), submit], state);
    expect(state.step).toBe("message");
    state = run([type("Hi"), submit], state);
    expect(state.step).toBe("review");
    expect(state.values).toEqual({ name: "Ada", email: "ada@example.com", message: "Hi" });
    state = run([submit], state);
    expect(state.step).toBe("done");
    expect(COMPLETION_TEXT).toBe("Demo complete — nothing was sent.");
    expect(state.announcement).toMatch(/Nothing was sent/);
  });

  it("trims answers when accepting them", () => {
    const state = run([type("  Ada  "), submit, type(" ada@example.com "), submit, type("\n  hi there \n"), submit]);
    expect(state.values).toEqual({ name: "Ada", email: "ada@example.com", message: "hi there" });
  });

  it("keeps interior newlines in the message", () => {
    expect(atReview().values.message).toBe("Hello\nthere");
  });

  it("stays on the step and reports an error for empty and invalid input", () => {
    let state = run([type("   "), submit]);
    expect(state.step).toBe("name");
    expect(state.error).toEqual({ field: "name", message: expect.stringMatching(/name/i) });
    expect(state.announcement).toMatch(/^Error: /);

    state = run([type("Ada"), submit, type("not-an-email"), submit]);
    expect(state.step).toBe("email");
    expect(state.error?.field).toBe("email");
    expect(state.values.email).toBe("");
  });

  it("clears the error when the user types, and announces repeated errors again", () => {
    const first = run([submit]);
    const second = run([submit], first);
    expect(second.announcement).toBe(first.announcement);
    expect(second.announcementSeq).toBeGreaterThan(first.announcementSeq);
    expect(run([type("A")], first).error).toBeNull();
  });

  it("ignores input and submit once done", () => {
    const done = run([submit], atReview());
    expect(contactReducer(done, type("x"))).toBe(done);
    expect(contactReducer(done, submit)).toBe(done);
  });
});

describe("back", () => {
  it("returns to the previous step with the saved answer prefilled", () => {
    const state = run([type("Ada"), submit, { type: "back" }]);
    expect(state.step).toBe("name");
    expect(state.draft).toBe("Ada");
  });

  it("keeps a valid half-typed answer but drops an invalid one", () => {
    let state = run([type("Ada"), submit, type("ada@example.com"), { type: "back" }, submit]);
    expect(state.step).toBe("email");
    expect(state.draft).toBe("ada@example.com");

    state = run([type("Ada"), submit, type("half-typed"), { type: "back" }, submit]);
    expect(state.draft).toBe("");
  });

  it("does nothing on the first step and goes review → message", () => {
    const first = createInitialState();
    expect(contactReducer(first, { type: "back" })).toBe(first);
    const state = run([{ type: "back" }], atReview());
    expect(state.step).toBe("message");
    expect(state.draft).toBe("Hello\nthere");
  });
});

describe("edit from review", () => {
  it.each(["name", "email", "message"] as const)("edits %s with the value prefilled and returns to review", (field) => {
    const review = atReview();
    let state = run([{ type: "edit", field }], review);
    expect(state.step).toBe(field);
    expect(state.editing).toBe(true);
    expect(state.draft).toBe(review.values[field]);

    state = run([type(field === "email" ? " new@example.org " : " Changed "), submit], state);
    expect(state.step).toBe("review");
    expect(state.editing).toBe(false);
    expect(state.values[field]).toBe(field === "email" ? "new@example.org" : "Changed");
    for (const other of ["name", "email", "message"] as const) {
      if (other !== field) expect(state.values[other]).toBe(review.values[other]);
    }
  });

  it("validates edits and keeps editing on error", () => {
    const state = run([{ type: "edit", field: "email" }, type("bad"), submit], atReview());
    expect(state.step).toBe("email");
    expect(state.editing).toBe(true);
    expect(state.error?.field).toBe("email");
  });

  it("Back during an edit returns to review without changing the saved value", () => {
    const review = atReview();
    const state = run([{ type: "edit", field: "name" }, type("Someone else"), { type: "back" }], review);
    expect(state.step).toBe("review");
    expect(state.values).toEqual(review.values);
  });

  it("only edits from review", () => {
    const state = createInitialState();
    expect(contactReducer(state, { type: "edit", field: "email" })).toBe(state);
  });
});

describe("restart", () => {
  it("clears the draft, returns to name and announces it", () => {
    const before = atReview();
    const state = run([{ type: "restart" }], before);
    expect(state.step).toBe("name");
    expect(state.values).toEqual({ name: "", email: "", message: "" });
    expect(state.draft).toBe("");
    expect(state.error).toBeNull();
    expect(state.editing).toBe(false);
    expect(state.announcement).toMatch(/Draft cleared/);
    expect(state.announcementSeq).toBeGreaterThan(before.announcementSeq);
    expect(hasDraft(state)).toBe(false);
  });

  it("works from the completion screen", () => {
    const state = run([submit, { type: "restart" }], atReview());
    expect(state.step).toBe("name");
    expect(state.values.name).toBe("");
  });
});
