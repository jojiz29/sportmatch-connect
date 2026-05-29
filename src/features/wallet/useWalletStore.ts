import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Transaction } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "@/shared/api/supabase";
import { apiClient } from "@/shared/api/apiClient";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { createNotification } from "@/shared/api/notificationService";
import { toast } from "sonner";

export interface Challenge {
  id: string;
  name: string;
  progress: number;
  total: number;
  reward: number;
  claimed: boolean;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  challenges: Challenge[];
  initWallet: () => Promise<void>;
  redeem: (cost: number, description: string) => Promise<boolean>;
  purchaseItem: (cost: number, itemName: string, sellerId: string) => Promise<boolean>;
  progressChallenge: (id: string) => void;
  claimChallenge: (id: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      challenges: [
        {
          id: "ch1",
          name: "Jugá 3 partidos esta semana",
          progress: 2,
          total: 3,
          reward: 150,
          claimed: false,
        },
        {
          id: "ch2",
          name: "Mantené Trust Score > 90",
          progress: 93,
          total: 100,
          reward: 200,
          claimed: false,
        },
        {
          id: "ch3",
          name: "Invitá a 2 amigos",
          progress: 1,
          total: 2,
          reward: 300,
          claimed: false,
        },
      ],

      initWallet: async () => {
        const user = useAuthStore.getState().user;
        if (user) {
          const state = get();
          const currentChallenges =
            state.challenges && state.challenges.length > 0
              ? state.challenges
              : [
                  {
                    id: "ch1",
                    name: "Jugá 3 partidos esta semana",
                    progress: 2,
                    total: 3,
                    reward: 150,
                    claimed: false,
                  },
                  {
                    id: "ch2",
                    name: "Mantené Trust Score > 90",
                    progress: 93,
                    total: 100,
                    reward: 200,
                    claimed: false,
                  },
                  {
                    id: "ch3",
                    name: "Invitá a 2 amigos",
                    progress: 1,
                    total: 2,
                    reward: 300,
                    claimed: false,
                  },
                ];

          try {
            const balance = await apiClient.wallet.getBalance(user.id);
            const transactions = await apiClient.wallet.getTransactions(user.id);

            if (user.fitcoins_balance !== balance) {
              useAuthStore.setState({ user: { ...user, fitcoins_balance: balance } });
            }

            set({
              balance,
              challenges: currentChallenges,
              transactions,
            });
          } catch (e) {
            console.error("Error loading wallet details from DB:", e);
            set({
              balance: user.fitcoins_balance,
              challenges: currentChallenges,
            });
          }
        } else {
          set({
            balance: 0,
            transactions: [],
          });
        }
      },

      redeem: async (cost, description) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        const { balance } = get();
        if (balance < cost) return false;

        const newBalance = balance - cost;

        // Optimistic update
        set({
          balance: newBalance,
        });
        useAuthStore.setState({ user: { ...user, fitcoins_balance: newBalance } });

        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ fitcoins_balance: newBalance })
            .eq("id", user.id);
          if (profileError) throw profileError;

          const newTransaction = {
            user_id: user.id,
            amount: -cost,
            description,
            type: "SPEND",
          };

          const { data: insertedTx, error: txError } = await supabase
            .from("wallet_transactions")
            .insert(newTransaction)
            .select()
            .single();
          if (txError) throw txError;

          if (insertedTx) {
            set((state) => ({
              transactions: [insertedTx as Transaction, ...state.transactions],
            }));
          }

          createNotification(
            user.id,
            "TRANSACTION_SUCCESS",
            "Canje Exitoso",
            `Canjeaste: ${description.replace("Canje: ", "")} por ${cost} FC.`,
            "/app/wallet/history",
          ).catch((e) => console.warn(e));

          return true;
        } catch (e) {
          console.error("Error during redeem:", e);
          // Rollback
          set({ balance });
          useAuthStore.setState({ user });
          return false;
        }
      },

      purchaseItem: async () => {
        // Handled via purchaseCatalogItem in businessService.ts.
        return false;
      },

      progressChallenge: (id) => {
        set((state) => {
          const updated = state.challenges.map((c) => {
            if (c.id === id) {
              const newProgress = Math.min(c.progress + 1, c.total);
              return { ...c, progress: newProgress };
            }
            return c;
          });
          return { challenges: updated };
        });
      },

      claimChallenge: async (id) => {
        const { challenges, balance } = get();
        const challenge = challenges.find((c) => c.id === id);
        if (!challenge || challenge.claimed || challenge.progress < challenge.total) return;

        const user = useAuthStore.getState().user;
        if (!user) return;

        const newBalance = balance + challenge.reward;

        // Optimistic update
        const updatedChallenges = challenges.map((c) => {
          if (c.id === id) {
            return { ...c, claimed: true };
          }
          return c;
        });

        set({
          balance: newBalance,
          challenges: updatedChallenges,
        });
        useAuthStore.setState({ user: { ...user, fitcoins_balance: newBalance } });

        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ fitcoins_balance: newBalance })
            .eq("id", user.id);
          if (profileError) throw profileError;

          const newTransaction = {
            user_id: user.id,
            amount: challenge.reward,
            description: `Reto completado: ${challenge.name}`,
            type: "EARN",
          };

          const { data: insertedTx, error: txError } = await supabase
            .from("wallet_transactions")
            .insert(newTransaction)
            .select()
            .single();
          if (txError) throw txError;

          if (insertedTx) {
            set((state) => ({
              transactions: [insertedTx as Transaction, ...state.transactions],
            }));
          }

          toast.success(`¡Reclamaste +${challenge.reward} FitCoins! 🏆`);
        } catch (e) {
          console.error("Error during claimChallenge:", e);
          // Rollback
          set({
            balance,
            challenges,
          });
          useAuthStore.setState({ user });
          toast.error("Error al reclamar la recompensa");
        }
      },
    }),
    {
      name: "sportmatch-wallet",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

// Subscribe to useAuthStore changes.
// Only triggers initWallet when the user ID actually changes (login/logout),
// preventing redundant fetches on unrelated auth state ticks.
let _prevWalletUserId: string | null = null;
useAuthStore.subscribe((state) => {
  const userId = state.user?.id ?? null;
  if (userId !== _prevWalletUserId) {
    _prevWalletUserId = userId;
    useWalletStore.getState().initWallet();
  }
});
