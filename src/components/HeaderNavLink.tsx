"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHasSession } from "@/lib/useSession";
import StableLabel from "@/components/StableLabel";

const linkClasses =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

/**
 * Salida de la pantalla de Configuracion.
 *
 * Configuracion ya no se anuncia en la cabecera: es una pantalla tecnica, para
 * apuntar la aplicacion a otra API, y no tiene sentido ofrecersela a quien solo
 * quiere ver sus finanzas. Se sigue llegando escribiendo /settings, y desde el
 * aviso de modo demostracion cuando no hay ninguna API configurada.
 *
 * Por eso este boton solo aparece estando alli, para poder volver: al resumen
 * si hay sesion, o al acceso si no la hay.
 */
export default function HeaderNavLink() {
  const pathname = usePathname();
  const hasSession = useHasSession();

  if (pathname !== "/settings") return null;

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
