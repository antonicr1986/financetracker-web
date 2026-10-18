import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  clearSessionExpired,
  createTransaction,
  deleteTransaction,
  getApiUrl,
  getCategories,
  getToken,
  getTransactions,
  getUser,
  isUsingMockData,
  login,
  register,
  setToken,
  setUser,
  subscribeToSession,
  warmUpApi,
  wasSessionExpired,
} from "./client";
import { mockTransactions } from "@/lib/mock";
import type { TransactionDto } from "@/lib/types";

const API = "https://api.example.test";

/** Las mismas claves que usa el cliente en localStorage. */
const API_URL_KEY = "financetracker.api.url";
const USER_KEY = "financetracker.user";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, { status });
}

/** Opciones con las que se llamo a fetch, ya tipadas. */
function lastCall(): { url: string; init: RequestInit & { headers: Record<string, string> } } {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url, init };
}

async function errorOf(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("Se esperaba un ApiError y la llamada fue bien");
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API URL", () => {
  it("uses mock data when no API is configured", () => {
    expect(getApiUrl()).toBeNull();
    expect(isUsingMockData()).toBe(true);
  });

  it("uses the URL saved in Settings", () => {
    localStorage.setItem(API_URL_KEY, API);

    expect(getApiUrl()).toBe(API);
    expect(isUsingMockData()).toBe(false);
  });

  it("trims spaces and trailing slashes so paths never get a double slash", () => {
    localStorage.setItem(API_URL_KEY, `  ${API}///  `);

    expect(getApiUrl()).toBe(API);
  });

  it("treats a blank saved URL as not configured", () => {
    localStorage.setItem(API_URL_KEY, "   ");

    expect(getApiUrl()).toBeNull();
  });
});

