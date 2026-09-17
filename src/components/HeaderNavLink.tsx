"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClasses =
  "inline-grid rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

/**
 * Ocupa siempre el mismo hueco de la cabecera, pero cambia de destino: en
 * Configuracion lleva de vuelta al resumen y en el resto lleva a Configuracion.
 *
 * Las dos etiquetas se apilan en la misma celda de la rejilla y solo se oculta
 * la que no toca, asi que el ancho del boton es siempre el de la etiqueta mas
 * larga y nada de la cabecera se desplaza al cambiar de pantalla. Se usa
 * `invisible` (visibility: hidden) y no `hidden`: sigue ocupando espacio, que
 * es justo lo que buscamos, y los lectores de pantalla la ignoran igual.
 */
export default function HeaderNavLink() {
  const pathname = usePathname();
  const isOnSettings = pathname === "/settings";

  return (
    <Link href={isOnSettings ? "/" : "/settings"} className={linkClasses}>
      <span
        className={`col-start-1 row-start-1 text-center ${
          isOnSettings ? "" : "invisible"
        }`}
      >
        Resumen
      </span>
      <span
        className={`col-start-1 row-start-1 text-center ${
          isOnSettings ? "invisible" : ""
        }`}
      >
        Configuración
      </span>
    </Link>
  );
}
