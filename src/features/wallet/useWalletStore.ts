// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Transaction } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "@/shared/api/supabase";
import { apiClient } from "@/shared/api/apiClient";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { createNotification } from "@/shared/api/notificationService";
import { toast } from "sonner";

// === BLOQUE: TIPO DE RETO ===
// Representa un desafío semanal que el usuario puede completar para ganar FitCoins.
export interface Challenge {
  id: string;
  name: string;
  progress: number;
  total: number;
  reward: number;
  claimed: boolean;
}

// === BLOQUE: INTERFAZ DEL ESTADO ===
interface WalletState {
  balance: number;
  transactions: Transaction[];
  challenges: Challenge[];
  initWallet: () => Promise<void>;
  redeem: (cost: number, description: string, rewardId?: string) => Promise<boolean>;
  purchaseItem: (cost: number, itemName: string, sellerId: string) => Promise<boolean>;
  progressChallenge: (id: string) => Promise<void>;
  claimChallenge: (id: string) => Promise<void>;
}

// === BLOQUE: STORE DE MONEDERO ===
// Gestiona el saldo de FitCoins, las transacciones y los retos semanales.
// Persistido en localStorage bajo "sportmatch-wallet".
// Escucha cambios en useAuthStore para inicializar el monedero al iniciar sesión.
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      // Retos semanales predefinidos con progreso y recompensa
      challenges: [
        {
          id: "ch1",
          name: "Jugá 3 partidos esta semana",
          progress: 0,
          total: 3,
          reward: 150,
          claimed: false,
        },
        {
          id: "ch2",
          name: "Mantené Trust Score > 90",
          progress: 0,
          total: 100,
          reward: 200,
          claimed: false,
        },
        {
          id: "ch3",
          name: "Invitá a 2 amigos",
          progress: 0,
          total: 2,
          reward: 300,
          claimed: false,
        },
      ],

      // === INICIALIZACIÓN DEL MONEDERO ===
      // Carga el saldo y las transacciones desde el backend o Supabase.
      // Los retos se inicializan con datos dinámicos del perfil del usuario.
      initWallet: async () => {
        const user = useAuthStore.getState().user;
        if (user) {
          const state = get();

          // Retos dinámicos: toman el progreso real del perfil del usuario
          const dynamicChallenges = [
            {
              id: "ch1",
              name: "Jugá 3 partidos esta semana",
              progress: Math.min(user.matches_played || 0, 3),
              total: 3,
              reward: 150,
              claimed: false,
            },
            {
              id: "ch2",
              name: "Mantené Trust Score > 90",
              progress: user.trust_score || 0,
              total: 100,
              reward: 200,
              claimed: false,
            },
            {
              id: "ch3",
              name: "Invitá a 2 amigos",
              progress: Math.min(user.followers_count || 0, 2),
              total: 2,
              reward: 300,
              claimed: false,
            },
          ];

          // Preserva el estado "claimed" de los retos existentes
          const currentChallenges = dynamicChallenges.map((dc) => {
            const existing = state.challenges?.find((c) => c.id === dc.id);
            return {
              ...dc,
              claimed: existing ? existing.claimed : false,
            };
          });

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

      // === CANJE DE FITCOINS ===
      // Permite gastar FitCoins (redeem) para obtener recompensas.
      // En modo demo opera contra localStorage; en modo real contra Supabase.
      redeem: async (cost, description, rewardId) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        const { balance } = get();
        if (balance < cost) return false;

        // Modo demo: operación local contra localStorage
        if (useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true") {
          const newBalance = balance - cost;
          set({
            balance: newBalance,
          });
          useAuthStore.setState({ user: { ...user, fitcoins_balance: newBalance } });

          const newTransaction: Transaction = {
            id: `demo-tx-${Date.now()}`,
            user_id: user.id,
            amount: -cost,
            description,
            type: "SPEND",
            created_at: new Date().toISOString(),
          };
          apiClient.wallet.updateBalance(user.id, newBalance);
          apiClient.wallet.saveTransaction(user.id, newTransaction);
          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
          }));
          createNotification(
            user.id,
            "TRANSACTION_SUCCESS",
            "Canje Exitoso (Demo)",
            `Canjeaste: ${description.replace("Canje: ", "")} por ${cost} FC.`,
            "/app/wallet/history",
          ).catch((e) => console.warn(e));
          return true;
        }

        // Modo real: operación contra backend + Supabase
        try {
          if (rewardId) {
            const { redeemReward } = await import("@/services/walletService");
            const success = await redeemReward(user.id, rewardId);
            if (success) {
              const balanceVal = await apiClient.wallet.getBalance(user.id);
              const transactionsVal = await apiClient.wallet.getTransactions(user.id);
              set({ balance: balanceVal, transactions: transactionsVal });
              useAuthStore.setState({ user: { ...user, fitcoins_balance: balanceVal } });

              createNotification(
                user.id,
                "TRANSACTION_SUCCESS",
                "Canje Exitoso",
                `Canjeaste: ${description.replace("Canje: ", "")} por ${cost} FC.`,
                "/app/wallet/history",
              ).catch((e) => console.warn(e));

              return true;
            }
            return false;
          } else {
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
              const balanceVal = await apiClient.wallet.getBalance(user.id);
              set({ balance: balanceVal });
              useAuthStore.setState({ user: { ...user, fitcoins_balance: balanceVal } });
            }

            createNotification(
              user.id,
              "TRANSACTION_SUCCESS",
              "Canje Exitoso",
              `Canjeaste: ${description.replace("Canje: ", "")} por ${cost} FC.`,
              "/app/wallet/history",
            ).catch((e) => console.warn(e));

            return true;
          }
        } catch (err) {
          const { handleWalletError } = await import("@/services/walletService");
          const handled = handleWalletError(err);
          if (!handled) {
            const e = err as { code?: string; message?: string };
            console.error(`Error during redeem:`, err);
            toast.error(`Error al reclamar la recompensa: ${e?.message || String(err)}`);
          }
          return false;
        }
      },

      // === COMPRA DE ARTÍCULO ===
      // Delegado a purchaseCatalogItem en businessService.ts.
      purchaseItem: async () => {
        return false;
      },

      // === PROGRESO DE RETO ===
      // Incrementa el progreso de un reto y lo reclama automáticamente si se completa.
      progressChallenge: async (id) => {
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

        const { challenges, claimChallenge } = get();
        const challenge = challenges.find((c) => c.id === id);
        if (challenge && challenge.progress >= challenge.total && !challenge.claimed) {
          await claimChallenge(id);
        }
      },

      // === RECLAMAR RECOMPENSA DE RETO ===
      // Actualización optimista: acredita los FitCoins de inmediato.
      // En modo real persiste la transacción en Supabase.
      // Si falla, revierte el estado (rollback).
      claimChallenge: async (id) => {
        const { challenges, balance } = get();
        const challenge = challenges.find((c) => c.id === id);
        if (!challenge || challenge.claimed || challenge.progress < challenge.total) return;

        const user = useAuthStore.getState().user;
        if (!user) return;

        const newBalance = balance + challenge.reward;

        // Actualización optimista
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

        // Modo demo: operación local
        if (useAuthStore.getState().isDemoMode) {
          const newTransaction: Transaction = {
            id: `demo-tx-${Date.now()}`,
            user_id: user.id,
            amount: challenge.reward,
            description: `Reto completado: ${challenge.name}`,
            type: "EARN",
            created_at: new Date().toISOString(),
          };
          apiClient.wallet.updateBalance(user.id, newBalance);
          apiClient.wallet.saveTransaction(user.id, newTransaction);
          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
          }));
          toast.success(`¡Reclamaste +${challenge.reward} FitCoins! 🏆`);
          return;
        }

        // Modo real: persiste en Supabase
        try {
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
        } catch (err) {
          const e = err as { code?: string; message?: string };
          console.error(`Error during claimChallenge (code: ${e?.code}):`, err);
          const code = e?.code ? ` (${e.code})` : "";
          toast.error(`Error al reclamar la recompensa: ${e?.message || String(err)}${code}`);
          // Rollback: restaura el balance y los retos al estado anterior
          set({
            balance,
            challenges,
          });
          useAuthStore.setState({ user });
        }
      },
    }),
    {
      name: "sportmatch-wallet",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

// === BLOQUE: SUSCRIPCIÓN A CAMBIOS DE AUTENTICACIÓN ===
// Inicializa el monedero solo cuando cambia el ID del usuario (login/logout),
// evitando recargas innecesarias en otros cambios de estado.
let _prevWalletUserId: string | null = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const userId = state.user?.id ?? null;
  if (userId !== _prevWalletUserId) {
    _prevWalletUserId = userId;
    useWalletStore.getState().initWallet();
  }
});
