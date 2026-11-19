"use client";

import { useEffect, useRef } from "react";
import { checkSession } from "@/lib/api/client";

/** Evita repetir la comprobacion: focus y visibilitychange llegan casi juntos. */
export const MIN_CHECK_INTERVAL_MS = 10_000;

export function shouldCheck(lastCheck: number, now: number): boolean {
  return now - lastCheck >= MIN_CHECK_INTERVAL_MS;
}

/**
 * Al volver a la pestana (vuelve a ser visible o recupera el foco) se comprueba
 * que la sesion sigue viva. Un token revocado desde otro dispositivo solo se
 * descubre al hacer una peticion, y sin esto el panel seguia mostrando lo que
 * ya tenia cargado hasta que se navegaba a otra pagina.
 */
export function useSessionCheckOnReturn() {
  const lastCheck = useRef(0);

  useEffect(() => {
    function check() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (!shouldCheck(lastCheck.current, now)) return;
      lastCheck.current = now;
      // Un 401 ya lo gestiona el cliente; cualquier otro fallo (red, API
      // dormida) no es motivo para molestar: se reintenta la proxima vez.
      checkSession().catch(() => {});
    }

    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);
}
