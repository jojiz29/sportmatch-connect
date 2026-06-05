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
  return (
    import.meta.env.VITE_USE_MOCKS === "true" ||
    useAuthStore.getState().isDemoMode ||
    !ONESIGNAL_APP_ID ||
    ONESIGNAL_APP_ID === "mock-app-id"
  );
}

let isOneSignalInitialized = false;

/**
 * Initializes OneSignal Web SDK if not in mock mode.
 */
export async function initOneSignal(): Promise<void> {
  if (isMockMode()) {
    console.log("[OneSignal Mock] Initialization skipped in Mock Mode.");
    return;
  }

  if (isOneSignalInitialized) {
    console.log("[OneSignal] Web SDK already initialized, skipping duplicate call.");
    return;
  }

  try {
    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(async () => {
      if (window.OneSignal.initialized) {
        console.log("[OneSignal] Web SDK was already initialized internally.");
        isOneSignalInitialized = true;
        return;
      }

      try {
        await window.OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });
        isOneSignalInitialized = true;
        console.log("[OneSignal] Web SDK Initialized successfully.");
      } catch (initErr) {
        const errMessage = initErr instanceof Error ? initErr.message : String(initErr);
        if (errMessage.includes("already initialized")) {
          isOneSignalInitialized = true;
          console.log("[OneSignal] Web SDK was already initialized (caught error).");
        } else {
          console.error("[OneSignal] Error during SDK init call:", initErr);
        }
      }
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
    let resolved = false;

    // Timeout fallback after 3 seconds in case OneSignal SDK is blocked or fails to load
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("[OneSignal] Permission request timed out. Ad-blocker might be active.");
        resolve(null);
      }
    }, 3000);

    try {
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(async () => {
        try {
          if (resolved) return;

          if (
            !window.OneSignal.Notifications ||
            typeof window.OneSignal.Notifications.requestPermission !== "function"
          ) {
            throw new Error("OneSignal Notifications SDK is not available.");
          }

          const permissionGranted = await window.OneSignal.Notifications.requestPermission();
          if (permissionGranted) {
            const subscriptionId = window.OneSignal.User?.PushSubscription?.id;
            console.log("[OneSignal] Permission granted. Subscription ID:", subscriptionId);
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              resolve(subscriptionId || null);
            }
          } else {
            console.warn("[OneSignal] Permission denied by user.");
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              resolve(null);
            }
          }
        } catch (err) {
          console.error("[OneSignal] Error during permission request:", err);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(null);
          }
        }
      });
    } catch (e) {
      console.error("[OneSignal] Push SDK error:", e);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(null);
      }
    }
  });
}
