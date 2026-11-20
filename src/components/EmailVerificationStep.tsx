"use client";

import { useState, type FormEvent } from "react";
import { resendEmailCode } from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";

interface EmailVerificationStepProps {
  verificationToken: string;
  email: string;
  isSubmitting: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onBack: () => void;
}

/**
 * Paso del acceso para una cuenta con el correo sin verificar: la contraseña
 * es correcta y falta el codigo de 6 digitos que la API ha enviado al correo.
 * Hasta escribirlo no hay sesion. Lo usan el acceso y el registro.
 */
export default function EmailVerificationStep({
  verificationToken,
  email,
  isSubmitting,
  error,
  onVerify,
  onBack,
}: EmailVerificationStepProps) {
  const t = useT();
  const describeError = useApiErrorMessage();
  const [code, setCode] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (/^\d{6}$/.test(code)) onVerify(code);
  }

  async function resend() {
    setResendStatus(null);
    setIsResending(true);
    try {
      await resendEmailCode(verificationToken);
      setResendStatus(t("emailVerification.resent"));
    } catch (cause: unknown) {
      setResendStatus(describeError(cause, "emailVerification.resendFailed"));
    } finally {
      setIsResending(false);
    }
  }

  const busy = isSubmitting || isResending;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      noValidate
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("emailVerification.title")}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("emailVerification.body", { email })}</p>

      <label htmlFor="email-code" className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {t("emailVerification.code")}
      </label>
      {/* Solo cifras: inputMode="numeric" saca el teclado numerico en el movil. */}
      <input
        id="email-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        disabled={busy}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tracking-widest text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
        placeholder="123456"
      />

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      >
        {isSubmitting ? t("mfa.verifying") : t("mfa.verify")}
      </button>

      <button
        type="button"
        onClick={resend}
        disabled={busy}
        className="mt-3 w-full text-sm font-medium text-slate-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-200 dark:disabled:text-slate-500"
      >
        {isResending ? t("emailVerification.resending") : t("emailVerification.resend")}
      </button>
      {resendStatus && (
        <p role="status" className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {resendStatus}
        </p>
      )}

      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-500"
      >
        {t("mfa.back")}
      </button>
    </form>
  );
}
