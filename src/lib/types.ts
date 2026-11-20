// Mirror of the .NET API DTOs.
// These types stay the same once the real API is wired up.

export type TransactionType = "Income" | "Expense";

export interface TransactionDto {
  id: number;
  description: string;
  amount: number;
  date: string; // ISO 8601, as serialised by the API
  type: TransactionType;
  categoryId: number | null;
  categoryName: string | null;
}

export interface SummaryDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryBreakdown {
  categoryName: string;
  amount: number;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

/** Envelope returned by list endpoints (mirrors PagedResult<T> on the API). */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  /** Opcional: las sesiones guardadas antes de existir el MFA no lo traen. */
  mfaEnabled?: boolean;
  /**
   * false en cuentas solo de Google y en la de demostracion: no tienen
   * contraseña que cambiar ni pueden activar el MFA. Opcional: las sesiones
   * guardadas antes de existir no lo traen, y entonces se asume que si.
   */
  hasPassword?: boolean;
}

/** Respuesta de POST /api/Users/login. */
export interface LoginResponseDto {
  token: string;
  expiration: string;
  user: UserDto;
  /**
   * Solo tras verificar el MFA marcando "no volver a pedir en este
   * dispositivo": se guarda y se envia en los siguientes accesos.
   */
  trustedDeviceToken?: string | null;
}

/**
 * Lo que responde el login cuando la contraseña es correcta pero la cuenta
 * tiene MFA: no hay sesion todavia, solo un token temporal para enviar el
 * codigo a POST /api/users/mfa/verify.
 */
export interface MfaChallengeDto {
  mfaRequired: true;
  mfaToken: string;
  expiration: string;
}

/**
 * Respuesta del login cuando la contraseña es correcta pero el correo aun no
 * esta verificado: no hay sesion, solo un token para enviar el codigo de 6
 * digitos que llega al correo.
 */
export interface EmailVerificationChallengeDto {
  emailVerificationRequired: true;
  verificationToken: string;
  email: string;
  expiration: string;
}

export type SignInResponse = LoginResponseDto | MfaChallengeDto | EmailVerificationChallengeDto;

/** POST /api/users/mfa/setup. */
export interface MfaSetupDto {
  secret: string;
  otpAuthUri: string;
}

/** POST /api/users/mfa/confirm: se muestran una sola vez. */
export interface MfaRecoveryCodesDto {
  recoveryCodes: string[];
}

/**
 * GET /api/Budgets. Lo gastado, lo que queda y el porcentaje los calcula la
 * API cruzando el presupuesto con los movimientos del mes: no se derivan aqui.
 *
 * `categoryId` a null es un presupuesto para todo el tipo, no para una
 * categoria concreta.
 */
export interface BudgetDto {
  id: number;
  name: string;
  amount: number;
  spentAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  month: number;
  year: number;
  type: TransactionType;
  categoryId: number | null;
  categoryName: string | null;
}

/** Cuerpo de POST y PUT /api/Budgets. */
export interface BudgetInput {
  name: string;
  amount: number;
  month: number;
  year: number;
  type: TransactionType;
  categoryId: number | null;
}

export interface CategoryDto {
  id: number;
  name: string;
  type: TransactionType;
}

/**
 * Cuerpo de POST y PUT /api/Transactions.
 *
 * Un solo tipo para alta y edicion porque la API espera exactamente los mismos
 * campos en las dos: CreateTransactionDto y UpdateTransactionDto son identicos.
 */
export interface TransactionInput {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: number;
}
