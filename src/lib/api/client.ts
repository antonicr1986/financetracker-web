import type { TransactionDto } from "@/lib/types";
import { mockTransactions } from "@/lib/mock";

/**
 * Base URL of the FinanceTracker API.
 *
 * When it is not set, the app falls back to sample data. That is what keeps
 * the deployed demo working before the backend exists: set the variable in
 * Vercel and the same build starts talking to the real API, with no code
 * change.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const isUsingMockData = !BASE_URL;

// Nombre de la clave en localStorage, no una credencial.
const TOKEN_KEY = "financetracker.token"; // gitleaks:allow

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private mode: the session lasts as long as the tab.
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      response.status === 401
        ? "Tu sesion ha caducado."
        : "No se ha podido contactar con el servidor.",
      response.status,
    );
  }

  return (await response.json()) as T;
}

/** Simulates network latency so loading states are visible while mocking. */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getTransactions(): Promise<TransactionDto[]> {
  if (isUsingMockData) {
    await delay(400);
    return mockTransactions;
  }

  // TODO: the real endpoint is paginated and returns { items, totalCount, ... }.
  // Unwrap it here so the components keep receiving a plain list.
  return request<TransactionDto[]>("/api/Transactions");
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string }> {
  if (isUsingMockData) {
    await delay(500);
    return { token: "mock-token" };
  }

  return request<{ token: string }>("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
