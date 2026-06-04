/**
 * src/shared/lib/onesignal.ts
 * Helper library for OneSignal Web Push notifications.
 * Supports mock mode for dev environment and Playwright tests.
 */

import { useAuthStore } from "@/entities/user/useAuth";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = (import.meta.env.VITE_ONESIGNAL_APP_ID || "mock-app-id") as string;

export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCKS === "true" || useAuthStore.getState().isDemoMode;
}

/**
 * Initializes OneSignal Web SDK if not in mock mode.
 */
export async function initOneSignal(): Promise<void> {
  if (isMockMode()) {
    console.log("[OneSignal Mock] Initialization skipped in Mock Mode.");
    return;
  }

  try {
    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(async () => {
      await window.OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
      });
      console.log("[OneSignal] Web SDK Initialized successfully.");
    });
  } catch (error) {
    console.error("[OneSignal] Initialization error:", error);
  }
}

/**
 * Requests push notification permission.
 * In mock mode, immediately resolves to a mock token.
 */
export async function requestPushPermission(): Promise<string | null> {
  if (isMockMode()) {
    console.log("[OneSignal Mock] Simulating push permission request...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("[OneSignal Mock] Permission granted. Returning mock token.");
    return `mock-onesignal-id-${Math.random().toString(36).substring(2, 11)}`;
  }

  return new Promise((resolve) => {
    try {
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(async () => {
        try {
          const permissionGranted = await window.OneSignal.Notifications.requestPermission();
          if (permissionGranted) {
            const subscriptionId = window.OneSignal.User?.PushSubscription?.id;
            console.log("[OneSignal] Permission granted. Subscription ID:", subscriptionId);
            resolve(subscriptionId || null);
          } else {
            console.warn("[OneSignal] Permission denied by user.");
            resolve(null);
          }
        } catch (err) {
          console.error("[OneSignal] Error during permission request:", err);
          resolve(null);
        }
      });
    } catch (e) {
      console.error("[OneSignal] Push SDK error:", e);
      resolve(null);
    }
  });
}
