import { useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { PaymentMethod } from "@/shared/lib/paymentUtils";
import { stripePromise, isStripeConfigured } from "@/shared/lib/stripe";
import { useAuthStore } from "@/entities/user/useAuth";

export interface PaymentSelection {
  method: PaymentMethod;
  cardHolderName?: string;
}

interface PaymentCheckoutProps {
  cost: number;
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
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

function PaymentCheckoutForm({ onConfirm, isProcessing, disabled }: PaymentCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardHolder, setCardHolder] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState("");
  const [cardHolderTouched, setCardHolderTouched] = useState(false);

  const CARD_HOLDER_MAX_LENGTH = 30;
  const cardHolderValid = cardHolder.trim().length >= 3;
  const cardHolderError = (() => {
    if (!cardHolderTouched && !cardHolder) return "";

    const trimmed = cardHolder.trim();
    if (!trimmed) return "El nombre del titular es obligatorio.";
    if (trimmed.length < 3) return "El nombre del titular debe tener al menos 3 caracteres.";
    return "";
  })();

  const paymentDisabled = disabled || isProcessing || !cardComplete || !cardHolderValid;

  const handleConfirm = () => {
    if (paymentDisabled) return;
    onConfirm(
      {
        method: "card",
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
              onChange={(event) =>
                setCardHolder(
                  event.target.value
                    .replace(/[^A-Za-zÀ-ÿ\s'-]/g, "")
                    .slice(0, CARD_HOLDER_MAX_LENGTH),
                )
              }
              onBlur={() => setCardHolderTouched(true)}
              placeholder="Nombre como en la tarjeta (mín. 3 letras)"
              className={`mt-2 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-primary ${!cardHolderValid && cardHolder ? "border-rose-500" : "border-border/60"}`}
              minLength={3}
              maxLength={CARD_HOLDER_MAX_LENGTH}
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <p
                className={`min-h-[1.2rem] ${cardHolderError ? "text-rose-500" : "text-muted-foreground"}`}
              >
                {cardHolderError || "Solo se permiten letras, espacios, guiones y apóstrofes."}
              </p>
              <span className="text-muted-foreground">
                {cardHolder.length}/{CARD_HOLDER_MAX_LENGTH}
              </span>
            </div>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Datos de la tarjeta
            {!stripe || !elements ? (
              <div className="space-y-3 mt-2">
                <div className="rounded-2xl border border-border/60 bg-background p-3">
                  <input
                    type="text"
                    placeholder="Número de tarjeta simulado (16 dígitos)"
                    className="w-full bg-transparent text-sm outline-none text-white border-0"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setCardComplete(val.length >= 16);
                    }}
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-border/60 bg-background p-3">
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full bg-transparent text-sm outline-none text-white border-0"
                      maxLength={5}
                    />
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background p-3">
                    <input
                      type="password"
                      placeholder="CVC"
                      className="w-full bg-transparent text-sm outline-none text-white border-0"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-border/60 bg-background p-3">
                <CardElement
                  options={cardElementOptions}
                  onChange={(event) => {
                    setCardComplete(event.complete);
                    setCardError(event.error?.message || "");
                  }}
                />
              </div>
            )}
            {cardError ? <p className="mt-2 text-[11px] text-rose-500">{cardError}</p> : null}
          </label>
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
  const isDemo = useAuthStore((s) => s.isDemoMode);

  if (!isStripeConfigured && !isDemo) {
    return (
      <div className="rounded-3xl border border-rose-500/40 bg-rose-950/10 p-6 text-sm text-rose-200">
        Stripe no está configurado. Revisa tu `VITE_STRIPE_PUBLISHABLE_KEY` en `.env`.
      </div>
    );
  }

  if (!isStripeConfigured && isDemo) {
    return <PaymentCheckoutForm {...props} />;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentCheckoutForm {...props} />
    </Elements>
  );
}
