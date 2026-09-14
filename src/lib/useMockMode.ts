"use client";

import { useSyncExternalStore } from "react";
import { isUsingMockData } from "@/lib/api/client";

const noop = () => () => {};

/**
 * Devuelve si la app esta en modo demostracion. En el servidor devuelve
 * siempre false, que es lo que renderiza el primer paso del cliente: asi el
 * HTML coincide y no hay error de hidratacion. Justo despues React vuelve a
 * leer el valor real del navegador y reajusta lo que haga falta.
 */
export function useMockMode(): boolean {
  return useSyncExternalStore(noop, isUsingMockData, () => false);
}
