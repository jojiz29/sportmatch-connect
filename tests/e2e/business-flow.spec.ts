import { test, expect } from "@playwright/test";

test.describe("B2B Portal and Marketplace E2E Flow", () => {
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test("should register a business, publish a product, verify purchase as a player, and validate wallet balance sync", async ({
    page,
  }) => {
    // 1. Go to register page
    await page.goto(`${targetURL}/app/register`);
    await expect(page.locator("h1").first()).toContainText("Crear Cuenta");

    // 2. Select "Empresa" role
    await page.click("text=Empresa");

    // 3. Fill Business registration details
    await page.fill("#register-company-name", "SportStore Surco");
    await page.selectOption("#register-business-category", "Tienda");
    await page.fill("#register-business-lat", "-12.135");
    await page.fill("#register-business-lng", "-76.99");
    await page.fill("#register-email-input", "store@sportmatch.app");
    await page.fill("#register-password-input", "Store123?");
    
    // Submit registration
    await page.click('button[type="submit"]');

    // 4. Verify redirection and access to B2B dashboard
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));
    
    // Sidebar should contain "Mi Negocio"
    const businessNav = page.locator("aside >> text=Mi Negocio");
    await expect(businessNav).toBeVisible();
    await businessNav.click();
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/business`));

    // Verify initial metrics (0 balance, 0 sales)
    await expect(page.locator("#business-balance-display")).toContainText("0 FC");
    await expect(page.locator("#business-sales-display")).toContainText("0");

    // 5. Create a new catalog item
    await page.fill("#catalog-item-name", "Bebida Energética Puka");
    await page.fill("#catalog-item-desc", "Puka Power 500ml de pura energía");
    await page.fill("#catalog-item-price", "150");
    await page.selectOption("#catalog-item-type", "PRODUCT");
    await page.fill("#catalog-item-image", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97");
    
    // Submit catalog item
    await page.click("#catalog-item-submit");
    
    // Verify item is listed in the business's own catalog
    await expect(page.locator("text=Bebida Energética Puka")).toBeVisible();
    await expect(page.locator("text=150 FC")).toBeVisible();

    // 6. Log out from Business account
    await page.evaluate(() => localStorage.removeItem("sportmatch-auth"));
    await page.goto(`${targetURL}/login`);
    await expect(page.locator("h1").first()).toContainText("Iniciar Sesión");

    // 7. Log in as Edwin (Player)
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');

    // Verify Edwin is logged in and starts with 3500 FitCoins
    await expect(page.locator("h1").first()).toContainText("Edwin");
    const sidebarBalance = page.locator("aside .text-neon");
    await expect(sidebarBalance).toContainText("3500 FC");

    // Verify Map has the business marker loaded
    await page.click("aside >> text=Mapa");
    await page.waitForTimeout(1000); // Allow Leaflet to load

    // Verify "SportStore Surco" exists on map or side list (it displays on map markers)
    // We can also buy the product from the wallet page
    await page.click("aside >> text=FitCoins");
    await page.waitForTimeout(500);

    // 8. Purchase B2B catalog item
    const purchaseBtn = page.locator("#purchase-btn-puka-power-bottle"); // Puka Power official beverage pre-loaded
    await expect(purchaseBtn).toBeVisible();

    // Purchase the newly created "Bebida Energética Puka" from SportStore Surco
    const newProductPurchaseBtn = page.locator('[id^="purchase-btn-item-"]');
    await expect(newProductPurchaseBtn).toBeVisible();
    await newProductPurchaseBtn.click();

    // Click confirm purchase button in confirmation modal
    const confirmBtn = page.locator("#confirm-purchase-btn");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify success toast
    await expect(page.locator("text=¡Compra completada con éxito!")).toBeVisible();

    // Verify Edwin's balance goes down by 150 FC (from 3500 to 3350)
    await expect(sidebarBalance).toContainText("3350 FC");

    // 9. Verify Wallet History displays the B2B PURCHASE transaction
    await page.click('a:has-text("Historial")');
    await page.waitForSelector("text=Historial de Transacciones");
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/wallet/history`));

    await expect(page.locator("text=Compra: Bebida Energética Puka")).toBeVisible();
    await expect(page.locator("text=-150 FC")).toBeVisible();

    // 10. Log out of Edwin
    await page.evaluate(() => localStorage.removeItem("sportmatch-auth"));
    await page.goto(`${targetURL}/login`);
    await expect(page.locator("h1").first()).toContainText("Iniciar Sesión");

    // 11. Log back in as Business to verify balance credited
    await page.fill('input[type="email"]', "store@sportmatch.app");
    await page.fill('input[type="password"]', "Store123?");
    await page.click('button[type="submit"]');

    // Go to "Mi Negocio" dashboard
    await page.click("aside >> text=Mi Negocio");
    await page.waitForTimeout(500);

    // Verify Business account now has 150 FitCoins balance and 1 Sale
    await expect(page.locator("#business-balance-display")).toContainText("150 FC");
    await expect(page.locator("#business-sales-display")).toContainText("1");

    // Verify Sales record is logged
    await expect(page.locator("text=Bebida Energética Puka").first()).toBeVisible();
    await expect(page.locator("text=Comprador: Edwin Flores")).toBeVisible();
  });
});
