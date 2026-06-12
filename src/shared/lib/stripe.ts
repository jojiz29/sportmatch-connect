/**
 * ===================================================================
 * ARCHIVO: src/shared/lib/stripe.ts
 * PROPÓSITO: Inicialización del cliente Stripe en el frontend.
 *            Carga la librería Stripe.js con la clave publicable
 *            y expone una promesa lista para usar.
 * FLUJO: Lee VITE_STRIPE_PUBLISHABLE_KEY -> loadStripe() ->
 *        stripePromise lista para Elements Provider.
 * ===================================================================
 */

import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";

const publishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "") as string;

if (!publishableKey && import.meta.env.DEV) {
  console.warn("Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY in .env.");
}

/** Promesa del cliente Stripe (null si no hay key configurada) */
export const stripePromise: Promise<Stripe | null> | null = publishableKey
  ? loadStripe(publishableKey)
  : null;

/** Flag para saber si Stripe está configurado */
export const isStripeConfigured = publishableKey !== "";
