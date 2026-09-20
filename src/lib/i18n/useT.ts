"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, getLocale, subscribeToLocale, type Locale } from "./locale";
import { dictionaries, type MessageKey } from "./messages";

/**
 * Idioma activo. Instantanea de servidor fija en el idioma por defecto, que es
 * lo que renderiza tambien el primer paso del cliente: el HTML coincide y no se
 * rompe la hidratacion. Justo despues React reajusta al idioma real.
 */
export function useLocale(): Locale {
  return useSyncExternalStore(
    subscribeToLocale,
    getLocale,
    () => DEFAULT_LOCALE,
  );
}

/**
 * Devuelve la funcion de traduccion. Admite sustituciones con llaves:
 *   t("saludo", { nombre: "Ana" })  ->  "Hola, Ana"
 */
export function useT() {
  const locale = useLocale();

  // Envuelta en useCallback para que solo cambie al cambiar de idioma. Sin
  // esto seria una funcion nueva en cada render, y cualquier useMemo que la
  // use como dependencia se recalcularia siempre.
  return useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const text = dictionaries[locale][key];
      if (!vars) return text;

      return Object.entries(vars).reduce(
        (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
        text,
      );
    },
    [locale],
  );
}
