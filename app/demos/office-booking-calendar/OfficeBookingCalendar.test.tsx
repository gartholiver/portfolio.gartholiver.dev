// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RESET_ANNOUNCEMENT } from "./booking";
import { OfficeBookingCalendar } from "./OfficeBookingCalendar";
import { bookingStore } from "./store";

afterEach(() => {
  cleanup();
  bookingStore.reset();
});

const visible = (text: string | null) => (text ?? "").replace(/​/g, "");

describe("OfficeBookingCalendar announcements", () => {
  it("re-announces when Reset demo is pressed repeatedly (the live-region text must change)", () => {
    render(<OfficeBookingCalendar />);
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

  it("announces reservations and cancellations in the same live region", () => {
    render(<OfficeBookingCalendar />);
    const status = screen.getByRole("status");
    fireEvent.click(screen.getByRole("button", { name: "Reserve Desk B1 on Tuesday 3 November" }));
    expect(visible(status.textContent)).toBe("Desk B1 reserved for Tuesday.");
    fireEvent.click(screen.getByRole("button", { name: "Cancel your reservation of Desk B1 on Tuesday 3 November" }));
    expect(visible(status.textContent)).toBe("Your Desk B1 reservation for Tuesday was cancelled.");
  });
});
