// ============================================================
// playwright.config.ts — Configuración de Playwright E2E
// Proyecto Chromium, servidor Vite en modo test con MOCKS=true
// ============================================================

import { defineConfig, devices } from "@playwright/test";

const port = process.env.VITE_PORT || "5179";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    locale: "es-ES",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx vite --port ${port} --mode test`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    env: {
      VITE_USE_MOCKS: "true",
    },
    timeout: 120000,
  },
});
