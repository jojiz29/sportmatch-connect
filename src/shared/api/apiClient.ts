import { supabase } from "./supabase";
import { User, Court, Match, Transaction } from "@/entities/types";
import { MOCK_USERS, MOCK_COURTS, MOCK_TRANSACTIONS, MOCK_MATCHES } from "@/lib/mock";

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

async function loadMatchesFromDb(): Promise<Match[]> {
  const matches = await fetchSupabase<Match[]>(supabase.from("matches").select("*"));
  const courts = await fetchSupabase<Court[]>(supabase.from("courts").select("*"));
  const matchPlayers = await fetchSupabase<{ match_id: string; user_id: string }[]>(
    supabase.from("match_players").select("match_id, user_id"),
  );

  const courtById = new Map(courts.map((court) => [court.id, court]));
  const playersByMatch = matchPlayers.reduce((acc, record) => {
    if (!acc.has(record.match_id)) acc.set(record.match_id, []);
    acc.get(record.match_id)!.push(record.user_id);
    return acc;
  }, new Map<string, string[]>());

  return matches.map((match) => ({
    ...match,
    court: courtById.get(match.court_id),
    current_players: (playersByMatch.get(match.id) ?? []).map((userId) => ({ id: userId }) as User),
  }));
}

export const apiClient = {
  users: {
    async getMatches(): Promise<User[]> {
      if (USE_MOCKS) return Promise.resolve(MOCK_USERS.filter((_, i) => i > 0));
      return fetchSupabase<User[]>(
        supabase
          .from("users")
          .select(
            "id, created_at, name, age, city, avatar_url, bio, trust_score, fitcoins_balance, level, preferred_sports, matches_played, last_location_lat, last_location_lng, user_role, company_name, business_category, is_sponsored",
          ),
      );
    },
    async updateProfile(userId: string, data: Partial<User>): Promise<User> {
      if (USE_MOCKS) {
        return Promise.resolve({ id: userId, ...data } as User);
      }
      return fetchSupabase<User>(
        supabase.from("users").update(data).eq("id", userId).select().single(),
      );
    },
  },

  matches: {
    async getAll(): Promise<Match[]> {
      if (USE_MOCKS) return Promise.resolve(MOCK_MATCHES);
      return loadMatchesFromDb();
    },
    async getUserMatches(userId: string): Promise<Match[]> {
      if (USE_MOCKS)
        return Promise.resolve(
          MOCK_MATCHES.filter(
            (match) =>
              match.creator_id === userId ||
              match.current_players?.some((player) => player.id === userId),
          ),
        );

      const matches = await loadMatchesFromDb();
      return matches.filter(
        (match) =>
          match.creator_id === userId ||
          match.current_players?.some((player) => player.id === userId),
      );
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
    async createTransaction(
      userId: string,
      amount: number,
      description: string,
      type: "EARN" | "SPEND" | "PENALTY",
    ): Promise<Transaction> {
      if (USE_MOCKS) {
        const newTx: Transaction = {
          id: `txn_${Date.now()}`,
          created_at: new Date().toISOString(),
          user_id: userId,
          amount,
          description,
          type,
        };
        return Promise.resolve(newTx);
      }

      // Insert transaction log
      const txData = await fetchSupabase<Transaction>(
        supabase
          .from("transactions")
          .insert([
            {
              id: `txn_${Date.now()}`,
              user_id: userId,
              amount,
              description,
              type,
            },
          ])
          .select()
          .single(),
      );

      // Deduct or increment user fitcoins_balance
      const { data: userProfile, error: getErr } = await supabase
        .from("users")
        .select("fitcoins_balance")
        .eq("id", userId)
        .single();
      if (getErr) throw new Error(getErr.message);

      const currentBalance = userProfile?.fitcoins_balance || 0;
      const newBalance = currentBalance + amount;

      const { error: updateErr } = await supabase
        .from("users")
        .update({ fitcoins_balance: newBalance })
        .eq("id", userId);
      if (updateErr) throw new Error(updateErr.message);

      return txData;
    },
  },

  courts: {
    async getAll(): Promise<Court[]> {
      if (USE_MOCKS) return Promise.resolve(MOCK_COURTS);
      return fetchSupabase<Court[]>(supabase.from("courts").select("*"));
    },
  },
};
