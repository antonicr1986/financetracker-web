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

  "login.subtitle": "Accede para ver tus finanzas",
  "login.email": "Correo electrónico",
  "login.emailPlaceholder": "tu@correo.com",
  "login.password": "Contraseña",
  "login.submit": "Entrar",
  "login.submitting": "Entrando...",
  "login.or": "o",
  "login.demo": "Entrar con la cuenta de demostración",
  "login.noAccount": "¿No tienes cuenta?",
  "login.createOne": "Crear una",
  "login.demoBanner": "Modo demostración:",
  "login.demoBannerBody": "Usa cualquier correo y contraseña.",
  "login.configureApi": "Configura la API aquí",
  "login.connected": "Conectado a la API",
  "login.offline": "Modo demostración sin conexión a API",
  "login.wakingUp": "El servidor estaba en reposo y está despertando. La primera entrada del día puede tardar unos segundos.",

  "register.title": "Crear cuenta",
  "register.subtitle": "Empieza a llevar tus finanzas",
  "register.name": "Nombre",
  "register.namePlaceholder": "Tu nombre",
  "register.passwordPlaceholder": "Mínimo 6 caracteres",
  "register.confirm": "Repite la contraseña",
  "register.submitting": "Creando cuenta...",
  "register.haveAccount": "¿Ya tienes cuenta?",

  "session.expiredTitle": "Tu sesión ha caducado",
  "session.expiredBody": "Vuelve a entrar y te llevamos de nuevo a donde estabas.",

  "errors.fillCredentials": "Introduce tu correo y tu contraseña.",
  "errors.signInFailed": "No se ha podido iniciar sesión.",
  "errors.serverUnreachable": "No se ha podido contactar con el servidor.",
  "errors.fillAll": "Rellena todos los campos.",
  "errors.passwordTooShort": "La contraseña debe tener al menos 6 caracteres.",
  "errors.passwordsDontMatch": "Las dos contraseñas no coinciden.",
  "errors.createAccountFailed": "No se ha podido crear la cuenta.",
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

  "login.subtitle": "Sign in to see your finances",
  "login.email": "Email address",
  "login.emailPlaceholder": "you@email.com",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.submitting": "Signing in...",
  "login.or": "or",
  "login.demo": "Sign in with the demo account",
  "login.noAccount": "Don't have an account?",
  "login.createOne": "Create one",
  "login.demoBanner": "Demo mode:",
  "login.demoBannerBody": "Use any email and password.",
  "login.configureApi": "Set the API up here",
  "login.connected": "Connected to the API",
  "login.offline": "Demo mode, no API connected",
  "login.wakingUp": "The server was idle and is waking up. The first sign-in of the day can take a few seconds.",

  "register.title": "Create account",
  "register.subtitle": "Start tracking your finances",
  "register.name": "Name",
  "register.namePlaceholder": "Your name",
  "register.passwordPlaceholder": "At least 6 characters",
  "register.confirm": "Repeat the password",
  "register.submitting": "Creating account...",
  "register.haveAccount": "Already have an account?",

  "session.expiredTitle": "Your session has expired",
  "session.expiredBody": "Sign in again and we will take you back to where you were.",

  "errors.fillCredentials": "Enter your email and your password.",
  "errors.signInFailed": "Could not sign in.",
  "errors.serverUnreachable": "Could not reach the server.",
  "errors.fillAll": "Fill in every field.",
  "errors.passwordTooShort": "The password must be at least 6 characters long.",
  "errors.passwordsDontMatch": "The two passwords do not match.",
  "errors.createAccountFailed": "Could not create the account.",
};

export const dictionaries: Record<"es" | "en", Record<MessageKey, string>> = {
  es,
  en,
};
