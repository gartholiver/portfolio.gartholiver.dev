// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShellProvider, useShell } from "./ShellContext";

/** Minimal matchMedia stub; `matches` toggles the "< 900px" drawer layout. */
function mockViewport(narrow: boolean) {
  const listeners = new Set<() => void>();
  let matches = narrow;
  window.matchMedia = vi.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  })) as unknown as typeof window.matchMedia;
  return {
    resize(next: boolean) {
      matches = next;
      listeners.forEach((l) => l());
    },
  };
}

const wrapper = ({ children }: { children: ReactNode }) => <ShellProvider>{children}</ShellProvider>;

afterEach(() => {
  // @ts-expect-error cleanup of the stub
  delete window.matchMedia;
});

describe("ShellProvider — terminal", () => {
  it("is collapsed by default on desktop and below 900px", () => {
    mockViewport(false);
    const desktop = renderHook(() => useShell(), { wrapper });
    expect(desktop.result.current.terminalOpen).toBe(false);
    expect(desktop.result.current.terminalIsDefault).toBe(true);
    expect(desktop.result.current.isDrawerLayout).toBe(false);

    mockViewport(true);
    const mobile = renderHook(() => useShell(), { wrapper });
    expect(mobile.result.current.terminalOpen).toBe(false);
    expect(mobile.result.current.isDrawerLayout).toBe(true);
  });

  it("an explicit choice overrides the viewport default, even across a resize", () => {
    const vp = mockViewport(false);
    const { result } = renderHook(() => useShell(), { wrapper });
    act(() => result.current.setTerminalOpen(false));
    expect(result.current.terminalOpen).toBe(false);
    expect(result.current.terminalIsDefault).toBe(false);
    act(() => vp.resize(true));
    expect(result.current.terminalOpen).toBe(false);
    act(() => result.current.toggleTerminal());
    expect(result.current.terminalOpen).toBe(true);
  });

  it("stays collapsed across resizes until the user chooses", () => {
    const vp = mockViewport(false);
    const { result } = renderHook(() => useShell(), { wrapper });
    act(() => vp.resize(true));
    expect(result.current.terminalOpen).toBe(false);
    act(() => vp.resize(false));
    expect(result.current.terminalOpen).toBe(false);
  });

  it("openContact opens the terminal, requests focus each time, and closes the drawer", () => {
    mockViewport(true);
    const { result } = renderHook(() => useShell(), { wrapper });
    act(() => result.current.openDrawer());
    expect(result.current.drawerOpen).toBe(true);
    const before = result.current.contactFocusRequest;
    act(() => result.current.openContact());
    expect(result.current.terminalOpen).toBe(true);
    expect(result.current.drawerOpen).toBe(false);
    expect(result.current.contactFocusRequest).toBe(before + 1);
    act(() => result.current.openContact());
    expect(result.current.terminalOpen).toBe(true);
    expect(result.current.contactFocusRequest).toBe(before + 2);
  });
});

describe("ShellProvider — drawer", () => {
  it("opens and closes on narrow screens", () => {
    mockViewport(true);
    const { result } = renderHook(() => useShell(), { wrapper });
    expect(result.current.drawerOpen).toBe(false);
    act(() => result.current.openDrawer());
    expect(result.current.drawerOpen).toBe(true);
    act(() => result.current.closeDrawer());
    expect(result.current.drawerOpen).toBe(false);
  });

  it("is never open on desktop, and resets when leaving the drawer layout", () => {
    const vp = mockViewport(true);
    const { result } = renderHook(() => useShell(), { wrapper });
    act(() => result.current.openDrawer());
    expect(result.current.drawerOpen).toBe(true);
    act(() => vp.resize(false));
    expect(result.current.drawerOpen).toBe(false);
    act(() => vp.resize(true));
    expect(result.current.drawerOpen).toBe(false);
  });

  it("returns focus to the menu button after closing", () => {
    mockViewport(true);
    const { result } = renderHook(() => useShell(), { wrapper });
    const button = document.createElement("button");
    document.body.append(button);
    (result.current.menuButtonRef as { current: HTMLButtonElement | null }).current = button;
    act(() => result.current.openDrawer());
    act(() => result.current.closeDrawer("trigger"));
    expect(document.activeElement).toBe(button);
    button.remove();
  });
});

describe("useShell", () => {
  it("throws outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useShell())).toThrow(/ShellProvider/);
    spy.mockRestore();
  });
});
