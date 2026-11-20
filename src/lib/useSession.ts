"use client";

import { useSyncExternalStore } from "react";
import { getStoredUserRaw, getToken, subscribeToSession } from "@/lib/api/client";

/**
 * Si hay sesion abierta. En el servidor devuelve false, que es lo que pinta el
 * primer render del cliente, asi que el HTML coincide y no se rompe la
 * hidratacion. Se resuscribe a los cambios de sesion, de modo que cerrar sesion
 * actualiza la cabecera al momento.
 */
export function useHasSession(): boolean {
  return useSyncExternalStore(
    subscribeToSession,
    () => getToken() !== null,
    () => false,
  );
}

/**
 * Si la cuenta tiene contraseña propia (ver UserDto.hasPassword). Solo un
 * false explicito cuenta como "no": sin el dato (sesiones antiguas, o en el
 * servidor) se sigue mostrando todo, como antes, y la API decide.
 */
export function accountHasPassword(rawUser: string | null): boolean {
  if (!rawUser) return true;
  try {
    return JSON.parse(rawUser).hasPassword !== false;
  } catch {
    return true;
  }
}

export function useHasOwnPassword(): boolean {
  const raw = useSyncExternalStore(subscribeToSession, getStoredUserRaw, () => null);
  return accountHasPassword(raw);
}
