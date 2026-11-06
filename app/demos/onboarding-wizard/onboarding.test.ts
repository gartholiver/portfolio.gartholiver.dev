import { describe, expect, it } from "vitest";
import {
  INITIAL_STATE,
  back,
  complete,
  describeComplete,
  describeMove,
  isNavUnlocked,
  next,
  progress,
  reset,
  type OnboardingState,
} from "./onboarding";

const at = (stepIndex: number, completed = false): OnboardingState => ({ stepIndex, completed });

describe("onboarding rules", () => {
  it("starts on step 1 with the navigation locked", () => {
    expect(progress(INITIAL_STATE)).toEqual({ current: 1, total: 5, percent: 20, label: "Step 1 of 5" });
    expect(isNavUnlocked(INITIAL_STATE)).toBe(false);
  });

  it("moves forward from the first step without mutating the initial state", () => {
    const r = next(INITIAL_STATE);
    expect(r).toMatchObject({ ok: true, stepIndex: 1 });
    expect(r.state.stepIndex).toBe(1);
    expect(INITIAL_STATE.stepIndex).toBe(0);
    expect(describeMove(r)).toBe("Step 2 of 5: How the intranet is organised.");
  });

  it("refuses Back on the first step", () => {
    const r = back(INITIAL_STATE);
    expect(r).toMatchObject({ ok: false, reason: "at-first-step" });
    expect(r.state).toBe(INITIAL_STATE);
    expect(describeMove(r)).toBe("You're already on the first step.");
  });

  it("refuses Next on the last step", () => {
    const state = at(4);
    const r = next(state);
    expect(r).toMatchObject({ ok: false, reason: "at-last-step" });
    expect(r.state).toBe(state);
    expect(describeMove(r)).toBe("You're already on the last step. Choose Complete onboarding to finish.");
  });

  it("moves back from a middle step", () => {
    const r = back(at(2));
    expect(r).toMatchObject({ ok: true, stepIndex: 1 });
    expect(describeMove(r)).toBe("Step 2 of 5: How the intranet is organised.");
  });

  it("refuses to complete before the last step", () => {
    const state = at(2);
    const r = complete(state);
    expect(r).toMatchObject({ ok: false, reason: "not-at-last-step" });
    expect(r.state).toBe(state);
    expect(describeComplete(r)).toBe("Finish every step before completing onboarding.");
  });

  it("completes on the last step and unlocks the navigation", () => {
    const r = complete(at(4));
    expect(r.ok).toBe(true);
    expect(r.state.completed).toBe(true);
    expect(progress(r.state)).toMatchObject({ current: 5, percent: 100, label: "All 5 steps complete" });
    expect(isNavUnlocked(r.state)).toBe(true);
    expect(describeComplete(r)).toBe("Onboarding complete. The dashboard navigation is now unlocked.");
  });

  it("refuses every action after completion", () => {
    const state = at(4, true);
    for (const r of [next(state), back(state)]) {
      expect(r).toMatchObject({ ok: false, reason: "completed" });
      expect(r.state).toBe(state);
      expect(describeMove(r)).toBe("Onboarding is already complete.");
    }
    const c = complete(state);
    expect(c).toMatchObject({ ok: false, reason: "already-completed" });
    expect(c.state).toBe(state);
    expect(describeComplete(c)).toBe("Onboarding is already complete.");
  });

  it("reset returns the initial state object", () => {
    expect(reset()).toBe(INITIAL_STATE);
  });
});
