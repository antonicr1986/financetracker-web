"use client";

import { useState, type FormEvent } from "react";
import { useT } from "@/lib/i18n/useT";

interface MfaLoginStepProps {
  isSubmitting: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onBack: () => void;
}

/**
 * Segundo paso del acceso: la contraseña ya es correcta y falta el codigo de
 * la app autenticadora (o uno de recuperacion). autoComplete "one-time-code"
 * deja que el navegador o el gestor de contraseñas lo rellenen.
 */
export default function MfaLoginStep({ isSubmitting, error, onVerify, onBack }: MfaLoginStepProps) {
  const t = useT();
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim()) onVerify(code.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      noValidate
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("mfa.title")}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("mfa.loginBody")}</p>

      <label htmlFor="mfa-code" className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {t("mfa.loginCode")}
      </label>
      <input
        id="mfa-code"
        type="text"
        inputMode="text"
        autoComplete="one-time-code"
        autoFocus
        maxLength={32}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        disabled={isSubmitting}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 font-mono tracking-widest"
        placeholder="123456"
      />

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={isSubmitting || !code.trim()} className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
        {isSubmitting ? t("mfa.verifying") : t("mfa.verify")}
      </button>
      <button type="button" onClick={onBack} disabled={isSubmitting} className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-500">
        {t("mfa.back")}
      </button>
    </form>
  );
}
