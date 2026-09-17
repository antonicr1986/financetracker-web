"use client";

import { useSyncExternalStore } from "react";
import { getStoredUserRaw, subscribeToSession } from "@/lib/api/client";
import type { UserDto } from "@/lib/types";

/**
 * Correo de la sesion actual. En el servidor no hay localStorage, asi que la
 * instantanea de servidor es null y no se pinta nada: el primer render del
 * cliente coincide con el HTML y no se rompe la hidratacion.
 */
export default function CurrentUserEmail() {
  const raw = useSyncExternalStore(subscribeToSession, getStoredUserRaw, () => null);

  if (!raw) return null;

  let user: UserDto;
  try {
    user = JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }

  if (!user?.email) return null;

  return (
    <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">
      {user.email}
    </span>
  );
}
