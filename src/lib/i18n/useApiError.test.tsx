import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { setLocale } from "./locale";
import { en, es } from "./messages";
import { useApiErrorMessage } from "./useApiError";

function messageFor(cause: unknown) {
  const { result } = renderHook(() => useApiErrorMessage());
  return result.current(cause, "errors.signInFailed");
}

describe("useApiErrorMessage", () => {
  it("prefers the specific code sent by the API", () => {
    setLocale("es");

    expect(messageFor(new ApiError("invalid_request", 400, "email_already_exists"))).toBe(
      es["apiError.email_already_exists"],
    );
  });

  it("uses the generic client code when the API code is unknown", () => {
    setLocale("es");

    expect(messageFor(new ApiError("invalid_request", 400, "Amount must be positive"))).toBe(
      es["apiError.invalid_request"],
    );
  });

  it("uses the generic client code when the API sent none", () => {
    setLocale("es");

    expect(messageFor(new ApiError("server_error", 500))).toBe(es["apiError.server_error"]);
  });

  it("uses the caller's fallback for errors that are not from the API", () => {
    setLocale("es");

    expect(messageFor(new TypeError("Failed to fetch"))).toBe(es["errors.signInFailed"]);
  });

  it("translates into the active language", () => {
    setLocale("en");

    expect(messageFor(new ApiError("session_expired", 401, "invalid_credentials"))).toBe(
      en["apiError.invalid_credentials"],
    );
  });
});
