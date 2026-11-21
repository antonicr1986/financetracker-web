"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/useT";

const inputClasses =
  "w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-900";

/**
 * Caja de contraseña con el ojo para ver u ocultar lo escrito, igual que en el
 * acceso. Cada caja recuerda lo suyo; al desmontarse vuelve a quedar oculta.
 * La usan el cambio y la recuperacion de contraseña.
 */
export default function PasswordInput({
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
        className={inputClasses}
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
