"use client";

import { useSyncExternalStore } from "react";
import { getApiUrl, getDefaultApiUrl } from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";

const noop = () => () => {};

const FRONTEND_REPO = "https://github.com/antonicr1986/financetracker-web";
const BACKEND_REPO = "https://github.com/antonicr1986/FinanceTracker";

const linkClasses =
  "underline-offset-2 transition hover:text-slate-700 hover:underline dark:hover:text-slate-200";

/**
 * Pie discreto con los enlaces al codigo y a la documentacion de la API.
 *
 * Quien abre la aplicacion solo ve el frontend: la API, la autenticacion y el
 * despliegue quedan invisibles. Esto los pone a un clic.
 *
 * La URL de Swagger se deriva de la API configurada, no va escrita a fuego, para
 * que apunte al backend local en desarrollo y al de Azure en produccion. La
 * instantanea de servidor es la URL por defecto de la compilacion: coincide con
 * la del cliente salvo que haya un override guardado en Configuracion, y en ese
 * caso useSyncExternalStore lo reajusta despues de hidratar sin romper nada.
 */
export default function SiteFooter() {
  const apiUrl = useSyncExternalStore(noop, getApiUrl, getDefaultApiUrl);
  const t = useT();

  return (
    <footer className="mt-12 border-t border-slate-300 py-6 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-xs text-slate-500 dark:text-slate-400">
        <span>{t("footer.stack")}</span>

        {apiUrl && (
          <>
            <span aria-hidden="true">·</span>
            <a
              href={`${apiUrl}/swagger`}
              target="_blank"
              rel="noreferrer"
              className={linkClasses}
            >
              {t("footer.apiDocs")}
            </a>
          </>
        )}

        <span aria-hidden="true">·</span>
        <a
          href={FRONTEND_REPO}
          target="_blank"
          rel="noreferrer"
          className={linkClasses}
        >
          {t("footer.frontendCode")}
        </a>

        <span aria-hidden="true">·</span>
        <a
          href={BACKEND_REPO}
          target="_blank"
          rel="noreferrer"
          className={linkClasses}
        >
          {t("footer.apiCode")}
        </a>
      </div>
    </footer>
  );
}
