import { afterEach, describe, expect, it, vi } from "vitest";
import { contactStore } from "./contact-store";

afterEach(() => contactStore.reset());

describe("contactStore", () => {
  it("keeps the draft in memory between reads and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = contactStore.subscribe(listener);
    contactStore.dispatch({ type: "input", value: "Ada" });
    contactStore.dispatch({ type: "submit" });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(contactStore.getState().step).toBe("email");
    expect(contactStore.getState().values.name).toBe("Ada");

    unsubscribe();
    contactStore.dispatch({ type: "restart" });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(contactStore.getState().step).toBe("name");
  });

  it("does not notify when an action changes nothing", () => {
    const listener = vi.fn();
    contactStore.subscribe(listener);
    contactStore.dispatch({ type: "back" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("serves a fresh draft for server rendering", () => {
    contactStore.dispatch({ type: "input", value: "Ada" });
    expect(contactStore.getServerState().draft).toBe("");
  });
});
