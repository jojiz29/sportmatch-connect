import { create } from "zustand";
import { useAuthStore } from "@/entities/user/useAuth";
import { useWalletStore } from "@/features/wallet/useWalletStore";

interface PaymentGatewayState {
  isProcessing: boolean;
  status: "idle" | "processing" | "success" | "failed";
  transactionId: string | null;
  error: string | null;
  processPayment: (cost: number, courtName: string) => Promise<boolean>;
  resetPayment: () => void;
}

export const usePaymentGatewayStore = create<PaymentGatewayState>((set) => ({
  isProcessing: false,
  status: "idle",
  transactionId: null,
  error: null,

  processPayment: async (cost: number, courtName: string) => {
    set({ isProcessing: true, status: "processing", error: null, transactionId: null });

    // Simulate network latency (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const isDemo = useAuthStore.getState().isDemoMode;
    // Guided Demo has 100% success rate. Real mode has 95% success rate.
    const isSuccess = isDemo ? true : Math.random() < 0.95;

    if (!isSuccess) {
      const errorMsg =
        "La pasarela de pago (Niubiz/Stripe) rechazó la transacción. Por favor, intente con otra tarjeta.";
      set({
        isProcessing: false,
        status: "failed",
        error: errorMsg,
      });
      return false;
    }

    const txId = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // Deduct cost and update Fitcoins ledger
    const ledgerDesc = `Reserva: ${courtName}`;
    const ledgerSuccess = await useWalletStore.getState().redeem(cost, ledgerDesc);

    if (!ledgerSuccess && !isDemo) {
      set({
        isProcessing: false,
        status: "failed",
        error: "Saldo de FitCoins insuficiente para completar esta transacción.",
      });
      return false;
    }

    set({
      isProcessing: false,
      status: "success",
      transactionId: txId,
      error: null,
    });
    return true;
  },

  resetPayment: () => {
    set({ isProcessing: false, status: "idle", transactionId: null, error: null });
  },
}));
