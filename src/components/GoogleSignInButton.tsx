"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Client ID web de Google Cloud. No es secreto: es el mismo que valida la API
 * (Google:ClientId) y el que usa la app Android.
 */
const GOOGLE_CLIENT_ID =
  "718720619866-3n4u7urlbq5im3dqdcov7ad39pcorete.apps.googleusercontent.com";

type GoogleId = {
  initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/**
 * Boton oficial "Continuar con Google" (Google Identity Services). Al elegir
 * la cuenta entrega el ID token a onCredential; validarlo es cosa de la API.
 */
export default function GoogleSignInButton({
  locale,
  onCredential,
}: {
  locale: Locale;
  onCredential: (idToken: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && window.google !== undefined,
  );

  // La ultima version del callback, sin volver a inicializar Google en cada render.
  const callback = useRef(onCredential);
  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const google = window.google;
    if (!loaded || !google || !container.current) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => callback.current(response.credential),
    });
    google.accounts.id.renderButton(container.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: container.current.offsetWidth || 320,
      locale,
    });
  }, [loaded, locale]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <div ref={container} className="mt-4 flex w-full justify-center" />
    </>
  );
}
