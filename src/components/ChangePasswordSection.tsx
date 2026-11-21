"use client";

import { useState, type FormEvent } from "react";
import { changePassword } from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";
import { useHasOwnPassword } from "@/lib/useSession";
import PasswordInput from "@/components/PasswordInput";

const labelClasses = "mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300";

/**
 * Cambiar la contraseña: la actual, la nueva y su repeticion. Al guardarla, la
 * API cierra la sesion en los demas dispositivos; este sigue dentro con el
 * token nuevo que devuelve.
 */
export default function ChangePasswordSection() {
  const t = useT();
  const describeError = useApiErrorMessage();
  const hasPassword = useHasOwnPassword();

  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  function close() {
    setIsOpen(false);
    setCurrent("");
    setNext("");
    setConfirmation("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Las mismas comprobaciones que el registro, antes de molestar a la API.
    if (next.length < 12) {
      setError(t("errors.passwordTooShort"));
      return;
    }
    if (next !== confirmation) {
      setError(t("errors.passwordsDontMatch"));
      return;
    }

    setIsBusy(true);
    try {
      await changePassword(current, next);
      close();
      setIsChanged(true);
    } catch (cause: unknown) {
      setError(describeError(cause, "password.failed"));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("password.title")}</h2>
      {/* Cuentas de Google o la demo: nada que cambiar, se explica en vez del boton. */}
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {hasPassword ? t("password.description") : t("apiError.password_not_available")}
      </p>

      {isChanged && (
        <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {t("password.changed")}
        </p>
      )}

      {!hasPassword ? null : !isOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsChanged(false);
            setIsOpen(true);
          }}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t("password.change")}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2">
          <label htmlFor="current-password" className={labelClasses}>
            {t("password.current")}
          </label>
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            value={current}
            onChange={setCurrent}
            disabled={isBusy}
          />

          <label htmlFor="new-password" className={labelClasses}>
            {t("password.new")}
          </label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            value={next}
            onChange={setNext}
            disabled={isBusy}
            placeholder={t("register.passwordPlaceholder")}
          />

          <label htmlFor="new-password-confirmation" className={labelClasses}>
            {t("password.confirm")}
          </label>
          <PasswordInput
            id="new-password-confirmation"
            autoComplete="new-password"
            value={confirmation}
            onChange={setConfirmation}
            disabled={isBusy}
          />

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={isBusy || !current || !next || !confirmation}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
            >
              {isBusy ? t("password.saving") : t("password.save")}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={isBusy}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("mfa.cancel")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
