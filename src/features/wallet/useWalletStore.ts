import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_TRANSACTIONS, MOCK_USERS, syncMockUsersToStorage } from "@/lib/mock";
import { Transaction } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
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
  initWallet: () => void;
  redeem: (cost: number, description: string) => boolean;
  purchaseItem: (cost: number, itemName: string, sellerId: string) => boolean;
  progressChallenge: (id: string) => void;
  claimChallenge: (id: string) => void;
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

      initWallet: () => {
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
          set({
            balance: user.fitcoins_balance,
            challenges: currentChallenges,
            transactions: MOCK_TRANSACTIONS.filter((t) => t.user_id === user.id),
          });
        } else {
          set({
            balance: 0,
            transactions: [],
          });
        }
      },

      redeem: (cost, description) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        const { balance, transactions } = get();
        if (balance < cost) return false;

        const newTransaction: Transaction = {
          id: `txn_${Date.now()}`,
          user_id: user.id,
          amount: -cost,
          description,
          type: "SPEND",
          created_at: new Date().toISOString(),
        };

        const newBalance = balance - cost;

        // Add to mock transactions array
        MOCK_TRANSACTIONS.unshift(newTransaction);

        // Update the user balance in memory for current user references
        user.fitcoins_balance = newBalance;
        const foundInMock = MOCK_USERS.find((u) => u.id === user.id);
        if (foundInMock) {
          foundInMock.fitcoins_balance = newBalance;
        }

        // Update in auth store so components binded to auth user reactively update
        useAuthStore.setState({ user: { ...user, fitcoins_balance: newBalance } });

        set({
          balance: newBalance,
          transactions: [newTransaction, ...transactions],
        });

        syncMockUsersToStorage();

        // Trigger notification
        createNotification(
          user.id,
          "TRANSACTION_SUCCESS",
          "Canje Exitoso",
          `Canjeaste: ${description.replace("Canje: ", "")} por ${cost} FC.`,
          "/app/wallet/history",
        ).catch((e) => console.warn(e));

        return true;
      },

      purchaseItem: (cost, itemName, sellerId) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        const { balance, transactions } = get();
        if (balance < cost) return false;

        const newBalance = balance - cost;

        // 1. Generate SPEND transaction for the buyer (Player)
        const spendTx: Transaction = {
          id: `txn_${Date.now()}_spend`,
          user_id: user.id,
          amount: -cost,
          description: `Compra: ${itemName}`,
          type: "SPEND",
          created_at: new Date().toISOString(),
        };
        MOCK_TRANSACTIONS.unshift(spendTx);

        // 2. Update buyer balance
        user.fitcoins_balance = newBalance;
        const buyerMock = MOCK_USERS.find((u) => u.id === user.id);
        if (buyerMock) {
          buyerMock.fitcoins_balance = newBalance;
        }
        useAuthStore.setState({ user: { ...user, fitcoins_balance: newBalance } });

        // 3. Increment seller balance & generate EARN transaction for the seller (Business)
        const sellerMock = MOCK_USERS.find((u) => u.id === sellerId);
        if (sellerMock) {
          const oldSellerBalance = sellerMock.fitcoins_balance || 0;
          const newSellerBalance = oldSellerBalance + cost;
          sellerMock.fitcoins_balance = newSellerBalance;

          const earnTx: Transaction = {
            id: `txn_${Date.now()}_earn`,
            user_id: sellerId,
            amount: cost,
            description: `Venta: ${itemName} a ${user.name}`,
            type: "EARN",
            created_at: new Date().toISOString(),
          };
          MOCK_TRANSACTIONS.unshift(earnTx);
        }

        set({
          balance: newBalance,
          transactions: [spendTx, ...transactions],
        });

        syncMockUsersToStorage();

        // Trigger TRANSACTION_SUCCESS for buyer (Player)
        createNotification(
          user.id,
          "TRANSACTION_SUCCESS",
          "Compra Exitosa",
          `Compraste ${itemName} por ${cost} FC.`,
          "/app/wallet/history",
        ).catch((e) => console.warn(e));

        // Trigger TRANSACTION_SUCCESS for seller (Business)
        createNotification(
          sellerId,
          "TRANSACTION_SUCCESS",
          "Venta Completada",
          `Vendiste ${itemName} a ${user.name} por ${cost} FC.`,
          "/app/business",
        ).catch((e) => console.warn(e));

        return true;
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

      claimChallenge: (id) => {
        const { challenges, balance, transactions } = get();
        const challenge = challenges.find((c) => c.id === id);
        if (!challenge || challenge.claimed || challenge.progress < challenge.total) return;

        const user = useAuthStore.getState().user;
        if (!user) return;

        const newBalance = balance + challenge.reward;

        const newTransaction: Transaction = {
          id: `txn_${Date.now()}`,
          user_id: user.id,
          amount: challenge.reward,
          description: `Reto completado: ${challenge.name}`,
          type: "EARN",
          created_at: new Date().toISOString(),
        };

        // Add to mock transactions array
        MOCK_TRANSACTIONS.unshift(newTransaction);

        // Update user balances
        user.fitcoins_balance = newBalance;
        const foundInMock = MOCK_USERS.find((u) => u.id === user.id);
        if (foundInMock) {
          foundInMock.fitcoins_balance = newBalance;
        }

        useAuthStore.setState({ user: { ...user, fitcoins_balance: newBalance } });

        const updatedChallenges = challenges.map((c) => {
          if (c.id === id) {
            return { ...c, claimed: true };
          }
          return c;
        });

        set({
          balance: newBalance,
          challenges: updatedChallenges,
          transactions: [newTransaction, ...transactions],
        });

        toast.success(`¡Reclamaste +${challenge.reward} FitCoins! 🏆`);
      },
    }),
    {
      name: "sportmatch-wallet",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

// Subscribe to useAuthStore changes
useAuthStore.subscribe(() => {
  useWalletStore.getState().initWallet();
});
