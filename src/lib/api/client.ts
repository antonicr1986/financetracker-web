import type {
  BudgetDto,
  BudgetInput,
  CategoryDto,
  TransactionInput,
  LoginResponseDto,
  MfaChallengeDto,
  EmailVerificationChallengeDto,
  MfaRecoveryCodesDto,
  MfaSetupDto,
  PagedResult,
  SignInResponse,
  TransactionDto,
  TransactionType,
  UserDto,
} from "@/lib/types";
import { mockTransactions } from "@/lib/mock";
import type { Locale } from "@/lib/i18n/locale";

const API_URL_STORAGE_KEY = "financetracker.api.url";
const TOKEN_KEY = "financetracker.token"; // gitleaks:allow
const USER_KEY = "financetracker.user";
const EXPIRED_KEY = "financetracker.session-expired";
// Dispositivo de confianza del MFA. Se guarda aparte de la sesion a proposito:
// cerrar sesion no lo borra (es el dispositivo el que es de confianza, no la
// sesion). Lo borran "Olvidar dispositivos" y desactivar el MFA.
const TRUSTED_DEVICE_KEY = "financetracker.trusted-device"; // gitleaks:allow

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
 * Si se puede apuntar la web a otra API desde Configuracion. Solo fuera de
 * produccion (npm run dev, tests), para probar contra localhost o AWS.
 *
 * En produccion no, por seguridad: con la URL guardada en el navegador,
 * bastaria convencer a alguien de "configurar" una API ajena para que su
 * correo, su contraseña y sus codigos del MFA acabaran en ese servidor
 * creyendo estar en la web oficial. Alli manda siempre NEXT_PUBLIC_API_URL.
 *
 * Lee NODE_ENV en cada llamada (y no una vez al cargar) para poder probarlo.
 */
export function canConfigureApiUrl(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * URL de la API en uso: en desarrollo manda lo que se haya guardado en
 * Configuracion y, si no hay nada, la de por defecto. En produccion, siempre
 * la de por defecto. Si no la hay, devuelve null y la aplicacion tira de
 * datos de ejemplo.
 */
export function getApiUrl(): string | null {
  if (typeof window === "undefined" || !canConfigureApiUrl()) return DEFAULT_API_URL;
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

/**
 * Despierta la API y la base de datos sin esperar respuesta.
 *
 * En produccion la API corre en el plan gratuito de App Service, que se
 * descarga tras un rato sin uso, y Azure SQL serverless se pausa a la hora.
 * Llamar a /health/ready (que consulta la base de datos) en cuanto se abre el
 * login hace que ambos arranquen mientras la persona lee la pantalla, en vez
 * de cuando pulsa "Entrar".
 *
 * "no-cors" porque solo interesa que la peticion llegue: la respuesta no se
 * lee, asi que no hace falta que el endpoint de salud tenga CORS. Cualquier
 * fallo se ignora; el login sigue funcionando igual.
 */
export function warmUpApi(): void {
  const baseUrl = getApiUrl();
  if (!baseUrl) return;
  fetch(`${baseUrl}/health/ready`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
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
  language: Locale,
): Promise<UserDto> {
  if (isUsingMockData()) {
    await delay(500);
    return { id: 0, name, email };
  }

  // Devuelve el usuario creado, no un token: hay que iniciar sesion despues.
  // El idioma hace que la API siembre las categorias de partida en el que se
  // esta viendo la aplicacion ("Groceries" y no "Supermercado" en ingles).
  return request<UserDto>("/api/Users/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, language }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<SignInResponse> {
  if (isUsingMockData()) {
    await delay(500);
    return {
      token: "mock-token",
      expiration: new Date(Date.now() + 3600_000).toISOString(),
      user: { id: 0, name: "Usuario demo", email },
    };
  }

  // POST /api/Users/login -> { token, expiration, user }, o bien
  // { mfaRequired, mfaToken } si la cuenta tiene verificacion en dos pasos.
  // Con un dispositivo de confianza valido, la API se salta el codigo.
  return request<SignInResponse>("/api/Users/login", {
    method: "POST",
    body: JSON.stringify({ email, password, trustedDeviceToken: getTrustedDeviceToken() ?? undefined }),
  });
}

/**
 * Inicio de sesion con Google: el ID token que devuelve Google al elegir la
 * cuenta se valida en la API, que responde igual que el login normal (tambien
 * con el segundo paso si la cuenta tiene MFA). El
 * idioma sirve para las categorias de partida si la cuenta se crea ahora.
 */
export async function googleLogin(
  idToken: string,
  language: Locale,
): Promise<SignInResponse> {
  return request<SignInResponse>("/api/Users/google", {
    method: "POST",
    body: JSON.stringify({ idToken, language, trustedDeviceToken: getTrustedDeviceToken() ?? undefined }),
  });
}

/** Token de dispositivo de confianza guardado en este navegador, o null. */
export function getTrustedDeviceToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TRUSTED_DEVICE_KEY);
  } catch {
    return null;
  }
}

function setTrustedDeviceToken(value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) localStorage.setItem(TRUSTED_DEVICE_KEY, value);
    else localStorage.removeItem(TRUSTED_DEVICE_KEY);
  } catch {
    // Modo privado: simplemente se volvera a pedir el codigo.
  }
}

