import type { NextConfig } from "next";
import packageJson from "./package.json";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy: que puede cargar y desde donde.
 *
 * - script-src: 'unsafe-inline' es necesario porque Next.js inyecta scripts
 *   inline para hidratar la pagina, y tambien lo es el script del tema (ver
 *   theme-script.tsx). La alternativa es un nonce por peticion, que obliga a
 *   renderizar todo de forma dinamica. Aun asi la politica bloquea cualquier
 *   script de otro dominio. En desarrollo hace falta ademas 'unsafe-eval'
 *   (recarga en caliente) y el script de depuracion de Vercel Analytics.
 * - connect-src: en produccion, solo la propia web, la API (NEXT_PUBLIC_API_URL,
 *   que alli no se puede cambiar desde Configuracion) y Google. El token va en
 *   localStorage: si algun dia hubiera un XSS, el navegador no le dejaria
 *   mandarlo a un servidor ajeno. En desarrollo la URL de la API se puede
 *   cambiar en Configuracion, asi que ahi se permite cualquier https y localhost.
 * - frame-ancestors 'none': nadie puede meter la web en un iframe (clickjacking).
 */
const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : null;
  } catch {
    return null;
  }
})();

const connectSrc = isDev
  ? "'self' https: http://localhost:* http://127.0.0.1:*"
  : ["'self'", apiOrigin, "https://accounts.google.com/gsi/"].filter(Boolean).join(" ");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  // El boton y la ventana de "Continuar con Google" se cargan en un iframe suyo.
  "frame-src https://accounts.google.com/gsi/",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/**
 * Cabeceras de seguridad en todas las respuestas. Salen del informe de OWASP
 * ZAP (job dast del CI). HSTS no hace falta: ya la pone Vercel.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Anti-clickjacking para navegadores antiguos (los nuevos usan frame-ancestors).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // same-origin-allow-popups y no same-origin: la ventana de Google tiene que
  // poder devolver la cuenta elegida a esta pagina.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  // Version de la web, la de package.json: cada pestana la lleva desde que se
  // cargo y el cliente la envia a la API (X-Client-Version). Se sube solo antes
  // de activar un cambio que rompa versiones antiguas.
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
