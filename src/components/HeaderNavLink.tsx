"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHasSession } from "@/lib/useSession";
import StableLabel from "@/components/StableLabel";

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

  if (pathname !== "/settings") {
    if (!hasSession || pathname === "/login") return null;

    return (
      <Link href="/settings" className={linkClasses}>
        <StableLabel messageKey="header.settings" />
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
