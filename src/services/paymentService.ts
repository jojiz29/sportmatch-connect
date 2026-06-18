import { PaymentMethod } from "@/shared/lib/paymentUtils";

export interface PaymentAttemptLog {
  id: string;
  timestamp: string;
  courtName: string;
  method: PaymentMethod;
  amount: number;
  status: "success" | "failed" | "partial_failure";
  errorCode?: string;
}

const STORAGE_KEY = "sportmatch_payment_attempts";

export function logPaymentAttempt(attempt: PaymentAttemptLog): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const records: PaymentAttemptLog[] = stored ? JSON.parse(stored) : [];
    records.unshift(attempt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
  } catch (error) {
    console.warn("No se pudo guardar el log del intento de pago:", error);
  }
}
