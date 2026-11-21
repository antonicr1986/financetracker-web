"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError, forgotPassword, resetPassword } from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";
import PasswordInput from "@/components/PasswordInput";

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900";

const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300";

const primaryButtonClasses =
  "mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400";

const cardClasses =
  "rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

type Step = "email" | "code" | "done";

/**
 * "¿Has olvidado tu contraseña?" en tres pasos: el correo, el codigo que llega
 * con la contraseña nueva, y el aviso de que ya se puede entrar. No inicia
 * sesion: la API cierra todas las sesiones al cambiarla.
 */
export default function ForgotPasswordPage() {
  const t = useT();
  const describeError = useApiErrorMessage();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function sendCode() {
    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setStatus(t("passwordReset.codeSent", { email: email.trim() }));
      setStep("code");
    } catch (cause: unknown) {
      setError(describeError(cause, "passwordReset.sendFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t("passwordReset.invalidEmail"));
      return;
    }

    await sendCode();
  }

  async function handleResend() {
    setError(null);
    setStatus(null);
    await sendCode();
  }

  async function handleResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Las mismas reglas que el registro y que la API (ResetPasswordDto).
    if (!/^\d{6}$/.test(code)) {
      setError(t("passwordReset.codeFormat"));
      return;
    }

    if (password.length < 12) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    if (password !== confirmation) {
      setError(t("errors.passwordsDontMatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim(), code, password);
      setStep("done");
    } catch (cause: unknown) {
      // Codigo gastado o caducado: se borra para escribir el de un correo nuevo.
      if (cause instanceof ApiError && cause.serverCode === "reset_code_expired") {
        setCode("");
      }
      setError(describeError(cause, "passwordReset.failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t("passwordReset.title")}</h1>
        {step === "email" && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("passwordReset.intro")}</p>
        )}
      </div>

      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className={cardClasses} noValidate>
          <label htmlFor="email" className={labelClasses}>
            {t("login.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            maxLength={150}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className={inputClasses}
            placeholder={t("login.emailPlaceholder")}
          />

          {error && <ErrorMessage text={error} />}

          <button type="submit" disabled={isSubmitting} className={primaryButtonClasses}>
            {isSubmitting ? t("passwordReset.sending") : t("passwordReset.send")}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleResetSubmit} className={cardClasses} noValidate>
          {status && (
            <p role="status" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {status}
            </p>
          )}

          <label htmlFor="reset-code" className={labelClasses}>
            {t("emailVerification.code")}
          </label>
          {/* Solo cifras: inputMode="numeric" saca el teclado numerico en el movil. */}
          <input
            id="reset-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            disabled={isSubmitting}
            className={`${inputClasses} font-mono tracking-widest`}
            placeholder="123456"
          />

          <label htmlFor="new-password" className={`mt-4 ${labelClasses}`}>
            {t("passwordReset.newPassword")}
          </label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            disabled={isSubmitting}
            placeholder={t("register.passwordPlaceholder")}
          />

          <label htmlFor="confirmation" className={`mt-4 ${labelClasses}`}>
            {t("register.confirm")}
          </label>
          <PasswordInput
            id="confirmation"
            autoComplete="new-password"
            value={confirmation}
            onChange={setConfirmation}
            disabled={isSubmitting}
            placeholder="********"
          />

          {error && <ErrorMessage text={error} />}

          <button type="submit" disabled={isSubmitting} className={primaryButtonClasses}>
            {isSubmitting ? t("passwordReset.submitting") : t("passwordReset.submit")}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={isSubmitting}
            className="mt-3 w-full text-sm font-medium text-slate-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-200 dark:disabled:text-slate-500"
          >
            {t("emailVerification.resend")}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
              setStatus(null);
            }}
            disabled={isSubmitting}
            className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-500"
          >
            {t("mfa.back")}
          </button>
        </form>
      )}

      {step === "done" && (
        <div className={cardClasses}>
          <p role="status" className="text-sm text-slate-700 dark:text-slate-300">
            {t("passwordReset.done")}
          </p>
          <Link href="/login" className={`block text-center ${primaryButtonClasses}`}>
            {t("passwordReset.goToLogin")}
          </Link>
        </div>
      )}

      {step !== "done" && (
        <p className="mt-4 text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-slate-700 underline-offset-2 hover:underline dark:text-slate-200"
          >
            {t("passwordReset.goToLogin")}
          </Link>
        </p>
      )}
    </main>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
      {text}
    </p>
  );
}
