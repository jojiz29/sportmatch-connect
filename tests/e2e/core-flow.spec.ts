import { test, expect } from "@playwright/test";

test.describe("Core User Flow (Happy Path)", () => {
  test("should login, view map, and go to matchmaking", async ({ page }) => {
    // 1. Ir a login
    await page.goto("http://localhost:5173/login");
    await expect(page.locator("h1")).toContainText("Iniciar Sesión");

    // 2. Hacer login
    await page.fill('input[type="email"]', "test@test.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // 3. Verifica redirección a Matchmaking
    await expect(page).toHaveURL(/.*\/app\/match/);
    await expect(page.locator("h1")).toContainText("Matchmaking IA");

    // 4. Navegar a mapa usando el menú (asumiendo que existe el sidebar)
    await page.goto("http://localhost:5173/app/map");
    await expect(page.locator("h1")).toContainText("Mapa en vivo");

    // Verifica que el mapa cargó algo (el canvas de leaflet)
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 10000 });
  });
});
