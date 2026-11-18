"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHasSession } from "@/lib/useSession";
import StableLabel from "@/components/StableLabel";
import { useT } from "@/lib/i18n/useT";

const linkClasses =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

/**
 * Entrada y salida de la pantalla de Configuracion.
 *
 * Con sesion abierta se ofrece en la cabecera: ademas de la URL de la API,
 * ahi vive la verificacion en dos pasos, y escondida nadie la activaria. En el
 * acceso no aparece; sin sesion se sigue llegando desde el aviso de modo
 * demostracion o escribiendo /settings.
 *
 * Estando en Configuracion, el boton sirve para volver: al resumen si hay
 * sesion, o al acceso si no la hay.
 */
export default function HeaderNavLink() {
  const pathname = usePathname();
  const hasSession = useHasSession();
  const t = useT();

  if (pathname !== "/settings") {
    if (!hasSession || pathname === "/login") return null;

    // Solo el icono, del mismo tamaño que el del tema: en el movil no cabe
    // otro boton con texto. El nombre va en aria-label (lectores de pantalla)
    // y en title (al pasar el raton).
    return (
      <Link
        href="/settings"
        aria-label={t("header.settings")}
        title={t("header.settings")}
        className="rounded-lg border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Link>
    );
  }

  return hasSession ? (
    <Link href="/" className={linkClasses}>
      <StableLabel messageKey="header.summary" />
    </Link>
  ) : (
    <Link href="/login" className={linkClasses}>
      <StableLabel messageKey="header.signIn" />
    </Link>
  );
}
