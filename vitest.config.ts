// ============================================================
// vitest.config.ts — Configuración de Vitest
// Entorno jsdom, alias @, setup global y patrón de tests
// ============================================================

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/__tests__/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
