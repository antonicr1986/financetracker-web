import type { ReactNode } from "react";

/**
 * Bloque plegable del panel.
 *
 * Usa <details>/<summary> nativos en lugar de estado de React: el navegador ya
 * sabe abrir y cerrar, funciona con teclado y con lectores de pantalla sin que
 * anadamos nada, y al no haber estado tampoco hay nada que pueda desincronizarse
 * entre servidor y cliente. Se abre por defecto (`open`).
 *
 * `collapsedSummary` es un resumen de una linea que solo se ve con el bloque
 * plegado: se oculta con `group-open:hidden`, que lee el atributo `open` del
 * <details>, sin JavaScript de por medio.
 */
export default function CollapsibleSection({
  title,
  children,
  collapsedSummary,
  className = "",
}: {
  title: string;
  children: ReactNode;
  collapsedSummary?: ReactNode;
  className?: string;
}) {
  return (
    <details
      open
      className={`group rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`.trim()}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>

        <div className="flex min-w-0 items-center gap-3">
          {collapsedSummary && (
            <span className="truncate text-sm tabular-nums text-slate-500 group-open:hidden dark:text-slate-400">
              {collapsedSummary}
            </span>
          )}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180 dark:text-slate-500"
          >
            <path
              d="M6 8l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </summary>

      <div className="mt-4">{children}</div>
    </details>
  );
}
