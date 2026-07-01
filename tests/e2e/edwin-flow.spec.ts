import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Edwin Flores E2E Flow", () => {
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test.beforeEach(async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });
    await loginAs(page, "ejuniorfloress@gmail.com", "EdwinFlores123?");
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));
  });

  test("should show dashboard with stats and sidebar", async ({ page }) => {
    await expect(page.locator("h1", { hasText: "Edwin" }).first()).toBeVisible({ timeout: 10000 });

    const statsContainer = page.locator(".grid-cols-3");
    await expect(
      statsContainer.locator("div.glass", { hasText: "Nivel" }).locator(".text-xl"),
    ).toContainText("Elite");
    await expect(
      statsContainer.locator("div.glass", { hasText: "Trust" }).locator(".text-xl"),
    ).toContainText("99%");
    await expect(
      statsContainer.locator("div.glass", { hasText: "Partidos" }).locator(".text-xl"),
    ).toContainText("15");

    const sidebarName = page.locator("aside .bg-gradient-card .text-sm.font-semibold");
    await expect(sidebarName).toContainText("Edwin Flores");
    const sidebarBalance = page.locator("aside .bg-gradient-card a[href='/app/wallet']");
    await expect(sidebarBalance).toContainText("3500 FC");
  });

  test("should send a chat message", async ({ page }) => {
    await page.goto(`${targetURL}/app/chat`);

    const chatsList = page.locator(
      'button:has-text("Fabiola"), button:has-text("Pichanga Jueves")',
    );
    await expect(chatsList).toHaveCount(2);

    await page.click('button:has-text("Fabiola")');
    const chatInput = page.locator('input[placeholder="Escribe un mensaje..."]');
    await chatInput.fill("Hola Fabiola, nos vemos mañana!");
    await page.keyboard.press("Enter");

    await expect(
      page.locator(".rounded-2xl", { hasText: "Hola Fabiola, nos vemos mañana!" }).first(),
    ).toBeVisible();
  });

  test("should edit profile and persist changes", async ({ page }) => {
    await page.goto(`${targetURL}/app/profile`);

    await expect(page.locator("h2")).toContainText("Edwin Flores");
    await page.click('button:has-text("Editar")');
    await page.fill('input[placeholder="Tu nombre"]', "Edwin Flores Junior");
    await page.fill('textarea[placeholder="Tu bio"]', "Apasionado del pádel y fútbol.");
    await page.click('button:has-text("Guardar")');

    await expect(page.locator("h2")).toContainText("Edwin Flores Junior");
    await expect(page.locator('p:has-text("Apasionado del pádel y fútbol.")')).toBeVisible();

    await page.reload();
    await expect(page.locator("h2")).toContainText("Edwin Flores Junior");
    await expect(page.locator('p:has-text("Apasionado del pádel y fútbol.")')).toBeVisible();
  });

  test("should redeem FitCoins and verify wallet history", async ({ page }) => {
    await page.goto(`${targetURL}/app/wallet`);

    const walletBalance = page.locator(".text-6xl.font-extrabold");
    await expect(walletBalance).toContainText("3500");

    const officialBallCard = page.locator("div.bg-gradient-card", { hasText: "Pelota oficial" });
    await officialBallCard.locator("button").click();

    await expect(page.locator("h2", { hasText: "Canjear Pelota oficial" })).toBeVisible();
    await page.click('button:has-text("Confirmar Canje")');

    await expect(page.locator("text=¡Canje exitoso!")).toBeVisible();
    await expect(walletBalance).toContainText("2700");

    await page.goto(`${targetURL}/app/wallet/history`);
    await page.waitForSelector("text=Historial de Transacciones");
    await expect(page.locator("text=Canje: Pelota oficial")).toBeVisible();
    await expect(page.locator("text=-800 FC")).toBeVisible();
  });
});
