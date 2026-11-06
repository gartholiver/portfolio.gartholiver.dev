// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RESET_ANNOUNCEMENT } from "./employee-map";
import { InteractiveRemoteEmployeeMap } from "./InteractiveRemoteEmployeeMap";
import { employeeMapStore } from "./store";

afterEach(() => {
  cleanup();
  employeeMapStore.reset();
});

const visible = (text: string | null) => (text ?? "").replace(/​/g, "");
const AVERY = "Avery Lin, Product Design, near Harbor City";
const marker = (name: string) => screen.getByRole("button", { name });
const view = (name: string) => screen.getByRole("button", { name: `View profile: ${name}` });

describe("InteractiveRemoteEmployeeMap", () => {
  it("renders 12 markers and 12 table rows", () => {
    render(<InteractiveRemoteEmployeeMap />);
    expect(within(screen.getByTestId("map-markers")).getAllByRole("button")).toHaveLength(12);
    expect(screen.getAllByRole("rowheader")).toHaveLength(12);
  });

  it("opens a profile from a marker and moves focus to the heading", () => {
    render(<InteractiveRemoteEmployeeMap />);
    fireEvent.click(marker(AVERY));
    const heading = screen.getByRole("heading", { name: "Avery Lin" });
    expect(document.activeElement).toBe(heading);
    const card = screen.getByTestId("profile-card");
    expect(within(card).getByText("Head of Product Design")).toBeTruthy();
    expect(within(card).getByText("near Harbor City, Coastal Region (approximate)")).toBeTruthy();
    expect(within(card).getByText("No manager listed")).toBeTruthy();
    expect(within(card).getByRole("button", { name: "View profile: Sam Okafor" })).toBeTruthy();
  });

  it("navigates through the card and returns focus to the marker on close", () => {
    render(<InteractiveRemoteEmployeeMap />);
    fireEvent.click(marker(AVERY));
    fireEvent.click(within(screen.getByTestId("profile-card")).getByRole("button", { name: "View profile: Sam Okafor" }));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Sam Okafor" }));
    fireEvent.click(screen.getByRole("button", { name: "Close profile" }));
    expect(document.activeElement).toBe(marker("Sam Okafor, Product Design, near Westmoor"));
  });

  it("returns focus to the table row when the profile was opened from the list", () => {
    render(<InteractiveRemoteEmployeeMap />);
    fireEvent.click(view("Lena Kowalski"));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Lena Kowalski" }));
    fireEvent.click(screen.getByRole("button", { name: "Close profile" }));
    expect(document.activeElement).toBe(document.getElementById("map-row-p-lena"));
  });

  it("focuses the department select when the closed person is filtered out", () => {
    render(<InteractiveRemoteEmployeeMap />);
    fireEvent.click(marker(AVERY));
    fireEvent.change(screen.getByLabelText("Department"), { target: { value: "engineering" } });
    fireEvent.click(screen.getByRole("button", { name: "Close profile" }));
    expect(document.activeElement).toBe(document.getElementById("map-department"));
  });

  it("filters markers, rows, summary and status", () => {
    render(<InteractiveRemoteEmployeeMap />);
    fireEvent.change(screen.getByLabelText("Department"), { target: { value: "engineering" } });
    expect(visible(screen.getByTestId("map-status").textContent)).toBe("Showing 4 people in Engineering.");
    expect(within(screen.getByTestId("map-markers")).getAllByRole("button")).toHaveLength(4);
    expect(screen.getAllByRole("rowheader")).toHaveLength(4);
    expect(screen.getByTestId("map-summary").textContent).toBe("Showing 4 of 12 people");
  });

  it("labels the current user", () => {
    render(<InteractiveRemoteEmployeeMap />);
    const you = marker("You: Jordan Reyes, Customer Support, near Maple Grove");
    expect(you.textContent).toBe("You");
    const row = view("Jordan Reyes (you)");
    expect(row.textContent).toContain("You");
    fireEvent.click(row);
    expect(screen.getByRole("heading", { name: "Jordan Reyes (you)" })).toBeTruthy();
  });

  it("re-announces when Reset demo is pressed repeatedly", () => {
    render(<InteractiveRemoteEmployeeMap />);
    const status = screen.getByTestId("map-status");
    const reset = screen.getByRole("button", { name: "Reset demo" });
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
});
