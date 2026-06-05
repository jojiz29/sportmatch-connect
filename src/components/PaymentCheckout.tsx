import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  formatPhone,
  PaymentMethod,
  sanitizeCardNumber,
  validateCardNumber,
  validateExpiry,
  validatePhoneNumber,
} from "@/shared/lib/paymentUtils";

export interface PaymentCardData {
  holderName: string;
  number: string;
  expiry: string;
  cvv: string;
}

export interface PaymentSelection {
  method: PaymentMethod;
  useFitcoins: boolean;
  fitcoinsToUse: number;
  card?: PaymentCardData;
  phone?: string;
}

interface PaymentCheckoutProps {
  cost: number;
  userBalance: number;
  onConfirm: (selection: PaymentSelection) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

const methodLabels: Record<PaymentMethod, string> = {
  fitcoins: "FitCoins",
  card: "Tarjeta débito/crédito",
  yape: "Yape",
  plin: "Plin",
};

const methodDescriptions: Record<PaymentMethod, string> = {
  fitcoins: "Paga con el saldo de FitCoins disponible en tu billetera.",
  card: "Ingresa los datos de tu tarjeta para pagar el resto.",
  yape: "Recibe la solicitud de cobro en tu app Yape.",
  plin: "Recibe la solicitud de cobro en tu app Plin.",
};

export function PaymentCheckout({ cost, userBalance, onConfirm, isProcessing, disabled }: PaymentCheckoutProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("fitcoins");
  const [useFitcoins, setUseFitcoins] = useState(true);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [phone, setPhone] = useState("");
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const availableFitcoins = Math.min(userBalance, cost);
  const canCoverWithFitcoins = userBalance >= cost;
  const fitcoinsToUse = selectedMethod === "fitcoins" ? cost : useFitcoins ? availableFitcoins : 0;
  const amountToCharge = Math.max(0, cost - fitcoinsToUse);

  const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
  const sanitizedPhone = useMemo(() => formatPhone(phone), [phone]);
  const sanitizedCardNumber = useMemo(() => sanitizeCardNumber(cardNumber), [cardNumber]);

  const cardNumberValid = selectedMethod === "card" ? validateCardNumber(cardNumber) : true;
  const cardHolderValid = selectedMethod === "card" ? cardHolder.trim().length >= 3 : true;
  const cardExpiryValid = selectedMethod === "card" ? validateExpiry(cardExpiry) : true;
  const cardCvvValid = selectedMethod === "card" ? /^[0-9]{3,4}$/.test(cardCvv) : true;
  const phoneValid = selectedMethod === "yape" || selectedMethod === "plin" ? validatePhoneNumber(sanitizedPhone) : true;

  const showFitcoinToggle = selectedMethod === "card" && userBalance > 0;
  const cardErrors = useMemo(() => {
    if (selectedMethod !== "card") return [];
    const errors: string[] = [];
    if (touchedFields.cardNumber && !cardNumberValid) errors.push("Número de tarjeta inválido.");
    if (touchedFields.cardHolder && !cardHolderValid) errors.push("Nombre del titular es requerido.");
    if (touchedFields.cardExpiry && !cardExpiryValid) errors.push("Fecha de vencimiento inválida o vencida.");
    if (touchedFields.cardCvv && !cardCvvValid) errors.push("CVV inválido.");
    return errors;
  }, [selectedMethod, touchedFields, cardNumberValid, cardHolderValid, cardExpiryValid, cardCvvValid]);

  const paymentDisabled = useMemo(() => {
    if (disabled || isProcessing) return true;
    if (selectedMethod === "fitcoins") return !canCoverWithFitcoins;
    if (selectedMethod === "card") return !(cardNumberValid && cardHolderValid && cardExpiryValid && cardCvvValid);
    if (selectedMethod === "yape" || selectedMethod === "plin") return !phoneValid;
    return true;
  }, [selectedMethod, disabled, isProcessing, canCoverWithFitcoins, cardNumberValid, cardHolderValid, cardExpiryValid, cardCvvValid, phoneValid]);

  useEffect(() => {
    if (selectedMethod !== "card") {
      setUseFitcoins(true);
    }
  }, [selectedMethod]);

  const handleConfirm = () => {
    if (paymentDisabled) return;
    onConfirm({
      method: selectedMethod,
      useFitcoins: selectedMethod === "fitcoins" || useFitcoins,
      fitcoinsToUse,
      card: selectedMethod === "card"
        ? {
            holderName: cardHolder.trim(),
            number: sanitizedCardNumber,
            expiry: cardExpiry,
            cvv: cardCvv,
          }
        : undefined,
      phone: selectedMethod === "yape" || selectedMethod === "plin" ? sanitizedPhone : undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border/70 p-4 bg-card/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">Método de pago</p>
            <p className="text-xs text-muted-foreground">Selecciona cómo quieres pagar tu reserva</p>
          </div>
          <div className="rounded-full px-3 py-1 bg-muted text-[11px] uppercase tracking-[0.2em] font-semibold">
            {availableFitcoins} FC</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(methodLabels) as PaymentMethod[]).map((method) => {
            const selected = selectedMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethod(method)}
                className={`text-left rounded-2xl border p-3 transition-all ${selected ? "border-neon bg-neon/10" : "border-border/50 bg-background hover:border-primary"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-sm">{methodLabels[method]}</div>
                  <div className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] font-semibold">
                    {method === "fitcoins" ? "Saldo" : method === "card" ? "Tarjeta" : method.toUpperCase()}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
                  {methodDescriptions[method]}
                </p>
                {method === "fitcoins" && (
                  <p className={`mt-3 text-xs font-semibold ${canCoverWithFitcoins ? "text-emerald-500" : "text-rose-500"}`}>
                    {canCoverWithFitcoins ? "Tu saldo cubre el total" : "Saldo insuficiente para cubrir el total"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedMethod === "card" && (
        <div className="rounded-3xl border border-border/70 p-4 bg-card/80 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Datos de la tarjeta</p>
              <p className="text-xs text-muted-foreground">No se almacena el número completo de la tarjeta.</p>
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              {cardBrand}
            </div>
          </div>

          <div className="grid gap-3">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Número de tarjeta
              <input
                type="text"
                inputMode="numeric"
                value={cardNumber}
                onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                onBlur={() => setTouchedFields((prev) => ({ ...prev, cardNumber: true }))}
                placeholder="0000 0000 0000 0000"
                className="mt-2 w-full rounded-2xl border border-border/60 bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                maxLength={19}
              />
            </label>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Nombre del titular
              <input
                type="text"
                value={cardHolder}
                onChange={(event) => setCardHolder(event.target.value)}
                onBlur={() => setTouchedFields((prev) => ({ ...prev, cardHolder: true }))}
                placeholder="Nombre como en la tarjeta"
                className="mt-2 w-full rounded-2xl border border-border/60 bg-background px-3 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Fecha (MM/AA)
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardExpiry}
                  onChange={(event) => setCardExpiry(formatExpiry(event.target.value))}
                  onBlur={() => setTouchedFields((prev) => ({ ...prev, cardExpiry: true }))}
                  placeholder="MM/AA"
                  className="mt-2 w-full rounded-2xl border border-border/60 bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                  maxLength={5}
                />
              </label>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                CVV
                <input
                  type="password"
                  inputMode="numeric"
                  value={cardCvv}
                  onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  onBlur={() => setTouchedFields((prev) => ({ ...prev, cardCvv: true }))}
                  placeholder="•••"
                  className="mt-2 w-full rounded-2xl border border-border/60 bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                  maxLength={4}
                />
              </label>
            </div>

            {showFitcoinToggle && (
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

            {cardErrors.length > 0 && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-700">
                {cardErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {(selectedMethod === "yape" || selectedMethod === "plin") && (
        <div className={`rounded-3xl border border-border/70 p-4 bg-card/80 ${selectedMethod === "yape" ? "ring-2 ring-emerald-500/20" : "ring-2 ring-sky-500/20"}`}>
          <div className="flex items-center gap-3 mb-3">
            {selectedMethod === "yape" ? <Smartphone className="h-5 w-5 text-emerald-500" /> : <ShieldCheck className="h-5 w-5 text-sky-500" />}
            <div>
              <p className="text-sm font-semibold">Número de celular</p>
              <p className="text-xs text-muted-foreground">Ingresa el número que recibiría la solicitud de cobro.</p>
            </div>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={sanitizedPhone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
            onBlur={() => setTouchedFields((prev) => ({ ...prev, phone: true }))}
            placeholder="999999999"
            className="w-full rounded-2xl border border-border/60 bg-background px-3 py-3 text-sm outline-none focus:border-primary"
            maxLength={9}
          />
          {touchedFields.phone && !phoneValid && (
            <p className="mt-2 text-xs text-rose-500">Ingresa un número de celular válido de 9 dígitos.</p>
          )}
          <div className="mt-4 rounded-2xl bg-background/70 p-3 text-xs text-muted-foreground">
            {selectedMethod === "yape"
              ? "Acepta el cobro desde tu app de Yape para confirmar la reserva."
              : "Acepta el cobro desde tu app de Plin para continuar con la reserva."}
          </div>
        </div>
      )}

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
