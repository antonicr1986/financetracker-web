"use client";

import { useState, type FormEvent } from "react";
import { changePassword } from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";
import { useHasOwnPassword } from "@/lib/useSession";

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900";

const labelClasses = "mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300";

/**
 * Caja de contraseña con el ojo para ver u ocultar lo escrito, igual que en el
 * acceso. Cada caja recuerda lo suyo; al cerrar el formulario se desmonta y
 * vuelve a quedar oculta.
 */
function PasswordInput({
  id,
  value,
  onChange,
  disabled,
  autoComplete,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoComplete: string;
  placeholder?: string;
}) {
  const t = useT();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1.5">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={inputClasses.replace("mt-1.5 ", "").replace("px-3", "pl-3 pr-10")}
        placeholder={placeholder}
      />
      {/* type="button": no envia el formulario. */}
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={t(visible ? "login.hidePassword" : "login.showPassword")}
        aria-pressed={visible}
        title={t(visible ? "login.hidePassword" : "login.showPassword")}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:text-slate-400 dark:hover:text-slate-600 dark:focus-visible:ring-slate-700"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}

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
