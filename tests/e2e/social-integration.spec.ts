// ============================================================
// social-integration.spec.ts — E2E: Grafo social y seguidores
// Verifica seguir/dejar de seguir y feed de actividad social
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Social Graph & Followers Integration Test", () => {
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test("should allow Edwin Flores to follow and unfollow other users with optimistic UI and profile stats sync", async ({
    page,
  }) => {
    // 1. Login as Edwin Flores
    await page.goto(`${targetURL}/login`);
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');

    // Verify redirection to Dashboard
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));

    // 2. Navigate to Fabiola's Profile (Fabiola's ID is "user-fabiola" in mock.ts)
    await page.goto(`${targetURL}/app/match/user-fabiola`);

    // Verify profile page loaded
    await expect(page.locator("h1")).toContainText("Fabiola");

    // 3. Get initial followers stats text
    const statsLocator = page.locator("p.text-xs.text-muted-foreground", { hasText: "seguidores" });
    await expect(statsLocator).toBeVisible();
    await expect(statsLocator).toContainText("0 seguidores");

    // Locate the follow button
    const followBtn = page.locator("button", { hasText: "Seguir" });
    await expect(followBtn).toBeVisible();

    // 4. Click the follow button (Optimistic UI trigger)
    await followBtn.click();

    // Verify button text changed to "Siguiendo"
    const followingBtn = page.locator("button", { hasText: "Siguiendo" });
    await expect(followingBtn).toBeVisible();

    // Verify followers count incremented optimistically to 1
    await expect(statsLocator).toContainText("1 seguidores");

    // 5. Reload the page to test persistence
    await page.reload();
    await expect(page.locator("h1")).toContainText("Fabiola");
    await expect(followingBtn).toBeVisible();
    await expect(statsLocator).toContainText("1 seguidores");

    // 6. Navigate to Edwin's own profile to check "Seguidos" stat
    await page.goto(`${targetURL}/app/profile`);
    await expect(page.locator("h2")).toContainText("Edwin Flores");

    // Verify "Seguidos" count is 1
    const seguidosStat = page.locator("div.glass", { hasText: "Seguidos" });
    await expect(seguidosStat.locator("div.text-2xl")).toContainText("1");

    // 7. Go back to Fabiola's profile and unfollow
    await page.goto(`${targetURL}/app/match/user-fabiola`);
    await expect(followingBtn).toBeVisible();

    // Click to unfollow
    await followingBtn.click();

    // Verify text changed back to "Seguir"
    await expect(followBtn).toBeVisible();

    // Verify followers count decremented to 0
    await expect(statsLocator).toContainText("0 seguidores");

    // 8. Go back to Edwin's profile and verify "Seguidos" is 0
    await page.goto(`${targetURL}/app/profile`);
    await expect(seguidosStat.locator("div.text-2xl")).toContainText("0");
  });
});
