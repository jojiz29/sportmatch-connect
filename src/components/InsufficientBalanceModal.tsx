import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { AlertCircle, ArrowRight, Coins } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cost: number;
  balance: number;
}

export function InsufficientBalanceModal({
  isOpen,
  onOpenChange,
  cost,
  balance,
}: InsufficientBalanceModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border border-border rounded-3xl p-6 text-center">
        <DialogHeader className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500 shadow-glow">
            <AlertCircle className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-extrabold text-white">
            Saldo Insuficiente
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            No tienes suficientes FitCoins para completar esta transacción.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Costo de la transacción:</span>
            <span className="font-bold text-white flex items-center gap-1">
              {cost} <Coins className="h-4 w-4 text-neon" />
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Tu saldo actual:</span>
            <span className="font-bold text-red-400 flex items-center gap-1">
              {balance} <Coins className="h-4 w-4 text-red-400" />
            </span>
          </div>
          <div className="pt-2 border-t border-border/50 flex justify-between items-center text-xs font-semibold text-warning">
            <span>Faltan:</span>
            <span>{cost - balance} FitCoins</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/app/wallet", search: { buyItem: undefined } });
            }}
            className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-glow flex items-center justify-center gap-2 cursor-pointer"
          >
            Ir a la Billetera <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-3 rounded-xl glass border border-border text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
