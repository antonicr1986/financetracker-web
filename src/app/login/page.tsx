"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { login, setToken, isUsingMockData } from "@/lib/api/client";
import { useMockMode } from "@/lib/useMockMode";
import Link from "next/link";

// Cuenta publica de solo lectura sembrada por el backend (DemoDataSeeder),
// para que cualquiera pueda echar un vistazo sin registrarse.
const DEMO_EMAIL = "demo@financetracker.app";
const DEMO_PASSWORD = "Demo1234!"; // gitleaks:allow

export default function LoginPage() {
  const router = useRouter();
  const mockMode = useMockMode();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(emailToUse: string, passwordToUse: string) {
    setError(null);

    if (!emailToUse || !passwordToUse) {
      setError("Introduce tu correo y tu contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login(emailToUse, passwordToUse);
      setToken(response.token);
      router.push("/");
    } catch (cause: unknown) {
      if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError(
          isUsingMockData()
            ? "No se ha podido iniciar sesión."
            : "No se ha podido contactar con el servidor."
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            FinanceTracker
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Accede para ver tus finanzas
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          noValidate
        >
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
            placeholder="tu@correo.com"
          />

          <label
            htmlFor="password"
            className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Contraseña
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
              <strong>Modo demostración:</strong> Usa cualquier correo y contraseña.{" "}
              <Link
                href="/settings"
                className="underline hover:no-underline dark:text-blue-200"
              >
                Configura la API aquí
              </Link>
              .
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>

          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs text-slate-400 dark:text-slate-500">o</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-500"
          >
            Entrar con la cuenta de demostración
          </button>

          <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
            {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          {mockMode
            ? "Modo demostración sin conexión a API"
            : "Conectado a la API"}
        </p>
      </div>
    </main>
  );
}
