import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.15.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "OPTIONS,POST",
  "access-control-allow-headers": "Content-Type, Authorization, apikey",
  "content-type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Stripe secret key no configurada." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }

  try {
    const body = await req.json();
    const monto_cancha = Number(body?.monto_cancha || body?.amount);

    if (!monto_cancha || monto_cancha <= 0) {
      return new Response(JSON.stringify({ error: "El monto de la cancha debe ser un número mayor que cero." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const comision_servicio = monto_cancha * 0.10;
    const total_amount = monto_cancha + comision_servicio;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total_amount * 100),
      currency: "pen",
      payment_method_types: ["card"],
      description: "Reserva SportMatch Connect",
    });

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("Stripe PaymentIntent error:", error);
    const message = error instanceof Error ? error.message : "Error creando PaymentIntent";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
