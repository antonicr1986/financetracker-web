/**
 * Diccionarios de la interfaz.
 *
 * Claves planas con puntos en lugar de objetos anidados: se leen igual de bien
 * y evitan tener que recorrer el arbol en tiempo de ejecucion.
 *
 * El diccionario ingles se declara como Record<MessageKey, string>, asi que si
 * alguien anade una clave al espanol y se olvida de traducirla, el proyecto no
 * compila. Es la forma barata de que las dos versiones no se separen.
 */
export const es = {
  "locale.label": "Idioma",
  "locale.es": "Español",
  "locale.en": "Inglés",

  "header.summary": "Resumen",
  "header.settings": "Configuración",
  "header.signIn": "Iniciar sesión",
  "header.signOut": "Salir",
  "header.noSession": "No hay ninguna sesión abierta",

  "theme.toggle": "Cambiar entre tema claro y oscuro",

  "footer.stack": "Next.js y .NET 8",
  "footer.apiDocs": "Documentación de la API",
  "footer.frontendCode": "Código del frontend",
  "footer.apiCode": "Código de la API",
};

export type MessageKey = keyof typeof es;

// Record<MessageKey, string> obliga a que esten todas las claves y ninguna de
// mas. Sin `as const` los valores son `string`, no literales, asi que la
// traduccion puede decir otra cosa — que es justo lo que se espera de ella.
export const en: Record<MessageKey, string> = {
  "locale.label": "Language",
  "locale.es": "Spanish",
  "locale.en": "English",

  "header.summary": "Summary",
  "header.settings": "Settings",
  "header.signIn": "Sign in",
  "header.signOut": "Sign out",
  "header.noSession": "There is no open session",

  "theme.toggle": "Switch between light and dark theme",

  "footer.stack": "Next.js and .NET 8",
  "footer.apiDocs": "API documentation",
  "footer.frontendCode": "Frontend source",
  "footer.apiCode": "API source",
};

export const dictionaries: Record<"es" | "en", Record<MessageKey, string>> = {
  es,
  en,
};
