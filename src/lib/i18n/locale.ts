"use client";

export type Locale = "es" | "en";

const LOCALE_KEY = "financetracker.locale";
const LOCALE_EVENT = "financetracker:locale";

/** El idioma con el que se renderiza en el servidor y en el primer paso del cliente. */
export const DEFAULT_LOCALE: Locale = "es";

function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en";
}

/**
 * Idioma en uso: el guardado por el usuario y, si no hay, el del navegador.
 *
 * Devuelve una cadena (no un objeto) a proposito: useSyncExternalStore exige
 * una instantanea estable, y un valor primitivo lo es por definicion.
 */
export function getLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Modo privado: se cae al idioma del navegador.
  }

  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export function setLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Sin almacenamiento, el cambio dura lo que dure la pestana.
  }
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

/** Suscripcion para useSyncExternalStore. "storage" cubre las otras pestanas. */
export function subscribeToLocale(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LOCALE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOCALE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
