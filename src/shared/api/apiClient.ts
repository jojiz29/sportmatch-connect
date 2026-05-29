import { supabase } from "./supabase";
import { User, Court, Match, Transaction, SportCatalog } from "@/entities/types";

export const apiClient = {
  users: {
    /**
     * Fetch player profiles for matchmaking.
     * Excludes the current authenticated user from the result so they
     * never see themselves in their own swipe stack.
     */
    async getMatches(excludeUserId?: string): Promise<User[]> {
      let query = supabase.from("profiles").select("*").eq("user_role", "PLAYER").limit(30);

      // Server-side exclusion: filter out the current user's own profile.
      // Falls back gracefully when no userId is provided (e.g. guest/SSR).
      if (excludeUserId) {
        query = query.neq("id", excludeUserId);
      }

      const { data, error } = await query;

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
        current_players: [],
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

  sports: {
    async getAll(): Promise<SportCatalog[]> {
      const { data, error } = await supabase.from("sports").select("*").order("name");

      if (error) {
        console.error("Error fetching sports:", error);
        throw error;
      }
      return (data || []) as SportCatalog[];
    },
  },

  bookings: {
    async getByCourtAndDate(courtId: string, date: string): Promise<string[]> {
      const { data, error } = await supabase
        .from("bookings")
        .select("time_slot")
        .eq("court_id", courtId)
        .eq("date", date);

      if (error) {
        console.error("Error fetching bookings:", error);
        throw error;
      }
      return (data || []).map((b) => b.time_slot);
    },

    async create(booking: {
      court_id: string;
      date: string;
      time_slot: string;
      user_id: string;
    }): Promise<void> {
      const { error } = await supabase.from("bookings").insert(booking);

      if (error) {
        console.error("Error creating booking:", error);
        throw error;
      }
    },
  },
};
