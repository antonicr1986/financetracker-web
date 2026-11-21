import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest corre fuera de Next, asi que hay que darle dos cosas que en la
 * aplicacion vienen de serie: el transformador de JSX y el alias "@".
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // npm run test:coverage (el CI): % de lineas cubiertas por los tests en todo
    // src/, paginas incluidas. Fuera solo lo que no tiene logica: los layouts
    // (envuelven la pagina) y el script del tema. Falla si baja del minimo: la
    // cobertura medida al activarla menos 5 puntos, redondeada a multiplo de 5.
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/app/**/layout.tsx",
        "src/app/theme-script.tsx",
      ],
      reporter: ["text-summary", "json-summary"],
      thresholds: { lines: 35 },
    },
  },
});
