"use client";

import TopBar from "@/components/TopBar";
import { useSessionGuard } from "@/lib/useSessionGuard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vigila si la sesión sigue válida
  // Si expira, guarda la ubicación actual y redirige a login
  useSessionGuard();

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950">
      <TopBar />
      {children}
    </div>
  );
}
