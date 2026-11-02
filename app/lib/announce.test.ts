// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRepeatableAnnouncement, withRepeatMarker } from "./announce";

describe("withRepeatMarker", () => {
  it("leaves the first state bare and alternates an invisible marker afterwards", () => {
    expect(withRepeatMarker("Hi", 0)).toBe("Hi");
    expect(withRepeatMarker("Hi", 1)).toBe("Hi​");
    expect(withRepeatMarker("Hi", 2)).toBe("Hi");
    expect(withRepeatMarker("", 0)).toBe("");
  });

  it("strips to the same visible text either way", () => {
    expect(withRepeatMarker("Hi", 1).replace(/​/g, "")).toBe(withRepeatMarker("Hi", 2));
  });
});

describe("useRepeatableAnnouncement", () => {
  it("changes the rendered text when the same message is announced twice in a row", () => {
    const { result } = renderHook(() => useRepeatableAnnouncement());
    expect(result.current[0]).toBe("");

    act(() => result.current[1]("Demo reset."));
    const first = result.current[0];
    act(() => result.current[1]("Demo reset."));
    const second = result.current[0];
    act(() => result.current[1]("Demo reset."));
    const third = result.current[0];

    expect(first).not.toBe(second);
    expect(second).not.toBe(third);
    expect([first, second, third].map((t) => t.replace(/​/g, ""))).toEqual(["Demo reset.", "Demo reset.", "Demo reset."]);
  });

  it("keeps a stable announce function", () => {
    const { result } = renderHook(() => useRepeatableAnnouncement());
    const before = result.current[1];
    act(() => before("x"));
    expect(result.current[1]).toBe(before);
  });
});
