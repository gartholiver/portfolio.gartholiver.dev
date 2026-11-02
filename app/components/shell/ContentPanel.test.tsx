// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentPanel, isSearchOnlyReplace } from "./ContentPanel";
import { ShellProvider } from "./ShellContext";

const loc = (pathname: string, search = "", hash = "") => ({
  pathname,
  search,
  hash,
});

describe("isSearchOnlyReplace", () => {
  it("is true only for a REPLACE that changes just the query string", () => {
    expect(isSearchOnlyReplace(loc("/search", "?q=a"), loc("/search", "?q=ab"), "REPLACE")).toBe(true);
    expect(isSearchOnlyReplace(loc("/search"), loc("/search", "?q=a"), "REPLACE")).toBe(true);
  });

  it("is false for PUSH/POP, a different path, a hash change, or an identical URL", () => {
    expect(isSearchOnlyReplace(loc("/search", "?q=a"), loc("/search", "?q=ab"), "PUSH")).toBe(false);
    expect(isSearchOnlyReplace(loc("/search", "?q=a"), loc("/search", "?q=ab"), "POP")).toBe(false);
    expect(isSearchOnlyReplace(loc("/search", "?q=a"), loc("/other", "?q=ab"), "REPLACE")).toBe(false);
    expect(isSearchOnlyReplace(loc("/search", "?q=a"), loc("/search", "?q=ab", "#x"), "REPLACE")).toBe(false);
    expect(isSearchOnlyReplace(loc("/search", "?q=a"), loc("/search", "?q=a"), "REPLACE")).toBe(false);
  });
});

describe("ContentPanel scroll handling", () => {
  let navigate: NavigateFunction;

  function Grab() {
    const nav = useNavigate();
    useEffect(() => {
      navigate = nav;
    });
    return null;
  }

  function setup() {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    const view = render(
      <MemoryRouter initialEntries={["/search"]}>
        <ShellProvider>
          <Grab />
          <ContentPanel />
        </ShellProvider>
      </MemoryRouter>,
    );
    const main = view.container.querySelector("main") as HTMLElement;
    main.scrollTop = 120;
    return main;
  }

  beforeEach(() => {
    // @ts-expect-error cleanup of the stub
    delete window.matchMedia;
  });

  it("keeps the scroll position while only ?q= changes via REPLACE", () => {
    const main = setup();
    act(() => navigate("/search?q=a", { replace: true }));
    act(() => navigate("/search?q=ab", { replace: true }));
    expect(main.scrollTop).toBe(120);
  });

  it("still resets to the top on a normal (PUSH) navigation, even with a query change", () => {
    const main = setup();
    act(() => navigate("/search?q=a"));
    expect(main.scrollTop).toBe(0);
  });

  it("still resets to the top when a REPLACE changes the path", () => {
    const main = setup();
    act(() => navigate("/stack", { replace: true }));
    expect(main.scrollTop).toBe(0);
  });
});
