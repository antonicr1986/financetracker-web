"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/api/client";
import { useHasSession } from "@/lib/useSession";

const RETURN_URL_KEY = "financetracker.return-url";

/** Donde estaba el usuario cuando se le pidio identificarse. */
function setReturnUrl(url: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RETURN_URL_KEY, url);
  } catch {
    // Modo privado: volvera al panel en vez de a donde estaba.
  }
}

/** Lo lee la pantalla de acceso tras un login correcto, y lo borra. */
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
 * Protege las rutas de (app). Sin token lleva al acceso, guardando antes donde
 * estabamos para poder volver.
 *
 * Devuelve si se puede pintar el contenido. Importa que el layout lo respete:
 * si dejaramos montar el panel mientras se redirige, lanzaria su peticion, se
 * comeria un 401 y pintaria un error por una pantalla que ya estamos abandonando
 * — que es justo lo que pasaba antes.
 *
 * La comprobacion del efecto lee getToken() y no `hasSession` a proposito:
 * `hasSession` vale false en el primer render por el contrato de hidratacion,
 * y decidir una redireccion con ese valor echaria fuera a quien si tiene sesion.
 */
export function useSessionGuard(): boolean {
  const router = useRouter();
  const pathname = usePathname();
  const hasSession = useHasSession();

  useEffect(() => {
    if (getToken() !== null) return;
    setReturnUrl(pathname);
    router.replace("/login");
  }, [hasSession, pathname, router]);

  return hasSession;
}
