import type { TransactionDto } from "@/lib/types";
import { mockTransactions } from "@/lib/mock";

const API_URL_STORAGE_KEY = "financetracker.api.url";
const TOKEN_KEY = "financetracker.token"; // gitleaks:allow

/**
 * Get the configured API URL from localStorage.
 * If not configured, returns null and the app uses mock data.
 */
function getApiUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(API_URL_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

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

export const isUsingMockData = !getApiUrl();

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
  const baseUrl = getApiUrl();

  if (!baseUrl) {
    throw new Error("API no configurada. Ve a Configuración para establecer la URL.");
  }

  const token = getToken();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message =
      response.status === 401
        ? "Tu sesión ha caducado. Por favor, inicia sesión de nuevo."
        : response.status === 400
          ? "Datos inválidos."
          : response.status === 500
            ? "Error del servidor. Intenta más tarde."
            : "No se ha podido contactar con el servidor.";
    throw new ApiError(message, response.status);
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

  // The real endpoint returns a list of transactions
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

  // Real endpoint: POST /api/Users/login
  const response = await request<{ token: string }>("/api/Users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return response;
}
