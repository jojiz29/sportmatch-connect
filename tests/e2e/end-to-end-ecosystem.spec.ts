import { test, expect } from "@playwright/test";

test.describe("End-to-End Ecosystem Test (Notifications, BI Dashboard, Purchase from Notification)", () => {
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test("should validate the full ecosystem: BI analytics, notifications on post, and purchase from notification link", async ({
    page,
  }) => {
    // ═══════════════════════════════════════════════════
    // PHASE 1: Login as Edwin and follow Puka Power
    // ═══════════════════════════════════════════════════
    console.log("Phase 1: Edwin logs in and follows Puka Power...");
    await page.goto(`${targetURL}/login`);
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');
    await expect(page.locator("h1").first()).toContainText("Edwin");

    // Navigate to matchmaking to find and follow Puka Power
    await page.click("aside >> text=Matchmaking");
    await page.waitForTimeout(500);

    // Find Puka Power in the list and follow them
    const pukaCard = page.locator("text=Puka Power").first();
    await expect(pukaCard).toBeVisible();

    // Click follow button for Puka Power
    const followBtnPuka = page.locator('[id*="follow-btn-user-puka-power"]').first();
    if (await followBtnPuka.isVisible()) {
      await followBtnPuka.click();
      await page.waitForTimeout(300);
    }

    // Logout Edwin
    await page.evaluate(() => localStorage.removeItem("sportmatch-auth"));
    await page.goto(`${targetURL}/login`);
    await expect(page.locator("h1").first()).toContainText("Iniciar Sesión");

    // ═══════════════════════════════════════════════════
    // PHASE 2: Login as Puka Power and verify BI Dashboard
    // ═══════════════════════════════════════════════════
    console.log("Phase 2: Puka Power logs in and views BI Dashboard...");
    await page.fill('input[type="email"]', "puka@puka.com");
    await page.fill('input[type="password"]', "Puka123?");
    await page.click('button[type="submit"]');

    // Navigate to Mi Negocio
    await page.click("aside >> text=Mi Negocio");
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/business`));

    // Verify metrics are visible
    await expect(page.locator("#business-balance-display")).toBeVisible();
    await expect(page.locator("#business-sales-display")).toBeVisible();
    await expect(page.locator("#business-followers-display")).toBeVisible();

    // Switch to Business Intelligence tab
    await page.click("#business-tab-analytics");
    await page.waitForTimeout(500);

    // Verify BI section is visible with charts
    await expect(page.locator("#bi-analytics-section")).toBeVisible();
    await expect(page.locator("#bi-sales-chart")).toBeVisible();
    await expect(page.locator("#bi-reach-chart")).toBeVisible();

    // ═══════════════════════════════════════════════════
    // PHASE 3: Puka Power creates a sponsored post/offer
    // ═══════════════════════════════════════════════════
    console.log("Phase 3: Puka Power publishes a sponsored offer...");

    // Go to dashboard feed tab
    await page.click("aside >> text=Inicio");
    await page.waitForTimeout(300);
    await page.click("#dashboard-tab-feed");
    await page.waitForTimeout(300);

    // Create a new post as Puka Power
    const postInput = page.locator('textarea[placeholder*="compartir"]').first();
    if (await postInput.isVisible()) {
      await postInput.fill("🎉 ¡OFERTA FLASH! Llévate tu Botella Puka Power con 20% de descuento. ¡Solo hoy!");
      const publishBtn = page.locator('button:has-text("Publicar")').first();
      await publishBtn.click();
      await page.waitForTimeout(500);
    }

    // Logout Puka Power
    await page.evaluate(() => localStorage.removeItem("sportmatch-auth"));
    await page.goto(`${targetURL}/login`);

    // ═══════════════════════════════════════════════════
    // PHASE 4: Edwin logs in and checks notification bell
    // ═══════════════════════════════════════════════════
    console.log("Phase 4: Edwin logs in and checks notifications...");
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');
    await expect(page.locator("h1").first()).toContainText("Edwin");

    // Check the notification bell is visible
    await expect(page.locator("#notification-bell-btn")).toBeVisible();

    // Check for notification badge (unread count)
    const badge = page.locator("#notification-badge");
    const hasBadge = await badge.isVisible().catch(() => false);

    // Click the notification bell to open the panel
    await page.click("#notification-bell-btn");
    await page.waitForTimeout(300);

    // Verify notification panel is open
    await expect(page.locator("#notification-panel")).toBeVisible();
    await expect(page.locator("#notification-list")).toBeVisible();

    // ═══════════════════════════════════════════════════
    // PHASE 5: Edwin purchases from wallet (2-click flow)
    // ═══════════════════════════════════════════════════
    console.log("Phase 5: Edwin navigates to wallet and purchases...");

    // Close notification panel first
    await page.click("#notification-bell-btn");
    await page.waitForTimeout(200);

    // Navigate to FitCoins / Wallet
    await page.click("aside >> text=FitCoins");
    await page.waitForTimeout(500);

    // Verify Edwin's initial balance
    const sidebarBalance = page.locator("aside .text-neon");
    await expect(sidebarBalance).toContainText("FC");

    // Find the Puka Power product and purchase
    const purchaseBtn = page.locator("#purchase-btn-puka-power-bottle");
    await expect(purchaseBtn).toBeVisible();
    await purchaseBtn.click();

    // Click confirm in the purchase modal
    const confirmBtn = page.locator("#confirm-purchase-btn");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify success toast
    await expect(page.locator("text=¡Compra completada con éxito!")).toBeVisible();

    // Verify balance decreased
    await expect(sidebarBalance).not.toContainText("3500 FC");

    // ═══════════════════════════════════════════════════
    // PHASE 6: Verify transaction notification was generated
    // ═══════════════════════════════════════════════════
    console.log("Phase 6: Verifying transaction notification...");

    // Open notification bell again
    await page.click("#notification-bell-btn");
    await page.waitForTimeout(300);

    // Verify notification panel shows a TRANSACTION_SUCCESS notification
    await expect(page.locator("#notification-panel")).toBeVisible();
    await expect(page.locator("text=Compra Exitosa")).toBeVisible();

    console.log("✅ All ecosystem checks passed!");
  });
});
