// ============================================================
// vitest.config.ts — Configuración de Vitest
// Entorno jsdom, alias @, setup global y patrón de tests
// ============================================================

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/__tests__/*.test.{ts,tsx}"],
    pool: "threads",
    threads: {
      singleThread: true,
    },
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "clover"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
