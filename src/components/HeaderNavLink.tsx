"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHasSession } from "@/lib/useSession";

const linkClasses =
  "inline-grid rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

const cell = "col-start-1 row-start-1 text-center";

/**
 * Boton de navegacion de la cabecera. Ocupa siempre el mismo hueco, pero su
 * destino depende de donde estemos y de si hay sesion:
 *
 *   fuera de Configuracion      -> "Configuracion"   (/settings)
 *   en Configuracion, con sesion -> "Resumen"        (/)
 *   en Configuracion, sin sesion -> "Iniciar sesion" (/login)
 *
 * El ultimo caso existe porque a Configuracion se llega desde el login sin
 * haberse identificado: ofrecer ahi un atajo al panel invitaba a entrar en la
 * aplicacion sin sesion.
 *
 * Las tres etiquetas se apilan en la misma celda de la rejilla y solo se oculta
 * la que no toca, asi que el ancho del boton es el de la etiqueta mas larga y
 * nada de la cabecera se desplaza al cambiar de pantalla.
 */
export default function HeaderNavLink() {
  const pathname = usePathname();
  const hasSession = useHasSession();

  const isOnSettings = pathname === "/settings";
  const target = !isOnSettings ? "/settings" : hasSession ? "/" : "/login";

  const visible = {
    settings: !isOnSettings,
    summary: isOnSettings && hasSession,
    login: isOnSettings && !hasSession,
  };

  return (
    <Link href={target} className={linkClasses}>
      <span className={`${cell} ${visible.summary ? "" : "invisible"}`}>
        Resumen
      </span>
      <span className={`${cell} ${visible.login ? "" : "invisible"}`}>
        Iniciar sesión
      </span>
      <span className={`${cell} ${visible.settings ? "" : "invisible"}`}>
        Configuración
      </span>
    </Link>
  );
}
