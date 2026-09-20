"use client";

import { useSyncExternalStore } from "react";
import { subscribeToSession, wasSessionExpired } from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";

/**
 * Aviso en la pantalla de acceso cuando la sesion se ha invalidado desde el
 * servidor. Es informativo, no un error: aqui el usuario si puede hacer algo.
 *
 * El indicador se lee con useSyncExternalStore y no en el cuerpo del componente
 * porque en el servidor no hay localStorage: leerlo directamente da un texto en
 * el HTML y otro en el navegador, que es como se rompe la hidratacion. Y no se
 * borra al pintar, sino al iniciar sesion, para no provocar un efecto con
 * setState de por medio.
 */
export default function SessionExpiredBanner() {
  const t = useT();
  const expired = useSyncExternalStore(
    subscribeToSession,
    wasSessionExpired,
    () => false,
  );

  if (!expired) return null;

  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-medium">{t("session.expiredTitle")}</p>
      <p className="mt-1">
        {t("session.expiredBody")}
      </p>
    </div>
  );
}
