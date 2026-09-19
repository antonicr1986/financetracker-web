# Guía de desarrollo — FinanceTracker Web

Orientación rápida para volver al proyecto sin releer el código. El `README.md`
enseña la aplicación; esto cuenta dónde tocar y qué duele.

## La aplicación en 30 segundos

Next.js 16 (App Router) + TypeScript + Tailwind 4. Sin librerías de gráficos ni
de componentes: todo es CSS.

Casi todo son **componentes de cliente** (`"use client"`), porque la sesión vive
en `localStorage` y solo existe en el navegador. No hay estado global ni store:

```
page.tsx  ->  getTransactions()  ->  derive.ts  ->  se pinta
```

El panel descarga **una** lista de movimientos y de ahí deriva todo — resumen,
desglose por categoría y evolución mensual — con las funciones puras de
`src/lib/derive.ts`. Por eso las cifras nunca pueden contradecirse entre sí.

**Modo demostración**: si no hay API configurada, `client.ts` devuelve los datos
de `src/lib/mock.ts` en lugar de llamar por red. La aplicación arranca y se ve
entera sin backend.

### Rutas

| URL | Archivo |
|---|---|
| `/` (panel) | `src/app/(app)/page.tsx` |
| `/settings` | `src/app/(app)/settings/page.tsx` |
| `/login` | `src/app/login/page.tsx` |

`(app)` es un grupo de rutas: **no aparece en la URL**. Lo que aporta es su
`layout.tsx`, que llama a `useSessionGuard()` — todo lo que cuelgue de ahí queda
protegido por sesión de forma automática. (Hay una carpeta `src/app/settings`
vacía, resto de una mudanza: la pantalla buena es la de `(app)`.)

A `/settings` **no se llega desde la cabecera a propósito**: es una pantalla
técnica. Se entra escribiendo la URL o desde el aviso de modo demostración, y
`HeaderNavLink` solo pinta el botón de vuelta cuando ya estás dentro.

## Mapa: dónde tocar qué

| Quiero… | Archivo |
|---|---|
| Cambiar el panel | `src/app/(app)/page.tsx` |
| Llamar a un endpoint nuevo | `src/lib/api/client.ts` |
| Cambiar un cálculo (totales, meses, desglose) | `src/lib/derive.ts` |
| Reflejar un cambio de la API | `src/lib/types.ts` (espejo de los DTOs de .NET) |
| Tocar la cabecera | `src/components/TopBar.tsx` + `HeaderNavLink.tsx` |
| Tocar el gráfico | `src/components/MonthlyChart.tsx` |
| Cambiar datos de ejemplo | `src/lib/mock.ts` |
| Tema claro/oscuro | `src/app/theme-script.tsx` + `components/ThemeToggle.tsx` |
| Estilos globales | `src/app/globals.css` |

## Arrancar en local

Node 20 o superior.

```bash
npm install
npm run dev        # http://localhost:3000
```

Sin más, arranca en modo demostración con los datos de `mock.ts`.

**Contra la API**: no hace falta variable de entorno. Se entra en
**Configuración** y se pega la URL, que queda en `localStorage`
(`financetracker.api.url`) y manda sobre la de por defecto. Para apuntar a la
API local: `http://localhost:5279` — recordando añadir ese origen a
`Cors:AllowedOrigins` en el backend.

Para fijarla al compilar, `NEXT_PUBLIC_API_URL` en `.env.local`.

Cuenta de demostración, botón incluido en la pantalla de acceso:
`demo@financetracker.app` / `Demo1234!`.

## Las trampas que más duelen

1. **Nada de `localStorage` leído directamente en un render.** Es la causa de
   los tres errores de hidratación que ya nos comimos: el servidor no tiene
   `localStorage`, pinta una cosa y el cliente pinta otra. Todo pasa por
   `useSyncExternalStore` con instantánea de servidor fija — `useMockMode()`,
   `useHasSession()`, la pantalla de Configuración. Y por eso `isUsingMockData()`
   es una función y no una constante.

   Como corolario: al escribir la sesión hay que avisar. `setToken()` y
   `setUser()` emiten el evento `financetracker:session`, y los hooks se
   suscriben con `subscribeToSession()` (que además escucha `storage`, para las
   otras pestañas). Sin eso, cerrar sesión no refrescaba la cabecera.

2. **El script del tema va fuera del árbol de React.** `theme-script.tsx` se
   inyecta con `useServerInsertedHTML`. Un `<script>` dentro del árbol dispara
   el error de React 19 "Encountered a script tag while rendering React
   component", y `next/script` con `beforeInteractive` **no** lo evita —
   probado. Si no, el tema oscuro parpadea en cada carga.

3. **`NEXT_PUBLIC_API_URL` se incrusta al compilar.** Cambiarla en Vercel no
   sirve de nada por sí sola: hay que volver a desplegar. Y el botón "Redeploy"
   del panel de Vercel **tampoco** vale, porque los despliegues son `prebuilt`.
   Para republicar sin commit: `workflow_dispatch` desde la pestaña Actions.
   El workflow además ignora los cambios en `**.md`, así que un commit que solo
   toque documentación no publica nada.

4. **La lista de movimientos viene paginada.** `GET /api/Transactions` devuelve
   un `PagedResult`, no un array, y `pageSize` está limitado a 100 (pedir más
   responde 400). `getTransactions()` recorre las páginas hasta agotar
   `totalPages`; si algún día hay miles de movimientos, esto habrá que
   replantearlo.

5. **La expiración de sesión solo se detecta al cargar.** `useSessionGuard()`
   mira si hay token al montar el layout. Un 401 en mitad de una petición aún no
   redirige: eso está pendiente, en el manejo de errores de `request()`.
   Detalle completo en `claude/session-expiration-handling.md` del proyecto.

## Antes de pushear

```bash
npm run lint && npm run build
```

El CI corre gitleaks, lint y build, y solo entonces despliega a Vercel. Un push
a `main` publica en producción: `https://financetracker-web-tau.vercel.app`
(ojo, **no** `financetracker-web.vercel.app`, que no existe).

Sin atribución de IA en los commits.
