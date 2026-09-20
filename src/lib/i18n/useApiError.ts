"use client";

import { useCallback } from "react";
import { ApiError } from "@/lib/api/client";
import { useT } from "./useT";
import type { MessageKey } from "./messages";

/** Codigos que la API identifica y que sabemos traducir. */
const SERVER_CODES = new Set([
  "email_already_exists",
  "invalid_credentials",
  "category_not_found",
  "category_type_mismatch",
  "category_has_transactions",
  "demo_read_only",
]);

/**
 * Convierte cualquier error en un texto para el usuario, en su idioma.
 *
 * Orden de preferencia: el codigo concreto de la API, luego el generico del
 * cliente, y si no es un ApiError, el respaldo que indique quien llama. Un
 * codigo del servidor que no conozcamos se ignora: es preferible un mensaje
 * generico traducido a una cadena tecnica en el idioma equivocado.
 */
export function useApiErrorMessage() {
  const t = useT();

  return useCallback(
    (cause: unknown, fallback: MessageKey) => {
      if (cause instanceof ApiError) {
        if (cause.serverCode && SERVER_CODES.has(cause.serverCode)) {
          return t(`apiError.${cause.serverCode}` as MessageKey);
        }

        return t(`apiError.${cause.code}` as MessageKey);
      }

      return t(fallback);
    },
    [t],
  );
}
