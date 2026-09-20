"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n/useT";

/**
 * Mantiene el atributo `lang` del documento al dia.
 *
 * Importa mas de lo que parece: de el dependen los lectores de pantalla para
 * elegir voz y pronunciacion, y los navegadores para el corrector ortografico.
 * Se hace desde un efecto porque el idioma real solo se conoce en el cliente, y
 * tocar el DOM es exactamente para lo que sirven los efectos.
 */
export default function HtmlLang() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
