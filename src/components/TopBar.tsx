"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import CurrentUserEmail from "@/components/CurrentUserEmail";
import HeaderNavLink from "@/components/HeaderNavLink";
import { setToken, setUser } from "@/lib/api/client";
import { useHasSession } from "@/lib/useSession";
import LocaleToggle from "@/components/LocaleToggle";
import StableLabel from "@/components/StableLabel";
import { useT } from "@/lib/i18n/useT";

// En el movil, "Salir" es un icono cuadrado como el del tema; desde sm, texto.
const actionClasses =
  "shrink-0 whitespace-nowrap rounded-lg border p-1.5 text-sm font-medium transition sm:px-3";

const brandClasses =
  "flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100";

/**
 * Logo + nombre, igual que en la app de escritorio. El logo es decorativo: el
 * texto ya da el nombre. En el movil el nombre no cabe junto a los botones:
 * se queda solo el logo, y el texto sigue ahi para los lectores de pantalla.
 */
function Brand() {
  return (
    <>
      <Image src="/logo.svg" alt="" width={24} height={24} priority />
      <span className="sr-only sm:not-sr-only">FinanceTracker</span>
    </>
  );
}

/** Icono de salir en el movil, texto desde sm. */
function SignOutContent() {
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 sm:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      <span className="sr-only sm:not-sr-only">
        <StableLabel messageKey="header.signOut" />
      </span>
    </>
  );
}

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
  const t = useT();
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
            className={`${brandClasses} hover:text-slate-600 dark:hover:text-slate-300`}
          >
            <Brand />
          </Link>
        ) : (
          <span className={brandClasses}>
            <Brand />
          </span>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <CurrentUserEmail />
          <LocaleToggle />
          <ThemeToggle />
          <HeaderNavLink />
          {canNavigate ? (
            <button
              type="button"
              onClick={handleLogout}
              className={`${actionClasses} cursor-pointer border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800`}
            >
              <SignOutContent />
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={t("header.noSession")}
              className={`${actionClasses} cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600`}
            >
              <SignOutContent />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
