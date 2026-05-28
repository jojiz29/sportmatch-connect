import { supabase } from "./supabase";
import { User, Court, Match, Transaction } from "@/entities/types";

export const apiClient = {
  users: {
    async getMatches(): Promise<User[]> {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_role", "PLAYER")
        .limit(20);

      if (error) {
        console.error("Error fetching users/profiles:", error);
        throw error;
      }
      return (data || []) as User[];
    },
  },

  matches: {
    async getAll(): Promise<Match[]> {
      const { data, error } = await supabase.from("matches").select("*, court:courts(*)");

      if (error) {
        console.error("Error fetching matches:", error);
        throw error;
      }
      return (data || []).map((m: Record<string, unknown>) => ({
        ...m,
        current_players: [], // Default to empty array as match_players is not defined in schema
      })) as unknown as Match[];
    },

    async getUserMatches(userId: string): Promise<Match[]> {
      const { data, error } = await supabase
        .from("matches")
        .select("*, court:courts(*)")
        .eq("creator_id", userId);

      if (error) {
        console.error("Error fetching user matches:", error);
        throw error;
      }
      return (data || []).map((m: Record<string, unknown>) => ({
        ...m,
        current_players: [],
      })) as unknown as Match[];
    },
  },

  wallet: {
    async getBalance(userId: string): Promise<number> {
      const { data, error } = await supabase
        .from("profiles")
        .select("fitcoins_balance")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching balance:", error);
        throw error;
      }
      return data?.fitcoins_balance || 0;
    },

    async getTransactions(userId: string): Promise<Transaction[]> {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching wallet transactions:", error);
        throw error;
      }
      return (data || []) as Transaction[];
    },
  },

  courts: {
    async getAll(): Promise<Court[]> {
      const { data, error } = await supabase.from("courts").select("*");

      if (error) {
        console.error("Error fetching courts:", error);
        throw error;
      }
      return (data || []) as Court[];
    },
  },
};
