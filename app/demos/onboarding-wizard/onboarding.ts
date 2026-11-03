/**
 * Pure onboarding rules for the onboarding wizard demo. No React, no module state: every function
 * takes an OnboardingState and returns a result carrying the next state (the same object when
 * nothing changed). The in-memory store (./store.ts) and the component build on this.
 *
 * Rules
 * - The flow has a fixed number of steps; Next and Back move one step at a time.
 * - Complete is only possible on the last step; it unlocks the dashboard navigation.
 * - After completion the flow is finished: only Reset (in the component) starts it again.
 */
import { DASHBOARD_NAV_ITEMS, ONBOARDING_STEPS, type OnboardingStep } from "~/fixtures/intranet";

export interface OnboardingState {
  readonly stepIndex: number;
  readonly completed: boolean;
}

export const INITIAL_STATE: OnboardingState = Object.freeze({ stepIndex: 0, completed: false });
export const TOTAL_STEPS: number = ONBOARDING_STEPS.length;

export type MoveResult =
  | { ok: true; state: OnboardingState; stepIndex: number }
  | { ok: false; state: OnboardingState; reason: "at-first-step" | "at-last-step" | "completed" };
export type CompleteResult =
  | { ok: true; state: OnboardingState }
  | { ok: false; state: OnboardingState; reason: "not-at-last-step" | "already-completed" };

export interface ProgressInfo {
  current: number;
  total: number;
  percent: number;
  label: string;
}

export function getStep(state: OnboardingState): OnboardingStep {
  return ONBOARDING_STEPS[state.stepIndex]!;
}

export function isFirstStep(state: OnboardingState): boolean {
  return state.stepIndex === 0;
}

export function isLastStep(state: OnboardingState): boolean {
  return state.stepIndex === TOTAL_STEPS - 1;
}

export function isNavUnlocked(state: OnboardingState): boolean {
  return state.completed;
}

export function progress(state: OnboardingState): ProgressInfo {
  const total = TOTAL_STEPS;
  const current = state.completed ? total : state.stepIndex + 1;
  return {
    current,
    total,
    percent: Math.round((current / total) * 100),
    label: state.completed ? `All ${total} steps complete` : `Step ${current} of ${total}`,
  };
}

export function next(state: OnboardingState): MoveResult {
  if (state.completed) return { ok: false, state, reason: "completed" };
  if (isLastStep(state)) return { ok: false, state, reason: "at-last-step" };
  const stepIndex = state.stepIndex + 1;
  return { ok: true, state: { stepIndex, completed: false }, stepIndex };
}

export function back(state: OnboardingState): MoveResult {
  if (state.completed) return { ok: false, state, reason: "completed" };
  if (isFirstStep(state)) return { ok: false, state, reason: "at-first-step" };
  const stepIndex = state.stepIndex - 1;
  return { ok: true, state: { stepIndex, completed: false }, stepIndex };
}

export function complete(state: OnboardingState): CompleteResult {
  if (state.completed) return { ok: false, state, reason: "already-completed" };
  if (!isLastStep(state)) return { ok: false, state, reason: "not-at-last-step" };
  return { ok: true, state: { stepIndex: state.stepIndex, completed: true } };
}

export function reset(): OnboardingState {
  return INITIAL_STATE;
}

export function describeMove(result: MoveResult): string {
  if (result.ok) {
    const title = ONBOARDING_STEPS[result.stepIndex]!.title;
    return `Step ${result.stepIndex + 1} of ${TOTAL_STEPS}: ${title}.`;
  }
  switch (result.reason) {
    case "at-first-step":
      return "You're already on the first step.";
    case "at-last-step":
      return "You're already on the last step. Choose Complete onboarding to finish.";
    case "completed":
      return "Onboarding is already complete.";
  }
}

export function describeComplete(result: CompleteResult): string {
  if (result.ok) return "Onboarding complete. The dashboard navigation is now unlocked.";
  return result.reason === "not-at-last-step"
    ? "Finish every step before completing onboarding."
    : "Onboarding is already complete.";
}

export const RESET_ANNOUNCEMENT = "Demo reset. Onboarding starts again at step 1.";
export { DASHBOARD_NAV_ITEMS };
