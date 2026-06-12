// ============================================================
// edwin-flow.spec.ts — E2E: Flujo de usuario Edwin Flores
// Verifica registro, matchmaking y actividades del perfil demo
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Edwin Flores E2E Flow", () => {
  // Use the port where Vite is running. We read from baseURL if set, otherwise fallback to http://localhost:5179
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test("should authenticate Edwin Flores, verify dynamic bindings, chat list, profile editing, and fitcoin redemption", async ({
    page,
  }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    // 1. Go to login page
    await page.goto(`${targetURL}/login`);
    await expect(page.locator("h1").first()).toContainText("Iniciar Sesión");

    // 2. Perform Edwin Flores Login
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');

    // Debug URL and console errors
    await page.waitForTimeout(1000);
    console.log("DEBUG: Current URL after submit:", page.url());
    console.log("DEBUG: Console errors:", consoleErrors);

    // 3. Verify redirection to Dashboard
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));

    // 4. Verify Welcome Message says "Edwin"
    await expect(page.locator("h1", { hasText: "Edwin" }).first()).toBeVisible({ timeout: 10000 });

    // 5. Verify the Level displays "Elite"
    const statsContainer = page.locator(".grid-cols-3");
    const levelStat = statsContainer.locator("div.glass", { hasText: "Nivel" }).locator(".text-xl");
    await expect(levelStat).toContainText("Elite");

    // 6. Verify trust score is "99%"
    const trustStat = statsContainer.locator("div.glass", { hasText: "Trust" }).locator(".text-xl");
    await expect(trustStat).toContainText("99%");

    // 7. Verify matches count displays "15" (Edwin's matches_played) instead of hardcoded 12
    const matchesStat = statsContainer
      .locator("div.glass", { hasText: "Partidos" })
      .locator(".text-xl");
    await expect(matchesStat).toContainText("15");

    // 8. Verify the sidebar user card shows "Edwin Flores" and "3500 FC"
    const sidebarName = page.locator("aside .bg-gradient-card .text-sm.font-semibold");
    await expect(sidebarName).toContainText("Edwin Flores");
    const sidebarBalance = page.locator("aside .bg-gradient-card a[href='/app/wallet']");
    await expect(sidebarBalance).toContainText("3500 FC");

    // 9. Navigate to Chat and check Fabiola and Pichanga Jueves chats are present
    await page.goto(`${targetURL}/app/chat`);
    await page.waitForTimeout(500); // Wait for store initialization/mount

    const chatsList = page.locator(
      'button:has-text("Fabiola"), button:has-text("Pichanga Jueves")',
    );
    await expect(chatsList).toHaveCount(2);

    // 10. Click Fabiola conversation and send a message
    await page.click('button:has-text("Fabiola")');
    const chatInput = page.locator('input[placeholder="Escribe un mensaje..."]');
    await chatInput.fill("Hola Fabiola, nos vemos mañana!");
    await page.keyboard.press("Enter");

    // Verify sent message is in the message list
    await expect(
      page.locator(".rounded-2xl", { hasText: "Hola Fabiola, nos vemos mañana!" }).first(),
    ).toBeVisible();

    // 11. Navigate to Profile
    await page.goto(`${targetURL}/app/profile`);

    // Verify initial profile values
    await expect(page.locator("h2")).toContainText("Edwin Flores");
    await expect(page.locator('p:has-text("29 años")')).toContainText("Surco");
    await expect(page.locator('p:has-text("Usuario Maestro Edwin.")')).toBeVisible();

    // 12. Edit Profile
    await page.click('button:has-text("Editar")');
    await page.fill('input[placeholder="Tu nombre"]', "Edwin Flores Junior");
    await page.fill('textarea[placeholder="Tu bio"]', "Apasionado del pádel y fútbol.");
    await page.click('button:has-text("Guardar")');

    // Verify profile updated dynamically
    await expect(page.locator("h2")).toContainText("Edwin Flores Junior");
    await expect(page.locator('p:has-text("Apasionado del pádel y fútbol.")')).toBeVisible();

    // Verify sidebar updated reactively to "Edwin Flores Junior"
    await expect(sidebarName).toContainText("Edwin Flores Junior");

    // 13. Redeem Prize from FitCoins Section
    await page.goto(`${targetURL}/app/wallet`);
    console.log("DEBUG: URL before wallet assertion:", page.url());
    const walletBalance = page.locator(".text-6xl.font-extrabold");
    await expect(walletBalance).toContainText("3500");

    // Find official ball reward (cost 800 FC) and redeem
    const officialBallCard = page.locator("div.bg-gradient-card", { hasText: "Pelota oficial" });
    await officialBallCard.locator("button").click();

    // Verify modal appears and confirm
    await expect(page.locator("h2", { hasText: "Canjear Pelota oficial" })).toBeVisible();
    await page.click('button:has-text("Confirmar Canje")');

    // Verify success toast and balance reduction to 2700
    await expect(page.locator("text=¡Canje exitoso!")).toBeVisible();
    await expect(walletBalance).toContainText("2700");
    await expect(sidebarBalance).toContainText("2700 FC");

    // 14. Verify Wallet History displays the REDEEM transaction
    await page.goto(`${targetURL}/app/wallet/history`);
    await page.waitForSelector("text=Historial de Transacciones");

    await expect(page.locator("text=Canje: Pelota oficial")).toBeVisible();
    await expect(page.locator("text=-800 FC")).toBeVisible();

    // 15. Reload Page and Verify State Survival (F5 Persistence Check)
    await page.reload();
    await page.waitForTimeout(1000); // Wait for store hydration

    // Verify user is still authenticated and data is retained in sidebar
    await expect(sidebarName).toContainText("Edwin Flores Junior");
    await expect(sidebarBalance).toContainText("2700 FC");

    // Go back to profile to verify profile edits survived reload
    await page.goto(`${targetURL}/app/profile`);
    await page.waitForTimeout(500);
    await expect(page.locator("h2")).toContainText("Edwin Flores Junior");
    await expect(page.locator('p:has-text("Apasionado del pádel y fútbol.")')).toBeVisible();

    // Go back to chat to verify message history survived reload
    await page.goto(`${targetURL}/app/chat`);
    await page.waitForTimeout(500);
    await page.click('button:has-text("Fabiola")');
    await expect(
      page.locator(".rounded-2xl", { hasText: "Hola Fabiola, nos vemos mañana!" }).first(),
    ).toBeVisible();

    // Ensure no client-side runtime crashes
    expect(consoleErrors).toEqual([]);
  });
});
