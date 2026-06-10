import { useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { PaymentMethod } from "@/shared/lib/paymentUtils";
import { stripePromise, isStripeConfigured } from "@/shared/lib/stripe";

export interface PaymentSelection {
  method: PaymentMethod;
  useFitcoins: boolean;
  fitcoinsToUse: number;
  cardHolderName?: string;
}

interface PaymentCheckoutProps {
  cost: number;
  userBalance: number;
  onConfirm: (
    selection: PaymentSelection,
    stripe?: Stripe | null,
    elements?: StripeElements | null,
  ) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

const cardElementOptions = {
  style: {
    base: {
      color: "#f8fafc",
      fontSize: "15px",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      "::placeholder": {
        color: "#94a3b8",
      },
      letterSpacing: "0.01em",
    },
    invalid: {
      color: "#fb7185",
    },
  },
  hidePostalCode: true,
};

function PaymentCheckoutForm({
  cost,
  userBalance,
  onConfirm,
  isProcessing,
  disabled,
}: PaymentCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [useFitcoins, setUseFitcoins] = useState(userBalance > 0);
  const [cardHolder, setCardHolder] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState("");
  const [cardHolderTouched, setCardHolderTouched] = useState(false);

  const CARD_HOLDER_MAX_LENGTH = 30;
  const availableFitcoins = Math.min(userBalance, cost);
  const fitcoinsToUse = useFitcoins ? availableFitcoins : 0;
  const amountToCharge = Math.max(0, cost - fitcoinsToUse);
  const cardHolderValid = amountToCharge === 0 || cardHolder.trim().length >= 3;
  const cardHolderError = (() => {
    if (amountToCharge === 0) return "";
    if (!cardHolderTouched && !cardHolder) return "";

    const trimmed = cardHolder.trim();
    if (!trimmed) return "El nombre del titular es obligatorio.";
    if (trimmed.length < 3) return "El nombre del titular debe tener al menos 3 caracteres.";
    return "";
  })();

  const paymentDisabled = disabled
    || isProcessing
    || (amountToCharge > 0 && (!cardComplete || !cardHolderValid));

  const handleConfirm = () => {
    if (paymentDisabled) return;
    onConfirm(
      {
        method: "card",
        useFitcoins,
        fitcoinsToUse,
        cardHolderName: cardHolder.trim(),
      },
      stripe,
      elements,
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border/70 p-4 bg-card/80">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Tarjeta débito/crédito</p>
            <p className="text-xs text-muted-foreground leading-relaxed break-words">
              Ingresa los datos de tu tarjeta para pagar el resto de tu reserva.
            </p>
          </div>
          <div className="rounded-full px-3 py-1 bg-muted text-[11px] uppercase tracking-[0.2em] font-semibold">
            Tarjeta
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-background p-4 space-y-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Nombre del titular
            <input
              type="text"
              autoComplete="cc-name"
              value={cardHolder}
              onChange={(event) => setCardHolder(event.target.value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "").slice(0, CARD_HOLDER_MAX_LENGTH))}
              onBlur={() => setCardHolderTouched(true)}
              placeholder="Nombre como en la tarjeta"
              className={`mt-2 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-primary ${!cardHolderValid && cardHolder ? "border-rose-500" : "border-border/60"}`}
              maxLength={CARD_HOLDER_MAX_LENGTH}
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <p className={`min-h-[1.2rem] ${cardHolderError ? "text-rose-500" : "text-muted-foreground"}`}>
                {cardHolderError || "Solo se permiten letras, espacios, guiones y apóstrofes."}
              </p>
              <span className="text-muted-foreground">{cardHolder.length}/{CARD_HOLDER_MAX_LENGTH}</span>
            </div>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Datos de la tarjeta
            <div className="mt-2 rounded-2xl border border-border/60 bg-background p-3">
              <CardElement
                options={cardElementOptions}
                onChange={(event) => {
                  setCardComplete(event.complete);
                  setCardError(event.error?.message || "");
                }}
              />
            </div>
            {cardError ? <p className="mt-2 text-[11px] text-rose-500">{cardError}</p> : null}
          </label>
          {amountToCharge === 0 ? (
            <div className="rounded-2xl bg-emerald-900/10 border border-emerald-500/30 p-3 text-sm text-emerald-300">
              El total está cubierto con FitCoins. No se requiere tarjeta para completar este pago.
            </div>
          ) : null}

          {userBalance > 0 && (
            <button
              type="button"
              className="inline-flex items-center justify-between w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-semibold text-foreground"
              onClick={() => setUseFitcoins((prev) => !prev)}
            >
              <span>Usar mis FitCoins disponibles como descuento</span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${useFitcoins ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                {useFitcoins ? "Activado" : "Desactivado"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 p-4 bg-background/80 space-y-3 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Costo total</span>
          <span className="font-semibold">S/ {cost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">FitCoins aplicados</span>
          <span className="font-semibold text-emerald-500">-S/ {fitcoinsToUse.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-border/50 pt-3 font-semibold">
          <span>Total a pagar</span>
          <span>S/ {amountToCharge.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={paymentDisabled}
        className="w-full rounded-2xl bg-gradient-primary px-4 py-4 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isProcessing ? "Procesando pago..." : "Confirmar pago"}
      </button>

      <div className="rounded-2xl bg-muted/80 p-3 text-[11px] text-muted-foreground">
        <p className="font-semibold">Seguridad</p>
        <p>No almacenamos tu tarjeta completa ni registramos CVV en ningún log.</p>
      </div>
    </div>
  );
}

export function PaymentCheckout(props: PaymentCheckoutProps) {
  if (!isStripeConfigured) {
    return (
      <div className="rounded-3xl border border-rose-500/40 bg-rose-950/10 p-6 text-sm text-rose-200">
        Stripe no está configurado. Revisa tu `VITE_STRIPE_PUBLISHABLE_KEY` en `.env`.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentCheckoutForm {...props} />
    </Elements>
  );
}

