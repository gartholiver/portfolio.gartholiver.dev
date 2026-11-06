import { useEffect, useState, useSyncExternalStore } from "react";
import { useRepeatableAnnouncement } from "~/lib/announce";
import {
  DASHBOARD_NAV_ITEMS,
  RESET_ANNOUNCEMENT,
  TOTAL_STEPS,
  describeComplete,
  describeMove,
  getStep,
  isFirstStep,
  isLastStep,
  isNavUnlocked,
  progress,
  type OnboardingState,
} from "./onboarding";
import { onboardingStore } from "./store";
import styles from "./OnboardingWizard.module.css";

function useOnboardingState(): OnboardingState {
  return useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getSnapshot,
    onboardingStore.getServerSnapshot,
  );
}

interface FocusRequest {
  ids: readonly string[];
  seq: number;
}

/**
 * Illustrative new-starter onboarding: a stepped flow with progress, Back/Next/Complete and a mock
 * dashboard navigation that unlocks on completion. Progress lives in memory (see ./store.ts) —
 * nothing is saved anywhere.
 */
export function OnboardingWizard() {
  const state = useOnboardingState();
  const [message, announce] = useRepeatableAnnouncement();
  const [motion, setMotion] = useState<"forward" | "back" | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  // Focus moves only after explicit actions: the first requested id that exists in the DOM wins.
  useEffect(() => {
    if (!focusRequest) return;
    for (const id of focusRequest.ids) {
      const element = document.getElementById(id);
      if (element) {
        element.focus();
        return;
      }
    }
  }, [focusRequest]);

  function requestFocus(ids: readonly string[]) {
    setFocusRequest((previous) => ({ ids, seq: (previous?.seq ?? 0) + 1 }));
  }

  const info = progress(state);
  const step = getStep(state);
  const unlocked = isNavUnlocked(state);
  const headingId = state.completed ? "onboarding-complete-heading" : "onboarding-step-heading";

  function move(direction: "forward" | "back") {
    const result = direction === "forward" ? onboardingStore.next() : onboardingStore.back();
    announce(describeMove(result));
    if (result.ok) {
      setMotion(direction);
      requestFocus(["onboarding-step-heading"]);
    }
  }

  function finish() {
    const result = onboardingStore.complete();
    announce(describeComplete(result));
    if (result.ok) {
      setMotion(null);
      requestFocus(["onboarding-complete-heading"]);
    }
  }

  return (
    <div className={styles.root} data-demo="onboarding-wizard">
      <p className={styles.note}>
        Sample data: these onboarding steps are fictional and nothing is saved. Your progress is kept only while you
        browse this site; refreshing the page or choosing Reset demo starts the tour again.
      </p>

      <div className={styles.toolbar}>
        <p className={styles.progressLabel} data-testid="onboarding-progress-label">
          {info.label}
        </p>
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            onboardingStore.reset();
            setMotion(null);
            announce(RESET_ANNOUNCEMENT);
          }}
        >
          Reset demo
        </button>
      </div>

      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true" data-testid="onboarding-status">
        {message}
      </p>

      <section className={styles.card} aria-labelledby={headingId}>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={info.current}
          aria-valuetext={info.label}
        >
          <div className={styles.fill} style={{ width: `${info.percent}%` }} />
        </div>

        {state.completed ? (
          <div className={styles.complete}>
            <h2 id="onboarding-complete-heading" tabIndex={-1} className={styles.stepTitle}>
              Onboarding complete
            </h2>
            <p>
              The dashboard header and navigation are now unlocked. In the real intranet this step saved a flag on the
              user&rsquo;s account, so the redirect to onboarding stopped. Here nothing is saved; choose Reset demo to
              start again.
            </p>
          </div>
        ) : (
          <div className={styles.stepViewport}>
            <div key={step.id} className={styles.step} data-testid="onboarding-step" data-motion={motion ?? undefined}>
              <h2 id="onboarding-step-heading" tabIndex={-1} className={styles.stepTitle}>
                {step.title}
              </h2>
              {step.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {step.bullets ? (
                <ul className={styles.bullets}>
                  {step.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} disabled={isFirstStep(state)} onClick={() => move("back")}>
                  Back
                </button>
                {isLastStep(state) ? (
                  <button type="button" className={styles.primary} onClick={finish}>
                    Complete onboarding
                  </button>
                ) : (
                  <button type="button" className={styles.primary} onClick={() => move("forward")}>
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={styles.nav} aria-labelledby="onboarding-nav-heading">
        <h2 id="onboarding-nav-heading" className={styles.navHeading}>
          Dashboard navigation (preview)
        </h2>
        <p className={styles.navState} data-testid="onboarding-nav-state">
          {unlocked
            ? "Unlocked: the header and navigation are now available."
            : "Locked until onboarding is complete."}
        </p>
        <ul className={styles.navList}>
          {DASHBOARD_NAV_ITEMS.map((item) => (
            <li key={item.id} className={unlocked ? styles.navOpen : styles.navLocked}>
              <span>{item.label}</span> <span className={styles.navTag}>{unlocked ? "Available" : "Locked"}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.rule}>
        In the real intranet, new users were redirected to this flow on every page until they finished it. Each step was
        a training page written by an administrator, and completing the last step set a flag on the user&rsquo;s
        account that unlocked the dashboard header and navigation.
      </p>
    </div>
  );
}