/** true si el login pide el segundo paso en lugar de abrir la sesion. */
export function isMfaChallenge(response: SignInResponse): response is MfaChallengeDto {
  return "mfaRequired" in response && response.mfaRequired === true;
}

export function isEmailVerificationChallenge(
  response: SignInResponse,
): response is EmailVerificationChallengeDto {
  return "emailVerificationRequired" in response && response.emailVerificationRequired === true;
}

/**
 * Codigo de 6 digitos del correo. Correcto: sesion (o, si la cuenta tuviera
 * MFA, su paso). Errores: invalid_email_code, email_code_expired (hay que
 * pedir otro) e invalid_verification_token (volver a la contraseña).
 */
export async function verifyEmail(verificationToken: string, code: string): Promise<SignInResponse> {
  return request<SignInResponse>("/api/users/email/verify", {
    method: "POST",
    body: JSON.stringify({ verificationToken, code }),
  });
}

/**
 * "¿Has olvidado tu contraseña?": la API envia un codigo al correo si es de
 * una cuenta con contraseña propia. Responde igual exista o no la cuenta.
 */
export async function forgotPassword(email: string): Promise<void> {
  // Sin API (modo demostracion): se simula, para poder ver la pantalla en local.
  if (isUsingMockData()) {
    await delay(500);
    return;
  }

  await request<void>("/api/users/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Contraseña nueva con el codigo del correo. No inicia sesion: la API cierra
 * todas las sesiones y despues se entra con la contraseña nueva.
 * Errores: invalid_reset_code, reset_code_expired y password_breached.
 */
export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  // Sin API (modo demostracion): se simula, para poder ver la pantalla en local.
  if (isUsingMockData()) {
    await delay(500);
    return;
  }

  await request<void>("/api/users/password/reset", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}

/** Envia un codigo nuevo (como mucho uno por minuto: email_code_recently_sent). */
export async function resendEmailCode(verificationToken: string): Promise<void> {
  await request<void>("/api/users/email/resend", {
    method: "POST",
    body: JSON.stringify({ verificationToken }),
  });
}

/**
 * Segundo paso del login: codigo de la app autenticadora o de recuperacion.
 * Con rememberDevice, la API devuelve un token para no volver a pedir el
 * codigo en este navegador durante 30 dias, y se guarda aqui.
 */
export async function verifyMfa(
  mfaToken: string,
  code: string,
  rememberDevice = false,
): Promise<LoginResponseDto> {
  const response = await request<LoginResponseDto>("/api/users/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ mfaToken, code, rememberDevice }),
  });

  if (response.trustedDeviceToken) setTrustedDeviceToken(response.trustedDeviceToken);

  return response;
}

/** "Olvidar todos los dispositivos": el siguiente acceso pide el codigo en todos. */
export async function forgetTrustedDevices(): Promise<void> {
  await request<void>("/api/users/mfa/forget-devices", { method: "POST" });
  setTrustedDeviceToken(null);
}

/**
 * Comprueba que la sesion sigue valida con una peticion ligera (el propio
 * usuario). Si se cerro desde otro dispositivo, la API responde 401 y request()
 * borra la sesion: el guard de (app) lleva al acceso. De paso refresca los
 * datos guardados del usuario (por ejemplo, si activo el MFA en otro sitio).
 */
export async function checkSession(): Promise<void> {
  const user = getUser();
  if (!user || getToken() === null || isUsingMockData()) return;

  const fresh = await request<UserDto>(`/api/Users/${user.id}`);
  setUser(fresh);
}

/**
 * Cambia la contraseña. La API cierra todas las sesiones, tambien esta, y
 * devuelve un JWT nuevo: se guarda para que este navegador siga dentro.
 * Los errores llegan como 400 con su codigo (invalid_current_password...).
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await request<LoginResponseDto>("/api/users/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  setToken(response.token);
  setUser(response.user);
}

/**
 * "Cerrar sesion en todos los dispositivos": la API invalida todos los JWT de
 * la cuenta, tambien el de este navegador, asi que aqui se cierra la sesion.
 * El dispositivo de confianza del MFA se conserva: eso es forgetTrustedDevices.
 */
export async function revokeAllSessions(): Promise<void> {
  await request<void>("/api/users/sessions/revoke", { method: "POST" });
  setToken(null);
  setUser(null);
}

/** Genera el secreto (aun sin activar) y el enlace para el QR. */
export async function setupMfa(): Promise<MfaSetupDto> {
  return request<MfaSetupDto>("/api/users/mfa/setup", { method: "POST" });
}

/** Activa el MFA con el primer codigo y devuelve los codigos de recuperacion. */
export async function confirmMfa(code: string): Promise<MfaRecoveryCodesDto> {
  return request<MfaRecoveryCodesDto>("/api/users/mfa/confirm", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function disableMfa(code: string): Promise<void> {
  await request<void>("/api/users/mfa/disable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  // La API ya ha olvidado los dispositivos: el token guardado no sirve.
  setTrustedDeviceToken(null);
}
