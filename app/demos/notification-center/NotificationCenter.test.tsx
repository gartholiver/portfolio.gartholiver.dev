// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RESET_ANNOUNCEMENT } from "./notifications";
import { NotificationCenter } from "./NotificationCenter";
import { notificationStore } from "./store";

afterEach(() => {
  cleanup();
  notificationStore.reset();
});

const visible = (text: string | null) => (text ?? "").replace(/​/g, "");
const status = () => screen.getByRole("status");
const markButton = (title: string) => screen.getByRole("button", { name: `Mark as read: ${title}` });
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Send kudos" }));
const selectValue = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("NotificationCenter", () => {
  it("marks one notification as read and moves focus to the next item", () => {
    render(<NotificationCenter />);
    fireEvent.click(markButton("New weekend rota for the Support Desk"));
    expect(visible(status().textContent)).toBe(
      "Marked as read: New weekend rota for the Support Desk. 3 unread notifications left.",
    );
    expect(document.activeElement).toBe(markButton("Complete the security refresher"));
    expect(screen.getByTestId("unread-count").textContent).toBe("3 unread");
  });

  it("focuses the Unseen heading when the last remaining item is marked", () => {
    render(<NotificationCenter />);
    fireEvent.click(markButton("All-hands call moved to Thursday"));
    fireEvent.click(markButton("New weekend rota for the Support Desk"));
    fireEvent.click(markButton("Complete the security refresher"));
    fireEvent.click(markButton("Welcome to the team, Jordan"));
    expect(document.activeElement).toBe(document.getElementById("nc-unseen-heading"));
    expect(screen.getByText("You're all caught up.")).toBeTruthy();
  });

  it("marks all as read, then reports nothing unread", () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(visible(status().textContent)).toBe("Marked 4 notifications as read. No unread notifications left.");
    expect(document.activeElement).toBe(document.getElementById("nc-unseen-heading"));
    expect(screen.getByTestId("unread-count").textContent).toBe("0 unread");
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(visible(status().textContent)).toBe("There are no unread notifications for Jordan Reyes.");
  });

  it("changes targeting when the viewer changes", () => {
    render(<NotificationCenter />);
    selectValue("Viewing as", "p-lena");
    expect(screen.getByRole("heading", { name: "Notifications for Lena Kowalski" })).toBeTruthy();
    expect(screen.getByTestId("unread-count").textContent).toBe("3 unread");
    expect(screen.getByText("Your equipment request was approved")).toBeTruthy();
    expect(screen.queryByText("Welcome to the team, Jordan")).toBeNull();
    expect(visible(status().textContent)).toBe("Now viewing as Lena Kowalski (Web team). 3 unread notifications.");
  });

  it("requires a recipient for kudos", () => {
    render(<NotificationCenter />);
    submit();
    expect(visible(status().textContent)).toBe("Choose a colleague to send kudos to.");
    const error = document.getElementById("nc-kudos-error")!;
    expect(error.textContent).toBe("Choose a colleague to send kudos to.");
    const recipient = document.getElementById("nc-kudos-recipient")!;
    expect(document.activeElement).toBe(recipient);
    expect(recipient.getAttribute("aria-invalid")).toBe("true");
  });

  it("requires a message for kudos", () => {
    render(<NotificationCenter />);
    selectValue("Colleague", "p-lena");
    submit();
    expect(visible(status().textContent)).toBe("Choose a kudos message.");
    expect(document.activeElement).toBe(document.getElementById("nc-kudos-preset-high-five"));
  });

  it("adds sent kudos to the feed and clears the form", () => {
    render(<NotificationCenter />);
    selectValue("Colleague", "p-lena");
    fireEvent.click(screen.getByLabelText("High Five"));
    submit();
    expect(visible(status().textContent)).toBe("Kudos sent: Jordan Reyes gave Lena Kowalski a High Five.");
    const first = screen.getByTestId("activity-feed").querySelector("li")!;
    expect(first.textContent).toContain("Jordan Reyes gave Lena Kowalski kudos: High Five");
    expect(first.textContent).toContain("Just now");
    expect((screen.getByLabelText("Colleague") as HTMLSelectElement).value).toBe("");
    expect(document.getElementById("nc-kudos-error")).toBeNull();
  });

  it("clears the recipient when the viewer changes to the chosen recipient", () => {
    render(<NotificationCenter />);
    selectValue("Colleague", "p-lena");
    selectValue("Viewing as", "p-lena");
    const select = screen.getByLabelText("Colleague") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect([...select.options].map((o) => o.value)).not.toContain("p-lena");
  });

  it("re-announces when Reset demo is pressed repeatedly", () => {
    render(<NotificationCenter />);
    const reset = screen.getByRole("button", { name: "Reset demo" });
    fireEvent.click(reset);
    const first = status().textContent;
    fireEvent.click(reset);
    const second = status().textContent;
    fireEvent.click(reset);
    const third = status().textContent;
    expect([first, second, third].map(visible)).toEqual([RESET_ANNOUNCEMENT, RESET_ANNOUNCEMENT, RESET_ANNOUNCEMENT]);
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
  });
});
