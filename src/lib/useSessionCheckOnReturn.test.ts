import { describe, expect, it } from "vitest";
import { MIN_CHECK_INTERVAL_MS, shouldCheck } from "./useSessionCheckOnReturn";

describe("shouldCheck", () => {
  it("checks the first time and after the minimum interval", () => {
    expect(shouldCheck(0, 1_000_000)).toBe(true);
    expect(shouldCheck(1_000_000, 1_000_000 + MIN_CHECK_INTERVAL_MS)).toBe(true);
  });

  it("skips a second check that arrives right after the first", () => {
    expect(shouldCheck(1_000_000, 1_000_500)).toBe(false);
  });
});
