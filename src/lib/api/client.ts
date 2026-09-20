import type {
  BudgetDto,
  BudgetInput,
  CategoryDto,
  TransactionInput,
  LoginResponseDto,
  PagedResult,
  TransactionDto,
  TransactionType,
  UserDto,
} from "@/lib/types";
import { mockTransactions } from "@/lib/mock";

const API_URL_STORAGE_KEY = "financetracker.api.url";
const TOKEN_KEY = "financetracker.token"; // gitleaks:allow
const USER_KEY = "financetracker.user";
const EXPIRED_KEY = "financetracker.session-expired";

/**
 * URL por defecto de la API, fijada en tiempo de compilacion con la variable
 * NEXT_PUBLIC_API_URL. Es lo que hace que el sitio desplegado funcione de
 * serie, sin que cada visitante tenga que escribir la URL en Configuracion.
 */
const DEFAULT_API_URL = normaliseApiUrl(process.env.NEXT_PUBLIC_API_URL);

/** Quita espacios y la barra final, que si no generaria rutas con doble barra. */
function normaliseApiUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : null;
}

/**
 * URL de la API en uso: manda lo que el usuario haya guardado en Configuracion
 * y, si no hay nada, la de por defecto. Si tampoco la hay, devuelve null y la
 * aplicacion tira de datos de ejemplo.
 */
export function getApiUrl(): string | null {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  try {
    return normaliseApiUrl(localStorage.getItem(API_URL_STORAGE_KEY)) ?? DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

/** La de por defecto, para poder mostrarla en Configuracion. */
export function getDefaultApiUrl(): string | null {
  return DEFAULT_API_URL;
}

/**
 * Evento propio que se emite al guardar o borrar la sesion. Sin el, quien lee
 * el token con useSyncExternalStore no se entera del cambio hasta el siguiente
 * repintado, y la cabecera se quedaba mostrando una sesion ya cerrada.
 */
const SESSION_EVENT = "financetracker:session";

function notifySessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Suscripcion para useSyncExternalStore. "storage" cubre las otras pestanas. */
export function subscribeToSession(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Marca que la sesion se ha invalidado desde el servidor (un 401 con token en
 * mano). Lo lee la pantalla de acceso para explicar por que esta ahi. Es un
 * indicador aparte del token justamente porque el token ya no existe cuando hay
 * que dar la explicacion.
 */
function markSessionExpired() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXPIRED_KEY, "1");
  } catch {
    // Modo privado: nos quedamos sin el aviso, no es grave.
  }
}

export function wasSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(EXPIRED_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearSessionExpired() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EXPIRED_KEY);
  } catch {
    // Nada que limpiar.
  }
  notifySessionChange();
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
    notifySessionChange();
  } catch {
    // Modo privado: la sesion dura lo que dure la pestana.
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    notifySessionChange();
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

/**
 * Identificador del problema, no su texto.
 *
 * El cliente no puede traducir: es un modulo normal, no un componente, asi que
 * no tiene acceso a los hooks. Antes fabricaba frases en espanol que se
 * colaban tal cual en la interfaz aunque estuviera en ingles. Ahora propaga un
 * codigo y es el componente —que si puede traducir— quien decide que se lee.
 *
 * `serverCode` llega de la API cuando esta identifica el caso concreto
 * (email_already_exists, category_type_mismatch...). Tiene prioridad sobre el
 * generico, porque dice mucho mas.
 */
export type ApiErrorCode =
  | "api_not_configured"
  | "session_expired"
  | "invalid_request"
  | "server_error"
  | "network_error";

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    readonly serverCode?: string,
  ) {
    super(serverCode ?? code);
    this.name = "ApiError";
  }
}

/**
 * Saca del cuerpo de la respuesta el motivo real del error.
 *
 * La API contesta de tres formas segun el caso: una cadena suelta
 * (`BadRequest("...")`), un ProblemDetails, o un ValidationProblemDetails con
 * los errores por campo. Antes se descartaba todo y se mostraba un texto
 * generico, asi que "ya existe un usuario con ese correo" llegaba al usuario
 * como "Datos invalidos".
 */
