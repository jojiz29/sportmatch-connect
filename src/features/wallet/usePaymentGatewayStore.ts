// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { useAuthStore } from "@/entities/user/useAuth";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { logPaymentAttempt } from "@/services/paymentService";
import { PaymentMethod } from "@/shared/lib/paymentUtils";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { CardElement } from "@stripe/react-stripe-js";

// === BLOQUE: PAYLOAD DE PAGO ===
// Datos necesarios para procesar un pago: método, monto, uso de FitCoins y datos del titular.
export interface PaymentPayload {
  method: PaymentMethod;
  amount: number;
  useFitcoins: boolean;
  fitcoinsToUse: number;
  cardHolderName?: string;
  phone?: string;
}

// === BLOQUE: RESULTADO DE PAGO ===
// Información devuelta tras procesar un pago: éxito, ID de transacción y montos.
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amountCharged: number;
  fitcoinsUsed: number;
  errorCode?: string;
}

// === BLOQUE: INTERFAZ DEL ESTADO ===
interface PaymentGatewayState {
  isProcessing: boolean;
  status: "idle" | "processing" | "success" | "failed";
  transactionId: string | null;
  error: string | null;
  errorCode: string | null;
  lastPaymentMethod: PaymentMethod | null;
  processPayment: (
    payload: PaymentPayload,
    courtName: string,
    stripe?: Stripe | null,
    elements?: StripeElements | null,
  ) => Promise<PaymentResult>;
  resetPayment: () => void;
}

