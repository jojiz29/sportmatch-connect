import { create } from "zustand";
import { useAuthStore } from "@/entities/user/useAuth";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { logPaymentAttempt } from "@/services/paymentService";
import {
  validateCardNumber,
  validateExpiry,
  validatePhoneNumber,
  sanitizeCardNumber,
  PaymentMethod,
} from "@/shared/lib/paymentUtils";

export interface PaymentCardData {
  holderName: string;
  number: string;
  expiry: string;
  cvv: string;
}

export interface PaymentPayload {
  method: PaymentMethod;
  amount: number;
  useFitcoins: boolean;
  fitcoinsToUse: number;
  card?: PaymentCardData;
  phone?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amountCharged: number;
  fitcoinsUsed: number;
  errorCode?: string;
}

interface PaymentGatewayState {
  isProcessing: boolean;
  status: "idle" | "processing" | "success" | "failed";
  transactionId: string | null;
  error: string | null;
  errorCode: string | null;
  lastPaymentMethod: PaymentMethod | null;
  processPayment: (payload: PaymentPayload, courtName: string) => Promise<PaymentResult>;
  resetPayment: () => void;
}

export const usePaymentGatewayStore = create<PaymentGatewayState>((set) => ({
  isProcessing: false,
  status: "idle",
  transactionId: null,
  error: null,
  errorCode: null,
  lastPaymentMethod: null,

  processPayment: async (payload: PaymentPayload, courtName: string) => {
    set({ isProcessing: true, status: "processing", error: null, errorCode: null, transactionId: null });

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
    const sanitizeCard = payload.card ? sanitizeCardNumber(payload.card.number) : "";

    if (payload.method === "card") {
      if (!payload.card || sanitizeCard.length !== 16 || !validateCardNumber(payload.card.number)) {
        const errorCode = "CARD_INVALID";
        const error = "Número de tarjeta inválido";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
      if (!validateExpiry(payload.card.expiry)) {
        const errorCode = "CARD_EXPIRED";
        const error = "Fecha de vencimiento inválida o vencida";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
      if (!/^[0-9]{3,4}$/.test(payload.card.cvv)) {
        const errorCode = "CARD_DATA_INVALID";
        const error = "CVV inválido";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
    }

    if (payload.method === "yape" || payload.method === "plin") {
      if (!payload.phone || !validatePhoneNumber(payload.phone)) {
        const errorCode = "PHONE_INVALID";
        const error = "Número de celular inválido";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1400));

    const simulationRoll = Math.random();
    if (!isDemo) {
      if (payload.method === "card" && simulationRoll > 0.92) {
        const errorCode = "CARD_DECLINED";
        const error = "La tarjeta fue rechazada por el emisor";
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
      if ((payload.method === "yape" || payload.method === "plin") && simulationRoll > 0.84) {
        const errorCode = simulationRoll > 0.94 ? "PAYMENT_TIMEOUT" : "PAYMENT_REJECTED";
        const error = errorCode === "PAYMENT_TIMEOUT"
          ? "El cobro expiró después de 60 segundos. Intenta nuevamente."
          : `El ${payload.method.toUpperCase()} rechazó el pago.`;
        set({ isProcessing: false, status: "failed", error, errorCode });
        logPaymentAttempt({ ...attempt, status: "failed", errorCode });
        return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
      }
    }

    if (payload.method === "fitcoins" || payload.useFitcoins) {
      if (payload.fitcoinsToUse > 0) {
        const ledgerDesc = `Reserva: ${courtName}`;
        const ledgerSuccess = await useWalletStore.getState().redeem(payload.fitcoinsToUse, ledgerDesc);
        if (!ledgerSuccess && !isDemo) {
          const errorCode = "FITCOINS_INSUFFICIENT";
          const error = "Saldo de FitCoins insuficiente para completar esta transacción.";
          set({ isProcessing: false, status: "failed", error, errorCode });
          logPaymentAttempt({ ...attempt, status: "failed", errorCode });
          return { success: false, amountCharged: 0, fitcoinsUsed: 0, errorCode };
        }
      }
    }

    const txId = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    set({ isProcessing: false, status: "success", transactionId: txId, error: null, errorCode: null, lastPaymentMethod: payload.method });
    logPaymentAttempt({ ...attempt, status: "success", errorCode: undefined });
    return {
      success: true,
      transactionId: txId,
      amountCharged: payload.amount,
      fitcoinsUsed: payload.fitcoinsToUse,
    };
  },

  resetPayment: () => {
    set({ isProcessing: false, status: "idle", transactionId: null, error: null, errorCode: null, lastPaymentMethod: null });
  },
}));
