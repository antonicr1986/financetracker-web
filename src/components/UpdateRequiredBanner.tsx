"use client";

import { useSyncExternalStore } from "react";
import { isUpdateRequired, subscribeToUpdateRequired } from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";

/**
 * Aviso fijo cuando la API responde 426: esta pestana tiene una version de la
 * web que ya no esta soportada. Va en el layout raiz para verse en cualquier
 * pantalla. No recarga solo: se perderia lo que el usuario este escribiendo.
 *
 * Se lee con useSyncExternalStore, igual que SessionExpiredBanner: en el
 * servidor nunca hay aviso y en el navegador se actualiza al marcarse.
 */
export default function UpdateRequiredBanner() {
  const t = useT();
  const required = useSyncExternalStore(
    subscribeToUpdateRequired,
    isUpdateRequired,
    () => false,
  );

  if (!required) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{t("update.title")}</p>
          <p className="mt-0.5">{t("update.body")}</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
        >
          {t("update.reload")}
        </button>
      </div>
    </div>
  );
}
