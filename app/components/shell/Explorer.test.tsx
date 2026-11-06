// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { getEntryByPathname } from "~/content/registry";
import { Explorer } from "./Explorer";
import { ShellProvider, useShell } from "./ShellContext";

function setup(path: string) {
  function Probe() {
    const { contactFocusRequest, terminalOpen } = useShell();
    return <output data-testid="probe">{`${contactFocusRequest}:${terminalOpen}`}</output>;
  }
  const Stub = createRoutesStub([
    {
      path: "*",
      Component: () => (
        <ShellProvider>
          <Explorer activeEntry={getEntryByPathname(new URL(path, "http://x").pathname)} />
          <Probe />
        </ShellProvider>
      ),
    },
  ]);
  return render(<Stub initialEntries={[path]} />);
}

afterEach(cleanup);

const explorer = () => screen.getByRole("navigation", { name: "Explorer" });

describe("Explorer", () => {
  it("marks the active file with aria-current=page and reveals its ancestors on a deep link", async () => {
    setup("/portfolio/legal-doc-wp-ordering-system/views/custom-woo-extension-plugin");
    const current = await within(explorer()).findByRole("link", { current: "page" });
    expect(current).toHaveAccessibleName(/^custom-woo-extension-plugin\.html in portfolio \/ legal-doc/);
    expect(current).toHaveAttribute("href", "/portfolio/legal-doc-wp-ordering-system/views/custom-woo-extension-plugin");
    expect(current).toBeVisible();
    // only one active link even though another project has a file with the same name
    expect(within(explorer()).getAllByRole("link", { current: "page" })).toHaveLength(1);
    const folder = within(explorer()).getByRole("button", { name: "legal-doc-wp-ordering-system" });
    expect(folder).toHaveAttribute("aria-expanded", "true");
    expect(within(explorer()).getByRole("button", { name: "headless-wp-educational-app" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("keeps non-ancestor folders collapsed and their links out of the accessibility tree", () => {
    setup("/stack");
    expect(within(explorer()).getByRole("button", { name: "docs" })).toHaveAttribute("aria-expanded", "false");
    expect(within(explorer()).queryByRole("link", { name: /about\.html/ })).toBeNull();
    expect(within(explorer()).getByRole("link", { name: "package.json" })).toHaveAttribute("aria-current", "page");
  });

  it("expands and collapses folders with the disclosure buttons", () => {
    setup("/stack");
    const docs = within(explorer()).getByRole("button", { name: "docs" });
    fireEvent.click(docs);
    expect(docs).toHaveAttribute("aria-expanded", "true");
    expect(within(explorer()).getByRole("link", { name: /^about\.html/ })).toHaveAttribute("href", "/docs/about");
    fireEvent.click(docs);
    expect(docs).toHaveAttribute("aria-expanded", "false");
    expect(within(explorer()).queryByRole("link", { name: /^about\.html/ })).toBeNull();
  });

  it("shows a decorative file-type icon per row and swaps folder icons when expanded", () => {
    setup("/stack");
    const icon = (el: HTMLElement) => el.querySelector("svg[data-icon]");
    const docs = within(explorer()).getByRole("button", { name: "docs" });
    expect(icon(docs)).toHaveAttribute("data-icon", "folder-docs");
    expect(icon(docs)).toHaveAttribute("data-open", "false");
    expect(icon(docs)).toHaveAttribute("aria-hidden", "true");
    const closedMarkup = icon(docs)!.innerHTML;
    fireEvent.click(docs);
    expect(icon(docs)).toHaveAttribute("data-open", "true");
    expect(icon(docs)!.innerHTML).not.toBe(closedMarkup);
    expect(icon(within(explorer()).getByRole("button", { name: "portfolio" }))).toHaveAttribute("data-icon", "folder");
    expect(icon(within(explorer()).getByRole("link", { name: "package.json" }))).toHaveAttribute("data-icon", "npm");
    expect(icon(within(explorer()).getByRole("button", { name: /contact\.me/ }))).toHaveAttribute("data-icon", "terminal");
  });

  it("uses the project icon for case-study folders directly under portfolio, open vs closed", () => {
    setup("/portfolio/hybrid-wp-react-intranet");
    const icon = (el: HTMLElement) => el.querySelector("svg[data-icon]");
    const project = within(explorer()).getByRole("button", { name: "hybrid-wp-react-intranet" });
    expect(project).toHaveAttribute("aria-expanded", "true");
    expect(icon(project)).toHaveAttribute("data-icon", "folder-project");
    expect(icon(project)).toHaveAttribute("data-open", "true");
    const openMarkup = icon(project)!.innerHTML;
    fireEvent.click(project);
    expect(icon(project)).toHaveAttribute("data-open", "false");
    expect(icon(project)!.innerHTML).not.toBe(openMarkup);
    expect(icon(within(explorer()).getByRole("button", { name: "portfolio" }))).toHaveAttribute("data-icon", "folder");
  });

  it("has no active file on the 404 page", () => {
    setup("/nope");
    expect(within(explorer()).queryByRole("link", { current: "page" })).toBeNull();
  });

  it("contact.me is a button that opens the terminal without navigating", () => {
    setup("/stack");
    fireEvent.click(within(explorer()).getByRole("button", { name: "docs" }));
    const contact = within(explorer()).getByRole("button", { name: /^contact\.me/ });
    expect(contact.tagName).toBe("BUTTON");
    expect(screen.getByTestId("probe")).toHaveTextContent("0:false");
    fireEvent.click(contact);
    expect(screen.getByTestId("probe")).toHaveTextContent("1:true");
    // still on the same page
    expect(within(explorer()).getByRole("link", { current: "page" })).toHaveAttribute("href", "/stack");
  });
});
