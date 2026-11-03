// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RESET_ANNOUNCEMENT } from "./onboarding";
import { OnboardingWizard } from "./OnboardingWizard";
import { onboardingStore } from "./store";

afterEach(() => {
  cleanup();
  onboardingStore.reset();
});

const visible = (text: string | null) => (text ?? "").replace(/​/g, "");

describe("OnboardingWizard", () => {
  it("moves focus to the new step heading on Next and announces the step", () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const heading = screen.getByRole("heading", { name: "How the intranet is organised" });
    expect(document.activeElement).toBe(heading);
    expect(heading.id).toBe("onboarding-step-heading");
    expect(visible(screen.getByRole("status").textContent)).toBe("Step 2 of 5: How the intranet is organised.");
  });

  it("disables Back on the first step", () => {
    render(<OnboardingWizard />);
    expect((screen.getByRole("button", { name: "Back" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("unlocks the navigation when the flow is completed", () => {
    render(<OnboardingWizard />);
    expect(screen.getAllByText("Locked")).toHaveLength(6);
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Complete onboarding" }));

    const heading = screen.getByRole("heading", { name: "Onboarding complete" });
    expect(document.activeElement).toBe(heading);
    expect(screen.getAllByText("Available")).toHaveLength(6);
    expect(screen.queryAllByText("Locked")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(visible(screen.getByRole("status").textContent)).toBe(
      "Onboarding complete. The dashboard navigation is now unlocked.",
    );
  });

  it("re-announces when Reset demo is pressed repeatedly", () => {
    render(<OnboardingWizard />);
    const status = screen.getByRole("status");
    const reset = screen.getByRole("button", { name: "Reset demo" });
    expect(status.textContent).toBe("");

    fireEvent.click(reset);
    const first = status.textContent;
    fireEvent.click(reset);
    const second = status.textContent;
    fireEvent.click(reset);
    const third = status.textContent;

    expect([first, second, third].map(visible)).toEqual([RESET_ANNOUNCEMENT, RESET_ANNOUNCEMENT, RESET_ANNOUNCEMENT]);
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
  });

  it("does not move focus on mount or on Reset", () => {
    render(<OnboardingWizard />);
    const heading = screen.getByRole("heading", { name: "Welcome to the intranet" });
    expect(document.activeElement).not.toBe(heading);
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(document.activeElement).not.toBe(heading);
  });

  it("exposes progress as a progressbar", () => {
    render(<OnboardingWizard />);
    const bar = screen.getByRole("progressbar", { name: "Onboarding progress" });
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
    expect(bar.getAttribute("aria-valuemax")).toBe("5");
    expect(bar.getAttribute("aria-valuetext")).toBe("Step 1 of 5");
  });
});
