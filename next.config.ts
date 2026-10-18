import type { NextConfig } from "next";

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
 * - connect-src: la URL de la API es configurable desde Configuracion (puede
 *   ser la de Azure, otra https o http://localhost en local), asi que se
 *   permite cualquier https y localhost en lugar de fijar un unico dominio.
 * - frame-ancestors 'none': nadie puede meter la web en un iframe (clickjacking).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
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
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
