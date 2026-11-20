"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  canConfigureApiUrl,
  googleLogin,
  isEmailVerificationChallenge,
  isMfaChallenge,
  login,
  verifyEmail,
  verifyMfa,
  setToken,
  setUser,
  clearSessionExpired,
  warmUpApi,
} from "@/lib/api/client";
import { useMockMode } from "@/lib/useMockMode";
import { useLocale, useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";
import SessionExpiredBanner from "@/components/SessionExpiredBanner";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import MfaLoginStep from "@/components/MfaLoginStep";
import EmailVerificationStep from "@/components/EmailVerificationStep";
import type { LoginResponseDto, SignInResponse } from "@/lib/types";
import Link from "next/link";

// Cuenta publica de solo lectura sembrada por el backend (DemoDataSeeder),
// para que cualquiera pueda echar un vistazo sin registrarse.
const DEMO_EMAIL = "demo@financetracker.app";
const DEMO_PASSWORD = "Demo1234!"; // gitleaks:allow

export default function LoginPage() {
  const router = useRouter();
  const mockMode = useMockMode();
  const t = useT();
  const locale = useLocale();
  const describeError = useApiErrorMessage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  // Con valor, la contraseña ya es correcta y se esta pidiendo el codigo del MFA.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  // Con valor, la contraseña es correcta pero falta el codigo enviado al correo.
  const [emailChallenge, setEmailChallenge] = useState<{ token: string; email: string } | null>(null);

  // Precalentamiento: al abrir el login se despiertan la API y la base de
  // datos, asi la espera ocurre mientras se lee la pantalla y no al entrar.
  // En modo demostracion no hay API a la que llamar.
  useEffect(() => {
    if (mockMode) return;
    warmUpApi();
  }, [mockMode]);

  // La base de datos de Azure se pausa tras un rato sin uso y despertarla lleva
  // su tiempo. El backend reintenta solo, pero desde fuera solo se ve un boton
  // quieto: si la espera se alarga, explicamos por que.
  useEffect(() => {
    if (!isSubmitting) return;
    const timer = setTimeout(() => setIsSlow(true), 4000);
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  async function signIn(emailToUse: string, passwordToUse: string) {
    setError(null);

    if (!emailToUse || !passwordToUse) {
      setError(t("errors.fillCredentials"));
      return;
    }

    setIsSlow(false);
    setIsSubmitting(true);

    try {
      handleSignIn(await login(emailToUse, passwordToUse));
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.signInFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Google ya ha verificado la cuenta; la API valida el token y abre la sesion.
  async function signInWithGoogle(idToken: string) {
    setError(null);
    setIsSlow(false);
    setIsSubmitting(true);

    try {
      handleSignIn(await googleLogin(idToken, locale));
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.signInFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Con MFA o con el correo sin verificar el login no abre la sesion: pasa a
  // la pantalla del codigo que toque.
  function handleSignIn(response: SignInResponse) {
    if (isEmailVerificationChallenge(response)) {
      setEmailChallenge({ token: response.verificationToken, email: response.email });
      return;
    }

    setEmailChallenge(null);

    if (isMfaChallenge(response)) {
      setMfaToken(response.mfaToken);
      return;
    }

    enterWith(response);
  }

  async function verifyCode(code: string, rememberDevice: boolean) {
    if (!mfaToken) return;

    setError(null);
    setIsSubmitting(true);

    try {
      enterWith(await verifyMfa(mfaToken, code, rememberDevice));
    } catch (cause: unknown) {
      // El token del segundo paso dura 5 minutos: si ha caducado, se vuelve
      // a pedir la contraseña.
      if (cause instanceof ApiError && cause.serverCode === "invalid_mfa_token") {
        setMfaToken(null);
      }
      setError(describeError(cause, "errors.signInFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyEmailCode(code: string) {
    if (!emailChallenge) return;

    setError(null);
    setIsSubmitting(true);

    try {
      handleSignIn(await verifyEmail(emailChallenge.token, code));
    } catch (cause: unknown) {
      // El token de este paso dura 30 minutos: si ha caducado, se vuelve a
      // pedir la contraseña (que enviara un codigo nuevo si hace falta).
      if (cause instanceof ApiError && cause.serverCode === "invalid_verification_token") {
        setEmailChallenge(null);
      }
      setError(describeError(cause, "errors.signInFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function backToPassword() {
    setMfaToken(null);
    setEmailChallenge(null);
    setError(null);
  }

  function enterWith(response: LoginResponseDto) {
    setToken(response.token);
    setUser(response.user ?? null);
    // El aviso de sesion caducada ya ha cumplido: se borra al entrar.
    clearSessionExpired();

    // Siempre al resumen, venga de donde venga: volver a la pagina en la que
    // se cerro la sesion (por ejemplo Configuracion) desorientaba mas que ayudaba.
    router.push("/");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signIn(email, password);
  }

  // Rellena el formulario a la vista del usuario y entra directamente.
  async function handleDemoLogin() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await signIn(DEMO_EMAIL, DEMO_PASSWORD);
  }

  return (
    <main className="w-full max-w-sm">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            FinanceTracker
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("login.subtitle")}
          </p>
        </div>

        <Suspense fallback={null}>
          <SessionExpiredBanner />
        </Suspense>

        {emailChallenge !== null ? (
          <EmailVerificationStep
            verificationToken={emailChallenge.token}
            email={emailChallenge.email}
            isSubmitting={isSubmitting}
            error={error}
            onVerify={verifyEmailCode}
            onBack={backToPassword}
          />
        ) : mfaToken !== null ? (
          <MfaLoginStep
            isSubmitting={isSubmitting}
            error={error}
            onVerify={verifyCode}
            onBack={backToPassword}
          />
        ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          noValidate
        >
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t("login.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
            placeholder={t("login.emailPlaceholder")}
          />

          <label
            htmlFor="password"
            className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t("login.password")}
          </label>
          <div className="relative mt-1.5">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
            placeholder="********"
          />
          {/* Ver u ocultar lo escrito. type="button": no envia el formulario. */}
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={t(showPassword ? "login.hidePassword" : "login.showPassword")}
            aria-pressed={showPassword}
            title={t(showPassword ? "login.hidePassword" : "login.showPassword")}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:text-slate-400 dark:hover:text-slate-600 dark:focus-visible:ring-slate-700"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M3 3l18 18" />}
            </svg>
          </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
            >
              {error}
            </p>
          )}

          {mockMode && (
            <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <strong>{t("login.demoBanner")}</strong> {t("login.demoBannerBody")}
              {/* Solo en desarrollo: en produccion la API no se configura aqui. */}
              {canConfigureApiUrl() && (
                <>
                  {" "}
                  <Link
                    href="/settings"
                    className="underline hover:no-underline dark:text-blue-200"
                  >
                    {t("login.configureApi")}
                  </Link>
                  .
                </>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            {isSubmitting ? t("login.submitting") : t("login.submit")}
          </button>

          {isSubmitting && isSlow && (
            <p
              role="status"
              className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {t("login.wakingUp")}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs text-slate-400 dark:text-slate-500">{t("login.or")}</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-500"
          >
            {t("login.demo")}
          </button>

          {/* Sin API no hay quien valide el token de Google. */}
          {!mockMode && (
            <GoogleSignInButton locale={locale} onCredential={signInWithGoogle} />
          )}

          <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
            {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>
        </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("login.noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-slate-700 underline-offset-2 hover:underline dark:text-slate-200"
          >
            {t("login.createOne")}
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          {mockMode
            ? t("login.offline")
            : t("login.connected")}
        </p>
      </div>
    </main>
  );
}
