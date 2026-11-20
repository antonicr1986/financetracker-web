import { describe, expect, it } from "vitest";
import { accountHasPassword } from "./useSession";

describe("accountHasPassword", () => {
  it("is false only when the API says so", () => {
    expect(accountHasPassword(JSON.stringify({ id: 1, hasPassword: false }))).toBe(false);
    expect(accountHasPassword(JSON.stringify({ id: 1, hasPassword: true }))).toBe(true);
  });

  it("assumes a password when the data is missing or unreadable", () => {
    expect(accountHasPassword(JSON.stringify({ id: 1 }))).toBe(true);
    expect(accountHasPassword(null)).toBe(true);
    expect(accountHasPassword("no-es-json")).toBe(true);
  });
});
