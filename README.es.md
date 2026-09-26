# 📊 FinanceTracker Web

[English](README.md) · **Español**

![CI](https://img.shields.io/github/actions/workflow/status/antonicr1986/financetracker-web/ci.yml?branch=main&style=for-the-badge&label=CI%2FCD&logo=githubactions&logoColor=white)
[![Demo](https://img.shields.io/badge/demo-online-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://financetracker-web-tau.vercel.app/login)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

Interfaz web de [FinanceTracker](https://github.com/antonicr1986/FinanceTracker),
una API REST de finanzas personales construida con .NET 8.

**Es uno de los tres clientes de esa API**, junto a
[financetracker-android](https://github.com/antonicr1986/financetracker-android)
(Kotlin) y [financetracker-desktop](https://github.com/antonicr1986/financetracker-desktop)
(C# y WPF). Los tres llegan a los mismos endpoints, codigos de error y reglas de
negocio desde plataformas distintas, y comparten estetica, idiomas y cuenta de
demostracion.

**[Ver la aplicacion desplegada](https://financetracker-web-tau.vercel.app/login)** — entra con un clic
usando la cuenta de demostracion.

## 🚧 Estado

Funcionando de punta a punta contra la API real: registro y acceso con JWT,
datos desde Azure SQL y el panel calculado a partir de ellos.

Hay una **cuenta de demostracion publica**. El boton de la pantalla de acceso
entra con ella y carga datos sembrados por el backend, asi que se puede ver la
aplicacion sin registrarse.

Si no hay ninguna API configurada, la interfaz cae en datos de ejemplo en lugar
de romperse. Eso permite levantarla sin backend.

## ✨ Que hace

- **Registro y acceso** con JWT. Al registrarse se siembran categorias de
  partida en el idioma de la interfaz, para poder anotar el primer movimiento sin configurar nada antes.
- **Panel mensual** con totales, evolucion a lo largo del ano, desglose por
  categoria y tabla de movimientos. Cada bloque se pliega y, plegado, resume su
  contenido en una linea.
- **Alta, edicion y borrado de movimientos** en un dialogo, con las categorias
  filtradas segun el tipo: la API rechaza un gasto con categoria de ingresos,
  asi que ni se ofrece. El borrado pide confirmacion en el propio dialogo.
- **Presupuestos mensuales**, por categoria o para un tipo entero, con barra de
  progreso y lo que queda. Lo gastado, el resto y el porcentaje los calcula la
  API; no se derivan en el navegador.
- **Gestion de categorias** desde el panel: crear, renombrar y borrar, agrupadas
  por tipo. La API se niega a borrar una categoria que todavia tiene
  movimientos, y ese motivo le llega al usuario en su idioma.
- **Filtros** por concepto, tipo y categoria, resueltos en cliente sobre los
  datos ya cargados.
- **Espanol e ingles**, conmutables desde la cabecera. No solo los textos:
  tambien las fechas, los importes y los nombres de los meses siguen al idioma.
- **Tema claro y oscuro**, sin parpadeo al cargar.

## 🖼️ Vista previa

El panel, en tema claro y oscuro: los totales del mes, los presupuestos con lo
que llevas gastado de cada uno, y la evolucion a lo largo del ano.

![Panel en tema claro](screenshots/dashboard-light.png)
![Panel en tema oscuro](screenshots/dashboard-dark.png)

Cada bloque se pliega y, plegado, se resume en una linea: el saldo, cuantos
presupuestos van dentro del limite, el rango de meses, la categoria de mayor
gasto y el numero de movimientos. El mes entero de un vistazo.

![Panel con los bloques plegados](screenshots/main-collapsed.png)

El desglose por categoria y la tabla de movimientos, con los filtros por
concepto, tipo y categoria.

![Desglose y movimientos](screenshots/dashboard-transactions.png)

El alta de un movimiento, en un dialogo nativo.

![Alta de un movimiento](screenshots/new-transaction.png)

La pantalla de acceso, con entrada directa a la cuenta de demostracion.

![Pantalla de acceso](screenshots/login.png)

## 🧰 Stack

- **Next.js 16** con App Router
- **TypeScript**
- **Tailwind CSS 4**
- Desplegado en **Vercel** desde el pipeline, solo cuando los controles pasan
  (ver [Automatizacion](#-automatizacion))

Sin librerias de graficos ni de componentes. El desglose por categorias esta
resuelto con CSS: cargar una dependencia entera para cinco barras
horizontales no compensa.

## ⚙️ Ejecutar en local

Requiere Node 22 o superior.

    npm install
    npm run dev

La aplicacion queda en http://localhost:3000.

Otros comandos:

    npm run build      # compilacion de produccion
    npm run lint       # analisis estatico con ESLint
    npm test           # pruebas unitarias y de componentes
    npm run test:watch # las mismas, repitiendose a cada cambio

## 📁 Estructura del proyecto

    src/
      app/          Rutas y paginas (App Router)
      components/   Cabecera, grafica, dialogos y piezas reutilizables
      lib/
        api/        Cliente HTTP, sesion y modo demostracion
        i18n/       Diccionarios, idioma activo y formatos por idioma
        derive.ts   Totales, series y agrupaciones a partir de los movimientos
        filters.ts  Los filtros del panel: buscador, tipo y categoria
        types.ts    Tipos que reflejan los DTOs de la API
        mock.ts     Datos de ejemplo para cuando no hay API configurada
      test/         Preparacion de las pruebas (jsdom, limpieza, parche de <dialog>)

Las pruebas viven junto al fichero que cubren, como `*.test.ts` / `*.test.tsx`.

## 🌍 Idiomas

Los textos viven en `src/lib/i18n/messages.ts`, en dos diccionarios planos. El
ingles se declara como `Record<MessageKey, string>`, de modo que **anadir una
clave sin traducirla rompe la compilacion**: es la forma barata de que las dos
versiones no se separen.

El idioma se guarda en el navegador y, si no hay nada guardado, se deduce del
propio navegador. Los importes y las fechas se formatean con `Intl` segun el
idioma activo, asi que en espanol se lee `1.234,56 €` y en ingles `€1,234.56`.

Los mensajes de error no viajan como frases: la API devuelve un codigo
(`email_already_exists`, `category_type_mismatch`...) y es el frontend quien
decide que se lee y en que idioma.

## 🔌 Conexion con la API

La URL de la API se resuelve en este orden: lo que el usuario haya guardado en
la pantalla de Configuracion y, si no hay nada, la variable de entorno
`NEXT_PUBLIC_API_URL`. Si tampoco esta, se usan los datos de ejemplo.

`NEXT_PUBLIC_*` se incrusta al compilar, no se lee al arrancar: cambiarla en
Vercel exige volver a desplegar para que surta efecto.

## 🧪 Pruebas

Vitest y Testing Library, con `npm test` y tambien dentro del pipeline.

Son de dos tipos. `derive.test.ts` y `filters.test.ts` cubren las funciones
puras sobre las que se construye el panel: totales, agrupacion por mes, desglose
por categoria, etiquetas de los meses que siguen al idioma elegido, y los
filtros — el buscador sin distinguir mayusculas ni espacios de los extremos,
tipo y categoria (incluidos los movimientos sin categoria) combinados, nombres
de categoria ordenados segun el idioma para que uno con tilde no acabe al final,
y una categoria elegida que el mes que se ve no tiene, que vuelve a "todas" y
reaparece sola al volver a un mes que si la tiene. Los filtros viven en
`lib/filters.ts` y no dentro de la pagina precisamente para poder probarlos
asi, sin React de por medio. `TransactionDialog.test.tsx`
renderiza el dialogo con las llamadas a la API sustituidas y cubre lo que de
verdad se rompio durante el desarrollo: que al editar los campos arrancan
rellenos, que cambiar el tipo limpia la categoria elegida, que el borrado espera
a la confirmacion, y que pulsar Enter en el campo de categoria nueva la crea en
lugar de enviar el movimiento.

Dos decisiones que conviene dejar dichas. Las comprobaciones leen los textos del
diccionario espanol en vez de escribirlos a mano, asi que prueban comportamiento
y sobreviven a un cambio de redaccion. Y jsdom no implementa `<dialog>` de forma
fiable, de modo que el fichero de preparacion suple `showModal()` y `close()`:
se parchea el entorno en lugar de deformar el componente para hacerlo testeable,
porque los dialogos nativos son aqui una decision deliberada.

## 🔄 Automatizacion

- **CI** en cada push y pull request: instala dependencias, pasa el linter,
  ejecuta las pruebas y compila para produccion, de modo que un error de tipos,
  de pruebas o de compilacion se detecta antes de llegar a produccion.
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

## 🗺️ Proximos pasos

- Mensajes de validacion traducidos (los que genera ASP.NET siguen en ingles)

## ✍️ Autor

Antonio Company - [GitHub](https://github.com/antonicr1986) ·
[LinkedIn](https://www.linkedin.com/in/antoniocompany/)
