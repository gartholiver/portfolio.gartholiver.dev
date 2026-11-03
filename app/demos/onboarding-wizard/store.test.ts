import { describe, expect, it, vi } from "vitest";
import { INITIAL_STATE } from "./onboarding";
import { createOnboardingStore } from "./store";

describe("onboarding store", () => {
  it("serves the initial state as both client and server snapshot", () => {
    const store = createOnboardingStore();
    expect(store.getSnapshot()).toBe(INITIAL_STATE);
    expect(store.getServerSnapshot()).toBe(INITIAL_STATE);
  });

  it("notifies on change and not on failed actions", () => {
    const store = createOnboardingStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.back(); // at step 1
    store.complete(); // not at last step
    expect(listener).not.toHaveBeenCalled();

    expect(store.next()).toMatchObject({ ok: true, stepIndex: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().stepIndex).toBe(1);
  });

  it("completes through the store", () => {
    const store = createOnboardingStore();
    for (let i = 0; i < 4; i += 1) store.next();
    expect(store.next()).toMatchObject({ ok: false, reason: "at-last-step" });
    expect(store.complete().ok).toBe(true);
    expect(store.getSnapshot().completed).toBe(true);
    expect(store.complete()).toMatchObject({ ok: false, reason: "already-completed" });
  });

  it("reset is quiet when pristine and notifies once otherwise", () => {
    const store = createOnboardingStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.reset();
    expect(listener).not.toHaveBeenCalled();

    store.next();
    listener.mockClear();
    store.reset();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(INITIAL_STATE);
  });

  it("stops notifying after unsubscribe and keeps stores independent", () => {
    const a = createOnboardingStore();
    const b = createOnboardingStore();
    const listener = vi.fn();
    const unsubscribe = a.subscribe(listener);
    unsubscribe();
    a.next();
    expect(listener).not.toHaveBeenCalled();
    expect(b.getSnapshot()).toBe(INITIAL_STATE);
  });
});
