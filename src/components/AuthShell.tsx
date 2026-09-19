import type { ReactNode } from "react";
import TopBar from "@/components/TopBar";

/**
 * Marco de las pantallas de acceso y registro. Vive en un componente y no
 * duplicado en cada layout para que las dos no se separen con el tiempo.
 */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-200 dark:bg-slate-950">
      <TopBar />
      {/* Alineado arriba y no centrado: con la cabecera de por medio, centrar
          en vertical dejaba el formulario demasiado bajo. */}
      <div className="flex flex-1 justify-center px-4 pt-10 pb-8 sm:pt-16">
        {children}
      </div>
    </div>
  );
}
