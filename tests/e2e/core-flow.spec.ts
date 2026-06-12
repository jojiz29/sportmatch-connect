// ============================================================
// core-flow.spec.ts — E2E: Flujo principal del usuario (Happy Path)
// Verifica login, dashboard, matchmaking y perfil
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Core User Flow (Happy Path)", () => {
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test("should login, view map, and go to matchmaking", async ({ page }) => {
    // 1. Ir a login
    await page.goto(`${targetURL}/login`);
    await expect(page.locator("h1")).toContainText("Iniciar Sesión");

    // 2. Hacer login
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');

    // 3. Verifica redirección a Dashboard
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));

    // Ir a Matchmaking
    await page.goto(`${targetURL}/app/match`);
    await expect(page.locator("h1")).toContainText("Matchmaking IA");

    // 4. Navegar a mapa usando el menú (asumiendo que existe el sidebar)
    await page.goto(`${targetURL}/app/map`);
    // Verifica que el mapa cargó algo (el canvas de leaflet)
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Mapa Comercial");
  });
});
