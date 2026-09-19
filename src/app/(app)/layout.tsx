"use client";

import TopBar from "@/components/TopBar";
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
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950">
      <TopBar />
      {canRender ? children : null}
    </div>
  );
}
