// ============================================================
// postgis-integration.spec.ts — E2E: Búsqueda espacial PostGIS
// Verifica búsqueda de canchas por proximidad geográfica
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("PostGIS Spatial Search Proximity Test", () => {
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test("should dynamically fetch and order courts based on user geolocation (Surco vs San Borja)", async ({
    page,
    context,
  }) => {
    // 1. Grant geolocation permissions to the browser context
    await context.grantPermissions(["geolocation"]);

    // 2. Set Geolocation to Surco Center
    await context.setGeolocation({ latitude: -12.14, longitude: -76.995 });

    // 3. Login as Edwin Flores
    page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.text()));
    await page.goto(`${targetURL}/login`);
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');

    // Verify redirection to Dashboard
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));

    // 4. Navigate to live map
    await page.goto(`${targetURL}/app/map`);
    await expect(page.locator("h1")).toContainText("Mapa Comercial");

    // 5. Verify Leaflet map container is visible
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 10000 });

    // 6. Verify courts are ordered by proximity for Surco
    // Under Surco (-12.14, -76.995), the closest court is "Pádel Center Surco" (~0.77km)
    const listContainer = page.locator("div.bg-gradient-card", {
      hasText: "Cerca tuyo (Ordenado por distancia)",
    });
    await expect(listContainer).toBeVisible();

    const firstCourt = listContainer.locator("div.flex.gap-3.items-center").first();
    await expect(firstCourt.locator(".text-sm.font-semibold")).toContainText("Padel Academy Lima");
    await expect(firstCourt).toContainText("1.8 km");

    // 7. Move user to San Borja center (-12.10, -76.99)
    await context.setGeolocation({ latitude: -12.1, longitude: -76.99 });

    // Reload page to trigger fresh geolocation resolution
    await page.reload();
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 10000 });

    // 8. Verify the closest court has updated to "Tenis Club San Borja" (0.00 km)
    const listContainerSanBorja = page.locator("div.bg-gradient-card", {
      hasText: "Cerca tuyo (Ordenado por distancia)",
    });
    const firstCourtSanBorja = listContainerSanBorja.locator("div.flex.gap-3.items-center").first();
    await expect(firstCourtSanBorja.locator(".text-sm.font-semibold")).toContainText(
      "Megatlon Center",
      { timeout: 15000 },
    );
    await expect(firstCourtSanBorja).toContainText("1.2 km");
  });
});
