"use client";

import { useSyncExternalStore } from "react";
import { getToken, subscribeToSession } from "@/lib/api/client";

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
