import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";

const publishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "") as string;

if (!publishableKey && import.meta.env.DEV) {
  console.warn("Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY in .env.");
}

export const stripePromise: Promise<Stripe | null> | null = publishableKey
  ? loadStripe(publishableKey)
  : null;

export const isStripeConfigured = publishableKey !== "";
