"use client";

import { dictionaries, type MessageKey } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/i18n/useT";

const LOCALES = ["es", "en"] as const;

/**
 * Etiqueta cuyo ancho no depende del idioma.
 *
 * Apila las traducciones de todos los idiomas en la misma celda de una rejilla
 * y oculta las que no tocan, asi que el hueco reservado es siempre el de la mas
 * larga. Sin esto, pasar de "Salir" a "Sign out" ensancha el boton y arrastra
 * de lado todo lo que tiene al lado en la cabecera.
 *
 * Se usa `invisible` (visibility: hidden) y no `hidden`: sigue ocupando sitio,
 * que es justo lo que se busca, y los lectores de pantalla lo ignoran igual, de
 * modo que no se anuncian las dos versiones seguidas.
 *
 * Frente a fijar un ancho a ojo, esto se mantiene solo: si manana cambia una
 * traduccion, el hueco se ajusta sin tocar nada.
 */
export default function StableLabel({ messageKey }: { messageKey: MessageKey }) {
  const locale = useLocale();

  return (
    <span className="inline-grid">
      {LOCALES.map((candidate) => (
        <span
          key={candidate}
          className={`col-start-1 row-start-1 text-center ${
            candidate === locale ? "" : "invisible"
          }`}
        >
          {dictionaries[candidate][messageKey]}
        </span>
      ))}
    </span>
  );
}
