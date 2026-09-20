"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { login, register, setToken, setUser } from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900";

const labelClasses =
  "block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const describeError = useApiErrorMessage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Las reglas son las del backend (RegisterUserDto): nombre obligatorio,
    // correo valido y contrasena de al menos 6 caracteres. Se comprueban aqui
    // para no gastar una ida y vuelta en un error evidente.
    if (!name.trim() || !email.trim() || !password) {
      setError(t("errors.fillAll"));
      return;
    }

    if (password.length < 6) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    if (password !== confirmation) {
      setError(t("errors.passwordsDontMatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name.trim(), email.trim(), password);

      // El registro no devuelve token, asi que se encadena el acceso: el
      // usuario entra directamente en lugar de tener que escribir lo mismo
      // otra vez en la pantalla de al lado.
      const session = await login(email.trim(), password);
      setToken(session.token);
      setUser(session.user ?? null);
      router.push("/");
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.createAccountFailed"));
      setIsSubmitting(false);
    }
  }

  return (
    <main className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t("register.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("register.subtitle")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        noValidate
      >
        <label htmlFor="name" className={labelClasses}>
          {t("register.name")}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
          className={inputClasses}
          placeholder={t("register.namePlaceholder")}
        />

        <label htmlFor="email" className={`mt-4 ${labelClasses}`}>
          {t("login.email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          maxLength={150}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          className={inputClasses}
          placeholder={t("login.emailPlaceholder")}
        />

        <label htmlFor="password" className={`mt-4 ${labelClasses}`}>
          {t("login.password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          className={inputClasses}
          placeholder={t("register.passwordPlaceholder")}
        />

        <label htmlFor="confirmation" className={`mt-4 ${labelClasses}`}>
          {t("register.confirm")}
        </label>
        <input
          id="confirmation"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={isSubmitting}
          className={inputClasses}
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {isSubmitting ? t("register.submitting") : t("register.title")}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("register.haveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-slate-700 underline-offset-2 hover:underline dark:text-slate-200"
        >
          {t("login.submit")}
        </Link>
      </p>
    </main>
  );
}
