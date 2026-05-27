import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_TRANSACTIONS, MOCK_USERS } from "@/lib/mock";
import { Transaction } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";

interface WalletState {
  balance: number;
  transactions: Transaction[];
  initWallet: () => void;
  redeem: (cost: number, description: string) => boolean;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],

      initWallet: () => {
        const user = useAuthStore.getState().user;
        if (user) {
          set({
            balance: user.fitcoins_balance,
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

        return true;
      },
    }),
    {
      name: "sportmatch-wallet",
    },
  ),
);

// Subscribe to useAuthStore changes
useAuthStore.subscribe(() => {
  useWalletStore.getState().initWallet();
});
