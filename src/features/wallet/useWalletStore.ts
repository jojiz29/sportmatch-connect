import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_TRANSACTIONS, MOCK_USERS, syncMockUsersToStorage } from "@/lib/mock";
import { Transaction } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { createNotification } from "@/shared/api/notificationService";
import { apiClient } from "@/shared/api/apiClient";

interface WalletState {
  balance: number;
  transactions: Transaction[];
  initWallet: () => void;
  redeem: (cost: number, description: string) => Promise<boolean>;
  purchaseItem: (cost: number, itemName: string, sellerId: string) => boolean;
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

      redeem: async (cost, description) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        const { balance, transactions } = get();
        if (balance < cost) return false;

        try {
          // Persist the transaction and update balance in Supabase/Mocks
          const tx = await apiClient.wallet.createTransaction(
            user.id,
            -cost,
            description,
            "SPEND",
          );

          const newBalance = balance - cost;

          // Add to mock transactions array
          MOCK_TRANSACTIONS.unshift(tx);

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
            transactions: [tx, ...transactions],
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
        } catch (error) {
          console.error("Redemption failed:", error);
          return false;
        }
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
