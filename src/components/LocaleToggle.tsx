"use client";

import { setLocale, type Locale } from "@/lib/i18n/locale";
import { useLocale, useT } from "@/lib/i18n/useT";
import Flag from "@/components/Flag";

const options: Locale[] = ["es", "en"];

/**
 * Selector de idioma. Dos botones y no un desplegable: con solo dos opciones,
 * el desplegable esconde una eleccion que cabe entera a la vista.
 *
 * La bandera acompana al texto pero no lo sustituye: un idioma no es un pais
 * —el espanol no es solo de Espana ni el ingles solo de Estados Unidos—, asi
 * que el codigo escrito sigue siendo lo que informa.
 */
export default function LocaleToggle() {
  const locale = useLocale();
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t("locale.label")}
      className="flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700"
    >
      {options.map((option) => {
        const isActive = option === locale;

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={isActive}
            title={t(option === "es" ? "locale.es" : "locale.en")}
            className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold uppercase transition ${
              isActive
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Flag country={option === "es" ? "es" : "us"} />
            {option}
          </button>
        );
      })}
    </div>
  );
}
