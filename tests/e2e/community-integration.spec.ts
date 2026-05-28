import { test, expect } from "@playwright/test";

test.describe("Community & Squads Integration Test", () => {
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test("should allow Fabiola to see Edwin's posts and join Edwin's squads", async ({ page }) => {
    // 1. Log in as Fabiola to follow Edwin
    console.log("Fabiola logging in to follow Edwin...");
    await page.goto(`${targetURL}/login`);
    await page.fill('input[type="email"]', "fabiola@sportmatch.app");
    await page.fill('input[type="password"]', "Fabiola123?");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));

    // Navigate to Edwin's profile (ID is "user-edwin-master" in mock.ts)
    await page.goto(`${targetURL}/app/match/user-edwin-master`);
    await expect(page.locator("h1")).toContainText("Edwin Flores");

    // Click "Seguir" if not already followed
    const followBtn = page.locator("button", { hasText: "Seguir" });
    const followingBtn = page.locator("button", { hasText: "Siguiendo" });
    if (await followBtn.isVisible()) {
      await followBtn.click();
      await expect(followingBtn).toBeVisible();
    }

    // Log out Fabiola by clearing auth state in localStorage
    await page.evaluate(() => localStorage.removeItem("sportmatch-auth"));
    await page.goto(`${targetURL}/login`);
    await expect(page.locator("h1").first()).toContainText("Iniciar Sesión");

    // 2. Log in as Edwin Flores to post and create a squad
    console.log("Edwin logging in to publish a post and create a squad...");
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));

    // Go to Feed tab and publish post
    await page.click("#dashboard-tab-feed");
    await page.fill("#feed-post-textarea", "¡Hola a todos! Este es mi primer post del día.");
    await page.click("#feed-post-submit");
    await expect(page.locator("#feed-posts-list")).toContainText(
      "¡Hola a todos! Este es mi primer post del día.",
    );

    // Go to Squads tab and create a squad
    await page.click("#dashboard-tab-squads");
    await page.click("#create-squad-btn");
    await page.fill("#squad-name-input", "Real Tenis Club Surco");
    await page.fill("#squad-desc-input", "Club de tenis fundado por Edwin");
    await page.click("#squad-submit-btn");

    // Verify squad appears in the list
    await expect(page.locator("#squads-list")).toContainText("Real Tenis Club Surco");

    // Log out Edwin by clearing auth state in localStorage
    await page.evaluate(() => localStorage.removeItem("sportmatch-auth"));
    await page.goto(`${targetURL}/login`);
    await expect(page.locator("h1").first()).toContainText("Iniciar Sesión");

    // 3. Log back in as Fabiola to verify feed and join squad
    console.log("Fabiola logging back in to verify feed and join squad...");
    await page.fill('input[type="email"]', "fabiola@sportmatch.app");
    await page.fill('input[type="password"]', "Fabiola123?");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`));

    // Verify Edwin's post is visible in Fabiola's feed
    await page.click("#dashboard-tab-feed");
    await expect(page.locator("#feed-posts-list")).toContainText(
      "¡Hola a todos! Este es mi primer post del día.",
    );

    // Verify Edwin's squad is visible in Fabiola's explorer and join it
    await page.click("#dashboard-tab-squads");
    const squadCard = page.locator("div.bg-gradient-card", { hasText: "Real Tenis Club Surco" });
    await expect(squadCard).toBeVisible();
    await expect(squadCard.locator(".squad-members-count")).toContainText("1 miembros");

    const joinBtn = squadCard.locator("button", { hasText: "Unirme" });
    await joinBtn.click();

    // Verify button changes to "Miembro" and count updates to 2 members
    await expect(squadCard.locator("button", { hasText: "Miembro" })).toBeVisible();
    await expect(squadCard.locator(".squad-members-count")).toContainText("2 miembros");
  });
});
