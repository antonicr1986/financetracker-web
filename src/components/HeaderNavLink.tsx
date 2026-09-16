"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClasses =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

/**
 * Ocupa siempre el mismo hueco de la cabecera, pero cambia de destino: en
 * Configuracion lleva de vuelta al resumen y en el resto lleva a Configuracion.
 * Asi no hay nunca un boton que apunte a la pantalla en la que ya estas.
 */
export default function HeaderNavLink() {
  const pathname = usePathname();
  const isOnSettings = pathname === "/settings";

  return (
    <Link
      href={isOnSettings ? "/" : "/settings"}
      className={linkClasses}
    >
      {isOnSettings ? "Resumen" : "Configuración"}
    </Link>
  );
}
