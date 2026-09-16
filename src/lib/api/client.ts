import type {
  LoginResponseDto,
  PagedResult,
  TransactionDto,
  UserDto,
} from "@/lib/types";
import { mockTransactions } from "@/lib/mock";

const API_URL_STORAGE_KEY = "financetracker.api.url";
const TOKEN_KEY = "financetracker.token"; // gitleaks:allow
const USER_KEY = "financetracker.user";

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

/**
 * Devuelve el usuario guardado tal cual esta en localStorage, sin parsear.
 * Se expone la cadena cruda porque useSyncExternalStore necesita una
 * instantanea estable: parsear aqui devolveria un objeto nuevo en cada lectura
 * y React entraria en bucle.
 */
export function getStoredUserRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function getUser(): UserDto | null {
  const raw = getStoredUserRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}

export function setUser(user: UserDto | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // Modo privado: la sesion dura lo que dure la pestana.
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

/**
 * Hay API configurada o seguimos con datos de ejemplo. Es una funcion y no una
 * constante a proposito: como constante se evaluaba una sola vez al cargar el
 * modulo, daba true en el servidor (no hay localStorage) y false en el cliente,
 * y esa divergencia rompia la hidratacion.
 */
export function isUsingMockData(): boolean {
  return !getApiUrl();
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
  if (isUsingMockData()) {
    await delay(400);
    return mockTransactions;
  }

  // El endpoint devuelve un PagedResult y limita pageSize a 100, pero el panel
  // necesita el historico completo para la evolucion mensual: recorremos las
  // paginas hasta agotarlas.
  const pageSize = 100;
  const all: TransactionDto[] = [];
  let pageNumber = 1;
  let totalPages = 1;

  do {
    const page = await request<PagedResult<TransactionDto>>(
      `/api/Transactions?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    );

    all.push(...(page.items ?? []));
    totalPages = page.totalPages || 1;
    pageNumber += 1;
  } while (pageNumber <= totalPages);

  return all;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponseDto> {
  if (isUsingMockData()) {
    await delay(500);
    return {
      token: "mock-token",
      expiration: new Date(Date.now() + 3600_000).toISOString(),
      user: { id: 0, name: "Usuario demo", email },
    };
  }

  // Real endpoint: POST /api/Users/login -> { token, expiration, user }
  return request<LoginResponseDto>("/api/Users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
