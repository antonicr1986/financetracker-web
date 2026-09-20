"use client";

import { useMemo } from "react";
import { useLocale } from "./useT";
import type { Locale } from "./locale";

/**
 * Etiqueta BCP-47 para Intl. En ingles se usa en-GB y no en-US porque la moneda
 * sigue siendo el euro: en-GB lo formatea como "€1,234.56", que es lo natural
 * para un europeo leyendo en ingles.
 */
export function intlTag(locale: Locale): string {
  return locale === "es" ? "es-ES" : "en-GB";
}

export function useFormatters() {
  const locale = useLocale();

  return useMemo(() => {
    const tag = intlTag(locale);

    return {
      locale,
      currency: new Intl.NumberFormat(tag, {
        style: "currency",
        currency: "EUR",
      }),
      currencyShort: new Intl.NumberFormat(tag, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
      shortDate: new Intl.DateTimeFormat(tag, {
        day: "2-digit",
        month: "short",
      }),
    };
  }, [locale]);
}
