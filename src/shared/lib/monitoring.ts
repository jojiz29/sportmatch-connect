type ErrorContext = Record<string, unknown>;
type EventProperties = Record<string, unknown>;

const IS_PROD = import.meta.env.MODE === "production";

/**
 * Wrapper centralizado para Observabilidad (Sentry/PostHog).
 * En desarrollo, vuelca los datos a la consola. En producción,
 * estaría conectado a los SDKs reales.
 */
export const monitoring = {
  captureError: (error: Error, context?: ErrorContext) => {
    if (!IS_PROD) {
      console.error("[DEV: Capture Error]", error, context);
      return;
    }
    // Sentry.captureException(error, { extra: context });
  },

  captureEvent: (eventName: string, properties?: EventProperties) => {
    if (!IS_PROD) {
      console.log(`[DEV: Track Event] ${eventName}`, properties);
      return;
    }
    // posthog.capture(eventName, properties);
  },

  setUser: (userId: string, properties?: EventProperties) => {
    if (!IS_PROD) {
      console.log(`[DEV: Set User] ${userId}`, properties);
      return;
    }
    // posthog.identify(userId, properties);
    // Sentry.setUser({ id: userId, ...properties });
  },
};
