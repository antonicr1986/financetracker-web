"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  login,
  setToken,
  setUser,
  clearSessionExpired,
  isUsingMockData,
} from "@/lib/api/client";
import { getAndClearReturnUrl } from "@/lib/useSessionGuard";
import { useMockMode } from "@/lib/useMockMode";
import { useT } from "@/lib/i18n/useT";
import SessionExpiredBanner from "@/components/SessionExpiredBanner";
import Link from "next/link";

// Cuenta publica de solo lectura sembrada por el backend (DemoDataSeeder),
// para que cualquiera pueda echar un vistazo sin registrarse.
const DEMO_EMAIL = "demo@financetracker.app";
const DEMO_PASSWORD = "Demo1234!"; // gitleaks:allow

export default function LoginPage() {
  const router = useRouter();
  const mockMode = useMockMode();
  const t = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

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
      const response = await login(emailToUse, passwordToUse);
      setToken(response.token);
      setUser(response.user ?? null);
      // El aviso de sesion caducada ya ha cumplido: se borra al entrar.
      clearSessionExpired();
      
      // Si hay una URL guardada (porque la sesión expiró), volver allí
      // Si no, ir a la página principal
      const returnUrl = getAndClearReturnUrl();
      router.push(returnUrl || "/");
    } catch (cause: unknown) {
      if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError(
          isUsingMockData()
            ? t("errors.signInFailed")
            : t("errors.serverUnreachable")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
            placeholder="********"
          />

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
              <strong>{t("login.demoBanner")}</strong> {t("login.demoBannerBody")}{" "}
              <Link
                href="/settings"
                className="underline hover:no-underline dark:text-blue-200"
              >
                {t("login.configureApi")}
              </Link>
              .
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

          <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
            {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>
        </form>

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
