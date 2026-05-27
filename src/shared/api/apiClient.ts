import { supabase } from "./supabase";
import { User, Court, Transaction } from "@/entities/types";
import { MOCK_USERS, MOCK_COURTS, MOCK_TRANSACTIONS } from "@/lib/mock";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

// Helper genérico para manejar respuestas tipadas y catch de errores
async function fetchSupabase<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("No data returned");
  return data;
}

export const apiClient = {
  users: {
    async getMatches(): Promise<User[]> {
      if (USE_MOCKS) return Promise.resolve(MOCK_USERS.filter((_, i) => i > 0));
      return fetchSupabase<User[]>(supabase.from("users").select("*"));
    },
  },

  wallet: {
    async getBalance(userId: string): Promise<number> {
      if (USE_MOCKS) {
        const user = MOCK_USERS.find((u) => u.id === userId);
        return Promise.resolve(user?.fitcoins_balance || 0);
      }
      const data = await fetchSupabase<{ fitcoins_balance: number }>(
        supabase.from("users").select("fitcoins_balance").eq("id", userId).single(),
      );
      return data.fitcoins_balance;
    },
    async getTransactions(userId: string): Promise<Transaction[]> {
      if (USE_MOCKS) return Promise.resolve(MOCK_TRANSACTIONS.filter((t) => t.user_id === userId));
      return fetchSupabase<Transaction[]>(
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      );
    },
  },

  courts: {
    async getAll(): Promise<Court[]> {
      if (USE_MOCKS) return Promise.resolve(MOCK_COURTS);
      return fetchSupabase<Court[]>(supabase.from("courts").select("*"));
    },
  },
};
