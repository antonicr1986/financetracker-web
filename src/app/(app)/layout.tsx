"use client";

import TopBar from "@/components/TopBar";
import SiteFooter from "@/components/SiteFooter";
import { useSessionGuard } from "@/lib/useSessionGuard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sin sesion, el guard redirige al acceso y aqui no se pinta el contenido:
  // asi el panel no llega a montarse ni a lanzar una peticion condenada al 401.
  const canRender = useSessionGuard();

  return (
    <div className="flex min-h-screen flex-col bg-slate-200 dark:bg-slate-950">
      <TopBar />
      {/* flex-1 empuja el pie al fondo aunque la pagina sea corta. */}
      <div className="flex-1">{canRender ? children : null}</div>
      <SiteFooter />
    </div>
  );
}
