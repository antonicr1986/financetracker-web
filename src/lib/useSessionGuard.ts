"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/api/client";
import { useHasSession } from "@/lib/useSession";

/**
 * Protege las rutas de (app). Sin token lleva al acceso; tras entrar se va
 * siempre al resumen, no a la pagina en la que se estaba.
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
    router.replace("/login");
  }, [hasSession, pathname, router]);

  return hasSession;
}
