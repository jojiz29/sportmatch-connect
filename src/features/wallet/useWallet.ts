import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export function useWallet() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const myId = user?.id || "unknown";

  const { data: balance = 0, isLoading: loadingBalance } = useQuery({
    queryKey: ["wallet", "balance", myId],
    queryFn: () => apiClient.wallet.getBalance(myId),
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["wallet", "transactions", myId],
    queryFn: () => apiClient.wallet.getTransactions(myId),
  });

  // Suscripción Real-time para transacciones
  useEffect(() => {
    if (USE_MOCKS) return;

    const channel = supabase
      .channel("public:transactions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${myId}` },
        (payload) => {
          const amount = payload.new.amount;
          if (amount > 0) toast.success(`¡Recibiste ${amount} FitCoins! 🏆`);
          else toast(`Se dedujeron ${Math.abs(amount)} FitCoins de tu billetera.`);

          queryClient.invalidateQueries({ queryKey: ["wallet", "balance", myId] });
          queryClient.invalidateQueries({ queryKey: ["wallet", "transactions", myId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, queryClient]);

  return {
    balance,
    transactions,
    isLoading: loadingBalance || loadingTx,
  };
}
