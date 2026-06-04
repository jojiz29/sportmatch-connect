import { test, expect } from "@playwright/test";

test.describe("Onboarding Wizard E2E Flow", () => {
  const port = process.env.VITE_PORT || "5179";
  const targetURL = `http://localhost:${port}`;

  test("should register a player and complete onboarding wizard successfully", async ({ page }) => {
    // 1. Go to register page
    await page.goto(`${targetURL}/app/register`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toContainText("Crear Cuenta", { timeout: 15000 });

    // 2. Select Player Role
    await page.click("#register-role-player");

    // 3. Fill Player basic registration info
    const randomEmail = `edwin.player.test.${Date.now()}@sportmatch.app`;
    await page.fill("#register-fullname-input", "Edwin Onboarding Tester");
    await page.fill("#register-email-input", randomEmail);
    await page.fill("#register-password-input", "PlayerOnboarding123?");

    // 4. Submit the registration form
    // In VITE_USE_MOCKS=true mode this calls signUp() → sets demo user → navigates to /app.
    // The app.tsx guard then redirects to /onboarding/sports because onboarding_completed is false.
    await page.click("#register-player-next-btn");

    // 5. Wait for the /onboarding/sports route to render
    // The page uses SportSelectionGrid + CoachmarkTutorial overlay on first visit
    await expect(page).toHaveURL(new RegExp(`${targetURL}/onboarding/sports`), { timeout: 10000 });
    await expect(page.locator("h1").first()).toContainText("Elige tus disciplinas", {
      timeout: 10000,
    });

    // 6. Dismiss the CoachmarkTutorial fullscreen overlay.
    // It intercepts ALL pointer events on the sport cards until dismissed.
    const coachmarkOverlay = page.locator("#coachmark-dismiss-btn");
    await expect(coachmarkOverlay).toBeVisible({ timeout: 5000 });
    await coachmarkOverlay.click();

    // Verify the overlay is gone before proceeding
    await expect(coachmarkOverlay).not.toBeVisible({ timeout: 3000 });

    // 7. Select Traditional Sports using SportSelectionGrid sport cards
    // Cards use id="sport-card-{id.replace(/\s+/g,'-')}" — same pattern as OnboardingWizard
    const futbolCard = page.locator("#sport-card-Fútbol");
    await expect(futbolCard).toBeVisible({ timeout: 8000 });
    // Click once → Aficionado (level 1, green border)
    await futbolCard.click();
    await expect(futbolCard).toHaveClass(/border-\[#3CAC3B\]/);

    // Click twice → Experimentado (level 2, orange border)
    await futbolCard.click();
    await expect(futbolCard).toHaveClass(/border-\[#F97316\]/);

    // Click three times → Competitivo (level 3, red border)
    await futbolCard.click();
    await expect(futbolCard).toHaveClass(/border-\[#E61D25\]/);

    // Select Tenis — leave at default Aficionado (1 click)
    const tenisCard = page.locator("#sport-card-Tenis");
    await expect(tenisCard).toBeVisible();
    await tenisCard.click();
    await expect(tenisCard).toHaveClass(/border-\[#3CAC3B\]/);

    // 8. Select E-Sports: Fortnite (one click = Aficionado)
    const fortniteCard = page.locator("#sport-card-Fortnite");
    await expect(fortniteCard).toBeVisible();
    await fortniteCard.click();
    await expect(fortniteCard).toHaveClass(/border-\[#3CAC3B\]/);

    // Select Brawl Stars (click twice = Experimentado)
    const brawlStarsCard = page.locator("#sport-card-Brawl-Stars");
    await expect(brawlStarsCard).toBeVisible();
    await brawlStarsCard.click();
    await brawlStarsCard.click();
    await expect(brawlStarsCard).toHaveClass(/border-\[#F97316\]/);

    // Click Next button to go to Step 2 (Identity & Identity Matrix)
    await page.click("#onboarding-next-btn");

    // 9. Fill in Bio and Gender selector in Step 2
    const bioInput = page.locator("#onboarding-bio-input");
    await expect(bioInput).toBeVisible({ timeout: 5000 });
    await bioInput.fill("Soy Edwin, me gusta jugar fútbol los fines de semana.");

    // Adjust the Weekly Hours Dedication slider (on Step 2)
    const hoursSlider = page.locator("#hours-slider");
    await expect(hoursSlider).toBeVisible();
    await hoursSlider.fill("12");

    // 10. Submit onboarding — click the finish button
    // In demo/mock mode updateProfile runs instantly without Supabase call
    await page.click("#onboarding-finish-btn");

    // 11. Verify redirection to Dashboard
    await expect(page).toHaveURL(new RegExp(`${targetURL}/app/?`), { timeout: 10000 });

    // Verify User name appears in the sidebar
    const sidebarName = page.locator("aside .text-sm.font-semibold");
    await expect(sidebarName).toContainText("Edwin Onboarding Tester");

    // 12. Check localStorage: verify the new user_sports JSONB structure is persisted correctly
    const authState = await page.evaluate(() => localStorage.getItem("sportmatch-auth"));
    if (authState) {
      const parsed = JSON.parse(authState);
      const userObj = parsed.state?.user;

      if (userObj) {
        // Verify onboarding is marked complete
        expect(userObj.onboarding_completed).toBe(true);

        // Verify user_sports array structure (new format)
        if (userObj.user_sports && userObj.user_sports.length > 0) {
          const futbolSport = userObj.user_sports.find(
            (s: { sport_id: string; level: number }) => s.sport_id === "Fútbol",
          );
          expect(futbolSport).toBeDefined();
          expect(futbolSport.level).toBe(3); // 3 clicks = Competitivo

          const tenisSport = userObj.user_sports.find(
            (s: { sport_id: string; level: number }) => s.sport_id === "Tenis",
          );
          expect(tenisSport).toBeDefined();
          expect(tenisSport.level).toBe(1); // 1 click = Aficionado
        }

        // Verify legacy sport_preferences matrix is also persisted
        if (userObj.sport_preferences?.sports_matrix) {
          const matrix = userObj.sport_preferences.sports_matrix;

          // Fútbol: 3 clicks = Advanced (3.5 weight)
          expect(matrix["Fútbol"]).toBeDefined();
          expect(matrix["Fútbol"].level).toBe("Advanced");
          expect(matrix["Fútbol"].weight).toBe(3.5);

          // Tenis: 1 click = Amateur (1.0 weight)
          expect(matrix["Tenis"]).toBeDefined();
          expect(matrix["Tenis"].level).toBe("Amateur");
          expect(matrix["Tenis"].weight).toBe(1.0);

          // behavioral_intent weekly_hours
          const intent = userObj.sport_preferences.behavioral_intent;
          expect(intent).toBeDefined();
          expect(intent.weekly_hours).toBe(12);
          expect(intent.intent).toBe("Recreativo");
        }
      }
    }
  });
});
