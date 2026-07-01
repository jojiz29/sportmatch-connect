import { Page } from "@playwright/test";

const port = process.env.VITE_PORT || "5179";
const targetURL = `http://localhost:${port}`;

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${targetURL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

export async function logoutByClearingStorage(page: Page) {
  await page.evaluate(() => localStorage.removeItem("sportmatch-auth"));
}
