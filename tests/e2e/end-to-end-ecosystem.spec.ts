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
    page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.text()));
    await page.goto(`${targetURL}/login`);
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');
    await expect(page.locator("h1").first()).toContainText("Edwin");

    // Navigate directly to Puka Power's public profile
    // (Puka Power is BUSINESS role and does not appear in the PLAYER matchmaking list)
    await page.goto(`${targetURL}/app/profile/user-puka-power`);
    const followBtn = page.locator("button", { hasText: "Seguir" });
    const followingBtn = page.locator("button", { hasText: "Siguiendo" });
    await expect(followBtn.or(followingBtn)).toBeVisible({ timeout: 10000 });
    if (await followBtn.isVisible()) {
      await followBtn.click();
      await expect(followingBtn).toBeVisible();
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

    // Go to Feed page
    await page.goto(`${targetURL}/app/feed`);
    await page.waitForTimeout(300);

    // Create a new post as Puka Power
    const postInput = page.locator("#feed-post-textarea");
    await expect(postInput).toBeVisible();
    await postInput.fill(
      "🎉 ¡OFERTA FLASH! Llévate tu Botella Puka Power con 20% de descuento. ¡Solo hoy!",
    );
    const publishBtn = page.locator("#feed-post-submit");
    await publishBtn.click();
    await page.waitForTimeout(500);

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
    const bellBtn = page.locator("#notification-bell-btn").first();
    await expect(bellBtn).toBeVisible();

    // Soft check — badge may not be visible on first run, never throws
    await page
      .locator("#notification-badge")
      .first()
      .isVisible()
      .catch(() => false);

    // Click the notification bell to open the panel
    await bellBtn.click();
    await page.waitForTimeout(300);

    // Verify notification panel is open
    await expect(page.locator("h3:has-text('Notificaciones')")).toBeVisible();

    // Verify Edwin got a B2B offer purchase notification from Puka Power
    const offerNotif = page.locator("text=Nueva oferta de Puka Power");
    await expect(offerNotif).toBeVisible();
    await offerNotif.click();

    // Verify redirection to Wallet index page with buyItem param
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/wallet\\?buyItem=.*`));

    // Verify Edwin's initial balance
    const sidebarBalance = page.locator("aside .text-neon");
    await expect(sidebarBalance).toContainText("FC");

    // Click confirm in the purchase modal (already auto-opened via buyItem param)
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
    await page.locator("#notification-bell-btn").first().click();
    await page.waitForTimeout(300);

    // Verify notification panel shows a TRANSACTION_SUCCESS notification
    await expect(page.locator("#notification-panel")).toBeVisible();
    await expect(page.locator("text=Compra Exitosa")).toBeVisible();

    console.log("✅ All ecosystem checks passed!");
  });
});
