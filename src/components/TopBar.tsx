"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import CurrentUserEmail from "@/components/CurrentUserEmail";
import HeaderNavLink from "@/components/HeaderNavLink";
import { setToken, setUser } from "@/lib/api/client";
import { useHasSession } from "@/lib/useSession";

const actionClasses =
  "rounded-lg border px-3 py-1.5 text-sm font-medium transition";

/**
 * Barra superior, compartida por la aplicacion y por la pantalla de acceso.
 *
 * En el login (o sin sesion abierta) el titulo deja de ser un enlace y el boton
 * de salir se pinta deshabilitado: siguen ocupando su sitio, asi que la barra no
 * cambia de forma al entrar o salir, pero no ofrecen acciones que no tienen
 * sentido todavia.
 */
export default function TopBar() {
  const hasSession = useHasSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginScreen = pathname === "/login";
  const canNavigate = hasSession && !isLoginScreen;

  function handleLogout() {
    setToken(null);
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {canNavigate ? (
          <Link
            href="/"
            className="text-sm font-semibold text-slate-900 hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-300"
          >
            FinanceTracker
          </Link>
        ) : (
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            FinanceTracker
          </span>
        )}

        <div className="flex items-center gap-3">
          <CurrentUserEmail />
          <ThemeToggle />
          <HeaderNavLink />
          {canNavigate ? (
            <button
              type="button"
              onClick={handleLogout}
              className={`${actionClasses} cursor-pointer border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800`}
            >
              Salir
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="No hay ninguna sesión abierta"
              className={`${actionClasses} cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600`}
            >
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
