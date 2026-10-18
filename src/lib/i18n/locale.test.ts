import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOCALE, getLocale, setLocale, subscribeToLocale } from "./locale";

afterEach(() => {
  vi.restoreAllMocks();
});

function browserLanguage(language: string) {
  vi.spyOn(navigator, "language", "get").mockReturnValue(language);
}

describe("getLocale", () => {
  it("uses the language saved by the user", () => {
    browserLanguage("es-ES");
    setLocale("en");

    expect(getLocale()).toBe("en");
  });

  it("falls back to Spanish for a Spanish browser", () => {
    browserLanguage("es-MX");

    expect(getLocale()).toBe("es");
  });

  it("falls back to English for any other browser language", () => {
    browserLanguage("fr-FR");

    expect(getLocale()).toBe("en");
  });

  it("ignores a stored value that is not a supported language", () => {
    browserLanguage("es-ES");
    localStorage.setItem("financetracker.locale", "de");

    expect(getLocale()).toBe("es");
  });

  it("renders in Spanish on the server and on the first client pass", () => {
    expect(DEFAULT_LOCALE).toBe("es");
  });
});

describe("subscribeToLocale", () => {
  it("notifies a change of language until unsubscribed", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToLocale(onChange);

    setLocale("en");
    expect(onChange).toHaveBeenCalledTimes(1);

    unsubscribe();
    setLocale("es");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
