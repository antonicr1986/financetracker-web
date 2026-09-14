"use client";

import { useServerInsertedHTML } from "next/navigation";

// Se ejecuta antes de pintar, para que la pagina no parpadee en blanco
// cuando el usuario tiene el tema oscuro guardado.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

/**
 * Inyecta el script del tema en el HTML del servidor pero FUERA del arbol de
 * React. Un <script> dentro del arbol hace que React 19 avise de que no lo
 * ejecutara al renderizar en cliente; con useServerInsertedHTML se cuela en el
 * stream de SSR y sigue bloqueando antes del primer pintado.
 */
export default function ThemeScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  ));

  return null;
}
