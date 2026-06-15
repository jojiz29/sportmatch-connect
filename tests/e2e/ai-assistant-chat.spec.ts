// ============================================================
// ai-assistant-chat.spec.ts — E2E: Chat del Asistente IA "Sporty"
//
// Verifica el bug crítico de carga colgada (15-jun-2026):
//   - El chat NO debe quedarse en "Conectando con Sporty..."
//     + "Analizando..." indefinidamente.
//   - El fetch a /api/v1/ai/chat/welcome debe ocurrir EXACTAMENTE
//     una vez (no en loop por useEffect deps).
//   - Si pasan 15s sin respuesta, el watchdog debe mostrar un
//     mensaje de error visible al usuario.
//
// Técnica: interceptamos las requests al backend en el navegador
// y devolvemos respuestas controladas. Así podemos simular:
//   - Backend OK con respuesta rápida
//   - Backend OK con respuesta lenta (para verificar watchdog)
//   - Backend con error 500
// ============================================================

import { test, expect, type Page } from "@playwright/test";

const port = process.env.VITE_PORT || "5179";
const targetURL = `http://localhost:${port}`;

// Selector del chat abierto: el diálogo con role="dialog" del bot flotante
const CHAT_DIALOG = '[id="sporty-chat-window"]';
const CONNECTING_TEXT = "Conectando con Sporty";
const ANALYZING_TEXT = "Analizando";

async function loginAndOpenChat(page: Page) {
  // Login con usuario demo
  await page.goto(`${targetURL}/login`);
  await page.fill('input[type="email"]', "demo@sportmatch.com");
  await page.fill('input[type="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app\/?/, { timeout: 15000 });
  // Abrir el chat
  await page.click('button[aria-label*="abrir asistente" i], button[aria-label*="Abrir" i]');
  await page.waitForSelector(CHAT_DIALOG, { state: "visible", timeout: 5000 });
}

test.describe("Sporty AI Chat — anti-colgada (15-jun-2026)", () => {
  test("carga el welcome del LLM en menos de 5s cuando el backend responde OK", async ({
    page,
  }) => {
    let welcomeCalls = 0;
    await page.route("**/api/v1/ai/chat/welcome", async (route) => {
      welcomeCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "¡Hola! Soy Sporty, tu asistente deportivo ⚡",
          suggestions: ["Buscar canchas", "Ver mi racha"],
          metadata: { tokens: 30, model: "gemini-2.5-flash", latencyMs: 800 },
        }),
      });
    });

    await loginAndOpenChat(page);

    // Esperar el mensaje del LLM
    await expect(page.locator(CHAT_DIALOG).getByText("Soy Sporty")).toBeVisible({ timeout: 5000 });

    // El fetch debe haber ocurrido exactamente 1 vez (no en loop)
    expect(welcomeCalls, "fetchWelcomeMessage se llamó más de 1 vez (loop de useEffect)").toBe(1);

    // El texto "Conectando con Sporty..." ya NO debe estar visible
    await expect(page.locator(CHAT_DIALOG).getByText(CONNECTING_TEXT)).toHaveCount(0);
    // El texto "Analizando..." ya NO debe estar visible
    await expect(page.locator(CHAT_DIALOG).getByText(ANALYZING_TEXT)).toHaveCount(0);
  });

  test("el watchdog de 15s muestra error si el backend nunca responde", async ({ page }) => {
    // Simulamos un backend colgado: nunca respondemos al fetch
    await page.route("**/api/v1/ai/chat/welcome", async () => {
      // No llamamos a route.fulfill ni route.continue → la request queda colgada
      // indefinidamente (como pasa en producción con un Render dormido).
    });

    await loginAndOpenChat(page);

    // Tras 15s, el watchdog debe mostrar un mensaje de error
    const errorMessage = page
      .locator(CHAT_DIALOG)
      .getByText(/tardando en responder|asistente está tardando|intenta de nuevo/i)
      .first();

    await expect(errorMessage).toBeVisible({ timeout: 20000 });

    // El "Conectando con Sporty..." ya NO debe seguir visible (watchdog lo reemplazó)
    await expect(page.locator(CHAT_DIALOG).getByText(CONNECTING_TEXT)).toHaveCount(0);
  });

  test("muestra mensaje de error si el backend devuelve 500", async ({ page }) => {
    await page.route("**/api/v1/ai/chat/welcome", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error" }),
      });
    });

    await loginAndOpenChat(page);

    // El error debe propagarse al chat como burbuja de sistema
    await expect(
      page
        .locator(CHAT_DIALOG)
        .getByText(/error|500|intenta de nuevo/i)
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("loadWelcome() es idempotente: cerrar y reabrir no dispara fetch extra", async ({
    page,
  }) => {
    let welcomeCalls = 0;
    await page.route("**/api/v1/ai/chat/welcome", async (route) => {
      welcomeCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "¡Hola! Soy Sporty ⚡",
          suggestions: [],
          metadata: { tokens: 10, model: "gemini-2.5-flash", latencyMs: 500 },
        }),
      });
    });

    await loginAndOpenChat(page);
    await expect(page.locator(CHAT_DIALOG).getByText("Soy Sporty")).toBeVisible({ timeout: 5000 });

    const callsAfterOpen = welcomeCalls;

    // Cerrar y reabrir el chat varias veces
    for (let i = 0; i < 3; i += 1) {
      // Cerrar
      await page.click('button[aria-label*="cerrar" i]');
      await page.waitForSelector(CHAT_DIALOG, { state: "hidden", timeout: 2000 });
      // Reabrir
      await page.click('button[aria-label*="abrir asistente" i], button[aria-label*="Abrir" i]');
      await page.waitForSelector(CHAT_DIALOG, { state: "visible", timeout: 2000 });
    }

    // El fetch NO debe dispararse de nuevo (loadWelcome es idempotente)
    expect(welcomeCalls, "Se disparó fetch extra al cerrar/reabrir el chat").toBe(callsAfterOpen);
  });

  test("enviar un mensaje del usuario funciona end-to-end", async ({ page }) => {
    await page.route("**/api/v1/ai/chat/welcome", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "¡Hola! Soy Sporty ⚡",
          suggestions: [],
          metadata: { tokens: 5, model: "gemini-2.5-flash", latencyMs: 100 },
        }),
      });
    });

    let chatCalls = 0;
    await page.route("**/api/v1/ai/chat", async (route) => {
      chatCalls += 1;
      const body = JSON.parse(route.request().postData() ?? "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: `Recibí tu mensaje: "${body.message}". ¡Vamos a por esa cancha!`,
          suggestions: [],
          metadata: { tokens: 20, model: "gemini-2.5-flash", latencyMs: 900 },
        }),
      });
    });

    await loginAndOpenChat(page);
    await expect(page.locator(CHAT_DIALOG).getByText("Soy Sporty")).toBeVisible({ timeout: 5000 });

    // Escribir y enviar un mensaje
    const input = page.locator(CHAT_DIALOG).locator('input[aria-label*="mensaje" i]');
    await input.fill("Busco cancha de fútbol 7");
    await page.locator(CHAT_DIALOG).locator('button[aria-label*="enviar" i]').click();

    // El mensaje del usuario debe aparecer
    await expect(page.locator(CHAT_DIALOG).getByText("Busco cancha de fútbol 7")).toBeVisible({
      timeout: 3000,
    });

    // La respuesta del LLM debe aparecer
    await expect(page.locator(CHAT_DIALOG).getByText("Recibí tu mensaje")).toBeVisible({
      timeout: 5000,
    });

    expect(chatCalls, "sendMessageToAI no se llamó").toBe(1);
  });
});
