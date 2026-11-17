"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import QRCode from "qrcode";
import {
  confirmMfa,
  disableMfa,
  getStoredUserRaw,
  getUser,
  setUser,
  setupMfa,
  subscribeToSession,
} from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";

type Step =
  | { kind: "idle" }
  | { kind: "setup"; secret: string; qrDataUrl: string }
  | { kind: "codes"; recoveryCodes: string[] }
  | { kind: "disable" };

/** Si la sesion guardada tiene el MFA activo. Sin localStorage (servidor), false. */
function useMfaEnabled(): boolean {
  const raw = useSyncExternalStore(subscribeToSession, getStoredUserRaw, () => null);
  if (!raw) return false;
  try {
    return JSON.parse(raw).mfaEnabled === true;
  } catch {
    return false;
  }
}

function rememberMfa(enabled: boolean) {
  const user = getUser();
  if (user) setUser({ ...user, mfaEnabled: enabled });
}

/**
 * Activar o desactivar la verificacion en dos pasos. Activarla son dos pasos:
 * la API genera el secreto (se muestra como QR y como clave) y se confirma
 * con el primer codigo de la app; entonces llegan los codigos de recuperacion,
 * que solo se ven esa vez.
 */
export default function MfaSection() {
  const t = useT();
  const describeError = useApiErrorMessage();
  const enabled = useMfaEnabled();

  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setError(null);
    setIsBusy(true);
    try {
      await action();
    } catch (cause: unknown) {
      setError(describeError(cause, "mfa.failed"));
    } finally {
      setIsBusy(false);
    }
  }

  function reset() {
    setStep({ kind: "idle" });
    setCode("");
    setError(null);
  }

  const startSetup = () =>
    run(async () => {
      const setup = await setupMfa();
      // El QR se genera aqui, en el navegador: el secreto no sale hacia ningun
      // servicio externo de QR.
      const qrDataUrl = await QRCode.toDataURL(setup.otpAuthUri, { margin: 1, width: 200 });
      setCode("");
      setStep({ kind: "setup", secret: setup.secret, qrDataUrl });
    });

  const confirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return run(async () => {
      const result = await confirmMfa(code.trim());
      rememberMfa(true);
      setCode("");
      setStep({ kind: "codes", recoveryCodes: result.recoveryCodes });
    });
  };

  const disable = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return run(async () => {
      await disableMfa(code.trim());
      rememberMfa(false);
      reset();
    });
  };

  const codeInput = (
    <input
      id="mfa-setting-code"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={code}
      onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
      disabled={isBusy}
      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 font-mono tracking-widest"
      placeholder="123456"
    />
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("mfa.title")}</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            enabled
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {enabled ? t("mfa.statusOn") : t("mfa.statusOff")}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("mfa.description")}</p>

      {step.kind === "idle" && (
        <button
          type="button"
          onClick={enabled ? () => setStep({ kind: "disable" }) : startSetup}
          disabled={isBusy}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-500"
        >
          {enabled ? t("mfa.disable") : t("mfa.enable")}
        </button>
      )}

      {step.kind === "setup" && (
        <form onSubmit={confirm} className="mt-4 space-y-3" noValidate>
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("mfa.scan")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada aqui, no una imagen a optimizar */}
          <img src={step.qrDataUrl} alt="" width={200} height={200} className="rounded-lg bg-white p-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("mfa.manual")}</p>
          <p className="break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100">
            {step.secret}
          </p>
          <label htmlFor="mfa-setting-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("mfa.codeLabel")}
          </label>
          {codeInput}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={isBusy || code.length !== 6} className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
              {t("mfa.confirm")}
            </button>
            <button type="button" onClick={reset} disabled={isBusy} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-500">
              {t("mfa.cancel")}
            </button>
          </div>
        </form>
      )}

      {step.kind === "codes" && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("mfa.recoveryTitle")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("mfa.recoveryBody")}</p>
          <ul className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-3 font-mono text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100">
            {step.recoveryCodes.map((recoveryCode) => (
              <li key={recoveryCode}>{recoveryCode}</li>
            ))}
          </ul>
          <button type="button" onClick={reset} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
            {t("mfa.recoveryDone")}
          </button>
        </div>
      )}

      {step.kind === "disable" && (
        <form onSubmit={disable} className="mt-4 space-y-3" noValidate>
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("mfa.disableHelp")}</p>
          <label htmlFor="mfa-setting-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("mfa.codeLabel")}
          </label>
          {codeInput}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={isBusy || code.length !== 6} className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
              {t("mfa.disable")}
            </button>
            <button type="button" onClick={reset} disabled={isBusy} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-500">
              {t("mfa.cancel")}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
}
