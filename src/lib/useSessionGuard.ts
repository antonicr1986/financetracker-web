"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "@/lib/api/client";
import { useHasSession } from "@/lib/useSession";

const RETURN_URL_KEY = "financetracker.return-url";

/**
 * Guarda la URL a la que volver después del login.
 * Se usa cuando la sesión expira y redirigimos a login.
 */
export function setReturnUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RETURN_URL_KEY, url);
  } catch {
    // Modo privado
  }
}

/**
 * Lee y borra la URL a la que volver.
 * Se llama después del login exitoso.
 */
export function getAndClearReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = localStorage.getItem(RETURN_URL_KEY);
    if (url) localStorage.removeItem(RETURN_URL_KEY);
    return url;
  } catch {
    return null;
  }
}

/**
 * Hook que vigila si la sesión sigue siendo válida.
 * - Si el token expiró, guarda la ubicación actual y redirige a login.
 * - Se ejecuta una sola vez al montar el componente y cuando cambia la sesión.
 * 
 * Úsalo en el layout de (app) para proteger todas las rutas.
 */
export function useSessionGuard(): void {
  const router = useRouter();
  const pathname = usePathname();
  const hasSession = useHasSession();

  const handleSessionExpired = useCallback(() => {
    // Guardar dónde estaba el usuario
    setReturnUrl(pathname);
    
    // Redirigir a login con un parámetro que indica por qué
    router.push("/login?reason=expired");
  }, [pathname, router]);

  useEffect(() => {
    // Si está en el layout de (app) y no hay sesión, significa que expiró
    // (porque si nunca la tuvo, no podría haber llegado hasta aquí)
    if (!hasSession) {
      const token = getToken();
      
      // Solo redirigir si antes había un token (es decir, la sesión expiró)
      // No queremos redirigir si el usuario simplemente quería entrar sin sesión
      if (token === null && pathname !== "/" && pathname !== "/login") {
        handleSessionExpired();
      }
    }
  }, [hasSession, pathname, handleSessionExpired]);
}
