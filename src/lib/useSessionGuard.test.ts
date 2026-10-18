import { describe, expect, it } from "vitest";
import { getAndClearReturnUrl } from "./useSessionGuard";

describe("getAndClearReturnUrl", () => {
  it("returns where the user was and forgets it, so it is used only once", () => {
    localStorage.setItem("financetracker.return-url", "/settings");

    expect(getAndClearReturnUrl()).toBe("/settings");
    expect(getAndClearReturnUrl()).toBeNull();
  });

  it("returns null when there is nowhere to go back to", () => {
    expect(getAndClearReturnUrl()).toBeNull();
  });
});