async function readServerMessage(response: Response): Promise<string | null> {
  let raw: string;
  try {
    raw = await response.text();
  } catch {
    return null;
  }

  if (!raw.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed === "string") return parsed;

    if (parsed && typeof parsed === "object") {
      const body = parsed as {
        code?: string;
        detail?: string;
        title?: string;
        errors?: Record<string, string[]>;
      };

      // "code" manda: es el identificador que la API emite a proposito para
      // que el cliente pueda traducirlo. Lo demas es texto en ingles, util
      // como respaldo pero no como mensaje final.
      if (body.code) return body.code;

      if (body.errors) {
        const first = Object.values(body.errors).flat().find(Boolean);
        if (first) return first;
      }

      return body.detail ?? body.title ?? null;
    }

    return null;
  } catch {
    // No era JSON: puede ser texto plano. Se descarta si parece una pagina.
    return raw.length <= 200 ? raw : null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiUrl();

  if (!baseUrl) {
    throw new ApiError("api_not_configured", 0);
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
    // Un 401 no es solo un mensaje: el token que llevabamos ya no vale, asi que
    // se cierra la sesion aqui mismo. El guard de (app) vera que no hay token y
    // llevara al acceso, donde el aviso si puede hacerse algo al respecto.
    if (response.status === 401) {
      if (getToken() !== null) markSessionExpired();
      setToken(null);
      setUser(null);
    }

    // El 401 tambien se lee: la API distingue "invalid_credentials" de una
    // sesion caducada, y sin esto el acceso mostraba "tu sesion ha caducado" a
    // quien simplemente se habia equivocado de contrasena.
    const serverCode = await readServerMessage(response);

    const code: ApiErrorCode =
      response.status === 401
        ? "session_expired"
        : response.status === 400
          ? "invalid_request"
          : response.status >= 500
            ? "server_error"
            : "network_error";

    throw new ApiError(code, response.status, serverCode ?? undefined);
  }

  // Los 204 no traen cuerpo: PUT y DELETE contestan asi cuando todo ha ido
  // bien. Pedirle JSON a una respuesta vacia lanza un error de sintaxis, es
  // decir, convertiria un exito en un fallo.
  if (response.status === 204) {
    return undefined as T;
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

export async function getCategories(): Promise<CategoryDto[]> {
  if (isUsingMockData()) {
    await delay(200);
    return [];
  }

  return request<CategoryDto[]>("/api/Categories");
}

/**
 * POST /api/Categories. El tipo no se pregunta: una categoria creada desde el
 * dialogo de un movimiento hereda el del movimiento, que es el unico con el que
 * la API la aceptaria despues.
 */
export async function createCategory(
  name: string,
  type: TransactionType,
): Promise<CategoryDto> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  return request<CategoryDto>("/api/Categories", {
    method: "POST",
    body: JSON.stringify({ name, type }),
  });
}

/** PUT /api/Categories/{id}. Contesta 204. */
export async function updateCategory(
  id: number,
  name: string,
  type: TransactionType,
): Promise<void> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  await request<void>(`/api/Categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, type }),
  });
}

/**
 * DELETE /api/Categories/{id}. Contesta 204, o 400 con el codigo
 * category_has_transactions si la categoria tiene movimientos: la API no deja
 * dejarlos huerfanos.
 */
export async function deleteCategory(id: number): Promise<void> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  await request<void>(`/api/Categories/${id}`, { method: "DELETE" });
}

export async function createTransaction(
  input: TransactionInput,
): Promise<TransactionDto> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  return request<TransactionDto>("/api/Transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** PUT /api/Transactions/{id}. Contesta 204, no devuelve el movimiento. */
export async function updateTransaction(
  id: number,
  input: TransactionInput,
): Promise<void> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  await request<void>(`/api/Transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

/** DELETE /api/Transactions/{id}. Contesta 204, o 404 si ya no existe. */
export async function deleteTransaction(id: number): Promise<void> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  await request<void>(`/api/Transactions/${id}`, { method: "DELETE" });
}

/**
 * GET /api/Budgets. Devuelve todos los presupuestos del usuario, de cualquier
 * mes: el endpoint no admite filtro, asi que el panel se queda con los del mes
 * que se esta viendo. Son pocos por naturaleza, no compensa paginarlos.
 */
export async function getBudgets(): Promise<BudgetDto[]> {
  if (isUsingMockData()) {
    await delay(200);
    return [];
  }

  return request<BudgetDto[]>("/api/Budgets");
}

export async function createBudget(input: BudgetInput): Promise<BudgetDto> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  return request<BudgetDto>("/api/Budgets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** PUT /api/Budgets/{id}. Contesta 204. */
export async function updateBudget(
  id: number,
  input: BudgetInput,
): Promise<void> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  await request<void>(`/api/Budgets/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

/** DELETE /api/Budgets/{id}. Contesta 204. */
export async function deleteBudget(id: number): Promise<void> {
  if (isUsingMockData()) {
    throw new ApiError("api_not_configured", 0);
  }

  await request<void>(`/api/Budgets/${id}`, { method: "DELETE" });
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<UserDto> {
  if (isUsingMockData()) {
    await delay(500);
    return { id: 0, name, email };
  }

  // Devuelve el usuario creado, no un token: hay que iniciar sesion despues.
  return request<UserDto>("/api/Users/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
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
