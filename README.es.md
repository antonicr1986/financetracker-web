# FinanceTracker Web

[English](README.md) · **Español**

Interfaz web de [FinanceTracker](https://github.com/antonicr1986/FinanceTracker),
una API REST de finanzas personales construida con .NET 8.

**[Ver la aplicacion desplegada](https://financetracker-web.vercel.app)**

## Estado

En construccion. El dashboard esta terminado visualmente, pero todavia
funciona con datos de ejemplo tipados: aun no consume la API real.

Es una decision deliberada. Los tipos de `src/lib/types.ts` son un espejo de
los DTOs de la API, asi que conectar el backend cuando este desplegado supone
sustituir la capa de datos sin tocar ni un componente.

## Stack

- **Next.js 16** con App Router
- **TypeScript**
- **Tailwind CSS 4**
- Desplegado en **Vercel**, con despliegue automatico en cada push a `main`

Sin librerias de graficos ni de componentes. El desglose por categorias esta
resuelto con CSS: cargar una dependencia entera para cinco barras
horizontales no compensa.

## Ejecutar en local

Requiere Node 20 o superior.

    npm install
    npm run dev

La aplicacion queda en http://localhost:3000.

Otros comandos:

    npm run build    # compilacion de produccion
    npm run lint     # analisis estatico con ESLint

## Estructura del proyecto

    src/
      app/          Rutas y paginas (App Router)
      lib/
        types.ts    Tipos que reflejan los DTOs de la API
        mock.ts     Datos de ejemplo mientras no hay backend

## Automatizacion

- **CI** en cada push y pull request: instala dependencias, pasa el linter y
  compila para produccion, de modo que un error de tipos o de compilacion se
  detecta antes de llegar a produccion.
- **Escaneo de secretos** con gitleaks sobre el historial completo.
- **Rama `main` protegida** frente a *force push* y borrado.
- **Despliegue desde el pipeline**: la publicacion en produccion es un job final
  que solo arranca cuando el escaneo de secretos y la compilacion estan en
  verde. El despliegue automatico de Vercel esta desactivado, asi que nada llega
  a produccion sin pasar antes por los controles.

Meter el despliegue dentro del pipeline tiene un coste: las pull requests ya no
reciben URL de vista previa automatica de Vercel. Compensa. Antes, los dos
sistemas escuchaban el mismo push por separado y Vercel solia terminar primero,
de modo que un pipeline en rojo no impedia publicar: los controles opinaban
sobre codigo que ya estaba en produccion.

## Proximos pasos

- Autenticacion con JWT contra la API
- Datos reales en lugar de datos de ejemplo
- CRUD completo de transacciones, categorias y presupuestos

## Autor

Antonio Company - [GitHub](https://github.com/antonicr1986) ·
[LinkedIn](https://www.linkedin.com/in/antoniocompany/)