// === BLOQUE: STORE DE PASARELA DE PAGOS ===
// Procesa pagos con tarjeta (Stripe), Yape/Plin y descuento con FitCoins.
// No se persiste en localStorage (el estado es transaccional).
export const usePaymentGatewayStore = create<PaymentGatewayState>((set) => ({
  isProcessing: false,
  status: "idle",
  transactionId: null,
  error: null,
  errorCode: null,
  lastPaymentMethod: null,

  // === PROCESAR PAGO ===
  // Soporta tres flujos:
  //   1. Tarjeta (Stripe) — modo demo simulado o real con PaymentIntent
  //   2. Yape/Plin — validación de número de celular
  //   3. FitCoins — canje desde el monedero
  processPayment: async (payload, courtName, stripe, elements) => {
    set({
      isProcessing: true,
      status: "processing",
      error: null,
      errorCode: null,
      transactionId: null,
    });

    // Registro del intento de pago para auditoría
    const attempt = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      courtName,
      method: payload.method,
      amount: payload.amount,
      fitcoinsUsed: payload.fitcoinsToUse,
      status: "failed" as const,
    };

    const isDemo = useAuthStore.getState().isDemoMode;

    // ── Flujo: Pago con tarjeta (Stripe) ────────────────────────────────
    if (payload.method === "card" && payload.amount > 0) {
      // Valida que el nombre del titular tenga al menos 3 caracteres
      if (!payload.cardHolderName || payload.cardHolderName.trim().length < 3) {
        const errorCode = "CARD_HOLDER_INVALID";
        const error = "El nombre del titular debe tener al menos 3 letras.";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }

      // Modo demo: simula éxito sin llamar a Stripe
      if (isDemo) {
        const txId = `TXN-DEMO-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        set({
          isProcessing: false,
          status: "success",
          transactionId: txId,
          error: null,
          errorCode: null,
          lastPaymentMethod: payload.method,
        });
        logPaymentAttempt({ ...attempt, status: "success", errorCode: undefined });
        return {
          success: true,
          transactionId: txId,
          amountCharged: payload.amount,
          fitcoinsUsed: payload.fitcoinsToUse,
        };
      }

      // Stripe no está inicializado
      if (!stripe || !elements) {
        const errorCode = "STRIPE_NOT_READY";
        const error = "Stripe no está listo. Recarga la página y vuelve a intentar.";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }

      // Construye la URL de la función Supabase para crear el PaymentIntent
      const supabaseUrlRaw = (import.meta.env.VITE_SUPABASE_URL || "") as string;
      const supabaseUrl = supabaseUrlRaw
        .replace(/\/(?:rest\/v1|functions\/v1)\/?$/, "")
        .replace(/\/+$/, "");
      const supabaseFunctionsUrl =
        (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined) ??
        `${supabaseUrl}/functions/v1`;

      try {
        // Llama a la función serverless de Supabase que crea el PaymentIntent
        const response = await fetch(`${supabaseFunctionsUrl}/create-stripe-payment-intent`, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            amount: payload.amount,
            monto_cancha: payload.amount / 1.1,
          }),
        });

        if (!response.ok) {
          const responseBody = await response.text();
          const errorCode = "STRIPE_INTENT_ERROR";
          const error = `No se pudo crear el PaymentIntent: ${responseBody}`;
          set({ isProcessing: false, status: "failed", error, errorCode });
          logPaymentAttempt({ ...attempt, status: "failed", errorCode });
          return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
        }

        const { clientSecret } = await response.json();
        if (!clientSecret) {
          const errorCode = "STRIPE_SECRET_MISSING";
          const error = "No se recibió client_secret de Stripe.";
          set({ isProcessing: false, status: "failed", error, errorCode });
          logPaymentAttempt({ ...attempt, status: "failed", errorCode });
          return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
        }

        // Obtiene el elemento CardElement para confirmar el pago
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          const errorCode = "CARD_ELEMENT_MISSING";
          const error = "No se pudo leer los datos de la tarjeta.";
          set({ isProcessing: false, status: "failed", error, errorCode });
          logPaymentAttempt({ ...attempt, status: "failed", errorCode });
          return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
        }

        // Confirma el pago con Stripe.js
        const confirmResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: payload.cardHolderName.trim() || "Cliente SportMatch",
            },
          },
        });

        if (confirmResult.error) {
          const errorCode = "STRIPE_PAYMENT_FAILED";
          const error = confirmResult.error.message || "El pago fue rechazado.";
          set({ isProcessing: false, status: "failed", error, errorCode });
          logPaymentAttempt({ ...attempt, status: "failed", errorCode });
          return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
        }

        if (!confirmResult.paymentIntent || confirmResult.paymentIntent.status !== "succeeded") {
          const errorCode = "STRIPE_PAYMENT_INCOMPLETE";
          const error = "El pago no se completó correctamente.";
          set({ isProcessing: false, status: "failed", error, errorCode });
          logPaymentAttempt({ ...attempt, status: "failed", errorCode });
          return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
        }
      } catch (err) {
        const errorCode = "STRIPE_REQUEST_FAILED";
        let error = err instanceof Error ? err.message : "Error al procesar el pago con Stripe.";
        if (error === "Failed to fetch" || error.includes("NetworkError")) {
          error =
            "No se pudo conectar con el servidor de pagos. Verifica la configuración de CORS y la URL de la función de Stripe.";
        }
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
    }

    // ── Flujo: Pago con Yape o Plin ──────────────────────────────────────
    if (payload.method === "yape" || payload.method === "plin") {
      if (!payload.phone || !/^[0-9]{9}$/.test(payload.phone)) {
        const errorCode = "PHONE_INVALID";
        const error = "Número de celular inválido";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
    }

    // ── Flujo: Descuento con FitCoins ────────────────────────────────────
    if (payload.useFitcoins && payload.fitcoinsToUse > 0) {
      const ledgerDesc = `Reserva: ${courtName}`;
      const ledgerSuccess = await useWalletStore
        .getState()
        .redeem(payload.fitcoinsToUse, ledgerDesc);
      if (!ledgerSuccess && !isDemo) {
        const errorCode = "FITCOINS_INSUFFICIENT";
        const error = "Saldo de FitCoins insuficiente para completar esta transacción.";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
    }

    // Éxito: genera un ID de transacción y actualiza el estado
    const txId = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    set({
      isProcessing: false,
      status: "success",
      transactionId: txId,
      error: null,
      errorCode: null,
      lastPaymentMethod: payload.method,
    });
    logPaymentAttempt({ ...attempt, status: "success", errorCode: undefined });
    return {
      success: true,
      transactionId: txId,
      amountCharged: payload.amount,
      fitcoinsUsed: payload.fitcoinsToUse,
    };
  },

  // === REINICIAR ESTADO DE PAGO ===
  resetPayment: () => {
    set({
      isProcessing: false,
      status: "idle",
      transactionId: null,
      error: null,
      errorCode: null,
      lastPaymentMethod: null,
    });
  },
}));
