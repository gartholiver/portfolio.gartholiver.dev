import { describe, expect, it } from "vitest";
import { getInternalNavigation, type LinkClick } from "./internal-links";
import { getEntryByPathname } from "~/content/registry";

const CURRENT = "http://localhost:4173/portfolio/hybrid-wp-react-intranet";
const isAppPath = (p: string) => !!getEntryByPathname(p);
const click = (href: string | null, extra: Partial<LinkClick> = {}) =>
  getInternalNavigation({ href, button: 0, ...extra }, CURRENT, isAppPath);

describe("getInternalNavigation", () => {
  it("intercepts internal absolute-path links to app routes", () => {
    expect(click("/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar")).toBe(
      "/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar",
    );
    expect(click("/portfolio/hybrid-wp-react-intranet/technical-requirements#architecture")).toBe(
      "/portfolio/hybrid-wp-react-intranet/technical-requirements#architecture",
    );
  });

  it("intercepts same-origin absolute URLs", () => {
    expect(click("http://localhost:4173/stack")).toBe("/stack");
  });

  it("leaves #hash links to the browser", () => {
    expect(click("#overview")).toBeNull();
    expect(click("/portfolio/hybrid-wp-react-intranet#overview")).toBeNull();
  });

  it("navigates to a hash on a different page", () => {
    expect(click("/stack#tools")).toBe("/stack#tools");
  });

  it("leaves external, mailto and protocol-relative links alone", () => {
    expect(click("https://example.com/portfolio")).toBeNull();
    expect(click("//example.com/stack")).toBeNull();
    expect(click("mailto:someone@example.com")).toBeNull();
    expect(click("tel:+10000000")).toBeNull();
  });

  it("leaves unknown same-origin paths (static files) to the browser", () => {
    expect(click("/robots.txt")).toBeNull();
    expect(click("/does-not-exist")).toBeNull();
  });

  it("respects modified clicks, non-primary buttons, targets, downloads and prevented events", () => {
    expect(click("/stack", { button: 1 })).toBeNull();
    expect(click("/stack", { metaKey: true })).toBeNull();
    expect(click("/stack", { ctrlKey: true })).toBeNull();
    expect(click("/stack", { shiftKey: true })).toBeNull();
    expect(click("/stack", { altKey: true })).toBeNull();
    expect(click("/stack", { target: "_blank" })).toBeNull();
    expect(click("/stack", { target: "_self" })).toBe("/stack");
    expect(click("/stack", { download: true })).toBeNull();
    expect(click("/stack", { defaultPrevented: true })).toBeNull();
  });

  it("ignores empty or malformed hrefs", () => {
    expect(click(null)).toBeNull();
    expect(click("")).toBeNull();
    expect(click("http://")).toBeNull();
  });
});