describe("session storage", () => {
  it("stores and clears the token", () => {
    setToken("abc");
    expect(getToken()).toBe("abc");

    setToken(null);
    expect(getToken()).toBeNull();
  });

  it("stores and clears the user", () => {
    setUser({ id: 7, name: "Ana", email: "ana@example.test" });
    expect(getUser()).toEqual({ id: 7, name: "Ana", email: "ana@example.test" });

    setUser(null);
    expect(getUser()).toBeNull();
  });

  it("returns no user when the stored value is not valid JSON", () => {
    localStorage.setItem(USER_KEY, "{not json");

    expect(getUser()).toBeNull();
  });

  it("notifies subscribers when the session changes, until they unsubscribe", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToSession(onChange);

    setToken("abc");
    setUser(null);
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    setToken(null);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe("requests", () => {
  beforeEach(() => {
    localStorage.setItem(API_URL_KEY, API);
  });

  it("sends JSON and the bearer token when there is a session", async () => {
    setToken("my-token");
    fetchMock.mockResolvedValue(jsonResponse([]));

    await getCategories();

    const { url, init } = lastCall();
    expect(url).toBe(`${API}/api/Categories`);
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBe("Bearer my-token");
  });

  it("sends no Authorization header without a session", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await getCategories();

    expect(lastCall().init.headers).not.toHaveProperty("Authorization");
  });

  it("returns the parsed JSON body", async () => {
    const categories = [{ id: 1, name: "Ocio", type: "Expense" }];
    fetchMock.mockResolvedValue(jsonResponse(categories));

    await expect(getCategories()).resolves.toEqual(categories);
  });

  it("treats a 204 as success instead of failing to parse an empty body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteTransaction(5)).resolves.toBeUndefined();

    const { url, init } = lastCall();
    expect(url).toBe(`${API}/api/Transactions/5`);
    expect(init.method).toBe("DELETE");
  });

  it("posts the transaction as the request body", async () => {
    const input = {
      description: "Cine",
      amount: 12.5,
      date: "2026-10-01",
      type: "Expense" as const,
      categoryId: 3,
    };
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, ...input }, 201));

    await createTransaction(input);

    const { url, init } = lastCall();
    expect(url).toBe(`${API}/api/Transactions`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(input);
  });

  it("sends the interface language when registering", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, name: "Ana", email: "ana@example.test" }, 201));

    await register("Ana", "ana@example.test", "secreto1", "en");

    const { url, init } = lastCall();
    expect(url).toBe(`${API}/api/Users/register`);
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Ana",
      email: "ana@example.test",
      password: "secreto1",
      language: "en",
    });
  });

  it("walks every page of transactions", async () => {
    const tx = (id: number) => ({ id }) as TransactionDto;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [tx(1), tx(2)], totalPages: 2 }))
      .mockResolvedValueOnce(jsonResponse({ items: [tx(3)], totalPages: 2 }));

    const all = await getTransactions();

    expect(all.map((t) => t.id)).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/api/Transactions?pageNumber=1&pageSize=100`);
    expect(fetchMock.mock.calls[1][0]).toBe(`${API}/api/Transactions?pageNumber=2&pageSize=100`);
  });

  it("stops after one page when the API reports no pages", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], totalPages: 0 }));

    await expect(getTransactions()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("errors", () => {
  beforeEach(() => {
    localStorage.setItem(API_URL_KEY, API);
  });

  it("closes the session and flags it as expired on a 401 with a token", async () => {
    setToken("old-token");
    setUser({ id: 1, name: "Ana", email: "ana@example.test" });
    fetchMock.mockResolvedValue(textResponse("", 401));

    const error = await errorOf(getCategories());

    expect(error.code).toBe("session_expired");
    expect(error.status).toBe(401);
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
    expect(wasSessionExpired()).toBe(true);
  });

  it("does not say the session expired when a sign-in fails with wrong credentials", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: "invalid_credentials" }, 401));

    const error = await errorOf(login("ana@example.test", "mal"));

    expect(error.serverCode).toBe("invalid_credentials");
    expect(error.message).toBe("invalid_credentials");
    expect(wasSessionExpired()).toBe(false);
  });

  it("clears the expired flag", async () => {
    setToken("old-token");
    fetchMock.mockResolvedValue(textResponse("", 401));
    await errorOf(getCategories());

    clearSessionExpired();

    expect(wasSessionExpired()).toBe(false);
  });

  it("maps a 400 to invalid_request and keeps the API code", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: "email_already_exists", title: "Conflict" }, 400));

    const error = await errorOf(register("Ana", "ana@example.test", "secreto1", "es"));

    expect(error.code).toBe("invalid_request");
    expect(error.serverCode).toBe("email_already_exists");
  });

  it("reads the first message of a validation error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ title: "One or more validation errors occurred.", errors: { Amount: ["Amount must be positive"] } }, 400),
    );

    const error = await errorOf(getCategories());

    expect(error.serverCode).toBe("Amount must be positive");
  });

  it("reads a plain JSON string body", async () => {
    fetchMock.mockResolvedValue(jsonResponse("Something specific went wrong", 400));

    const error = await errorOf(getCategories());

    expect(error.serverCode).toBe("Something specific went wrong");
  });

  it("falls back to detail, then title, of a ProblemDetails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: "Bad Request", detail: "Detailed reason" }, 400));
    expect((await errorOf(getCategories())).serverCode).toBe("Detailed reason");

    fetchMock.mockResolvedValueOnce(jsonResponse({ title: "Bad Request" }, 400));
    expect((await errorOf(getCategories())).serverCode).toBe("Bad Request");
  });

  it("keeps short plain-text bodies and ignores long ones such as HTML pages", async () => {
    fetchMock.mockResolvedValueOnce(textResponse("Not allowed", 400));
    expect((await errorOf(getCategories())).serverCode).toBe("Not allowed");

    fetchMock.mockResolvedValueOnce(textResponse(`<html>${"x".repeat(300)}</html>`, 400));
    expect((await errorOf(getCategories())).serverCode).toBeUndefined();
  });

  it("maps 5xx responses to server_error", async () => {
    fetchMock.mockResolvedValue(textResponse("", 503));

    const error = await errorOf(getCategories());

    expect(error.code).toBe("server_error");
    expect(error.status).toBe(503);
    expect(error.serverCode).toBeUndefined();
  });

  it("maps other failures, such as a 404, to network_error", async () => {
    fetchMock.mockResolvedValue(textResponse("", 404));

    expect((await errorOf(deleteTransaction(99))).code).toBe("network_error");
  });

  it("does not touch the session on errors other than 401", async () => {
    setToken("valid-token");
    fetchMock.mockResolvedValue(textResponse("", 500));

    await errorOf(getCategories());

    expect(getToken()).toBe("valid-token");
    expect(wasSessionExpired()).toBe(false);
  });
});

describe("mock mode (no API configured)", () => {
  it("returns the sample transactions without calling the network", async () => {
    await expect(getTransactions()).resolves.toBe(mockTransactions);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs in with a demo token", async () => {
    const response = await login("demo@example.test", "x");

    expect(response.token).toBe("mock-token");
    expect(response.user.email).toBe("demo@example.test");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses to write data", async () => {
    const error = await errorOf(
      createTransaction({ description: "x", amount: 1, date: "2026-10-01", type: "Expense", categoryId: 1 }),
    );

    expect(error.code).toBe("api_not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("warmUpApi", () => {
  it("pings the readiness endpoint without waiting for CORS", () => {
    localStorage.setItem(API_URL_KEY, API);
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    warmUpApi();

    const { url, init } = lastCall();
    expect(url).toBe(`${API}/health/ready`);
    expect(init.mode).toBe("no-cors");
  });

  it("does nothing without an API", () => {
    warmUpApi();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("swallows network failures", async () => {
    localStorage.setItem(API_URL_KEY, API);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(() => warmUpApi()).not.toThrow();
    await Promise.resolve();
  });
});
