"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Banner que muestra cuando la sesión expiró y el usuario fue redirigido a login.
 * Se muestra de forma suave (sin error rojo), como una información útil.
 */
export default function SessionExpiredBanner() {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(true);

  // Solo se ejecuta en el cliente (no en SSR)
  const shouldShow = searchParams.get("reason") === "expired";

  useEffect(() => {
    if (!shouldShow) return;

    // Ocultarlo automáticamente después de 6 segundos
    const timer = setTimeout(() => setIsVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  if (!shouldShow || !isVisible) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
      <p className="font-medium">Tu sesión expiró</p>
      <p className="mt-1">
        Por favor, inicia sesión de nuevo. Después volverás a donde estabas.
      </p>
    </div>
  );
}
