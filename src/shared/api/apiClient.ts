import { supabase } from "./supabase";
import { User, Court, Match, Transaction, SportCatalog, Sport, Level } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { withTimeout } from "./timeoutHelper";

// In-memory cache for bookings made during Demo Mode to allow realistic UX updates
const demoBookingsCache: Record<string, string[]> = {};

import { EXCEL_MOCK_COURTS } from "./mockCourtsData";
export const MOCK_COURTS: Court[] = EXCEL_MOCK_COURTS;

export const MOCK_USERS: User[] = [
  {
    id: "user-edwin-master",
    created_at: new Date().toISOString(),
    name: "Edwin Flores",
    age: 29,
    city: "Surco, Lima",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Edwin",
    bio: "Usuario Maestro Edwin.",
    trust_score: 99,
    fitcoins_balance: 3500,
    level: "Elite",
    preferred_sports: ["Pádel", "Fútbol"],
    matches_played: 15,
    last_location_lat: -12.14,
    last_location_lng: -76.995,
    user_role: "PLAYER",
  },
  {
    id: "user-fabiola",
    created_at: new Date().toISOString(),
    name: "Fabiola",
    age: 24,
    city: "San Borja, Lima",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fabiola",
    bio: "Amante del running y del tenis.",
    trust_score: 95,
    fitcoins_balance: 1200,
    level: "Intermedio",
    preferred_sports: ["Running", "Tenis"],
    matches_played: 10,
    last_location_lat: -12.11,
    last_location_lng: -76.99,
    user_role: "PLAYER",
  },
  {
    id: "user-puka-power",
    created_at: new Date().toISOString(),
    name: "Puka Power",
    age: 42,
    city: "Surco, Lima",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=Puka",
    bio: "Representante de bebidas premium energéticas.",
    trust_score: 100,
    fitcoins_balance: 10000,
    level: "Elite",
    preferred_sports: [],
    matches_played: 0,
    last_location_lat: -12.086,
    last_location_lng: -76.975,
    user_role: "BUSINESS",
    company_name: "Puka Power Inc.",
    business_category: "Bebidas",
    is_sponsored: true,
  },
  {
    id: "user-1",
    created_at: new Date().toISOString(),
    name: "Carlos Mendoza",
    age: 28,
    city: "Lima",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    bio: "Padelero nivel 4.5. Busco dobles competitivos.",
    trust_score: 98,
    fitcoins_balance: 850,
    level: "Avanzado",
    preferred_sports: ["Pádel", "Tenis"],
    matches_played: 24,
    last_location_lat: -12.141,
    last_location_lng: -76.994,
    distance_km: 0.5,
  },
  {
    id: "user-2",
    created_at: new Date().toISOString(),
    name: "Ana Sofía Prado",
    age: 24,
    city: "Lima",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
    bio: "Jugadora de vóley y tenis los fines de semana.",
    trust_score: 96,
    fitcoins_balance: 1200,
    level: "Intermedio",
    preferred_sports: ["Vóley", "Tenis"],
    matches_played: 18,
    last_location_lat: -12.143,
    last_location_lng: -76.996,
    distance_km: 1.1,
  },
  {
    id: "user-3",
    created_at: new Date().toISOString(),
    name: "Juan Diego Torres",
    age: 31,
    city: "Lima",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
    bio: "Futbolista aficionado. Siempre listo para armar pichanga.",
    trust_score: 89,
    fitcoins_balance: 340,
    level: "Intermedio",
    preferred_sports: ["Fútbol"],
    matches_played: 35,
    last_location_lat: -12.139,
    last_location_lng: -76.992,
    distance_km: 0.9,
  },
  {
    id: "user-4",
    created_at: new Date().toISOString(),
    name: "Edwin (Demo)",
    age: 26,
    city: "Surco, Lima",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=EdwinDemo",
    bio: "Jugador de Pádel nivel intermedio en modo demostración.",
    trust_score: 95,
    fitcoins_balance: 1500,
    level: "Intermedio",
    preferred_sports: ["Pádel", "Tenis"],
    matches_played: 12,
    last_location_lat: -12.14,
    last_location_lng: -76.995,
    distance_km: 0,
  },
];

export const MOCK_MATCHES: Match[] = [
  {
    id: "match-1",
    created_at: new Date().toISOString(),
    court_id: "court-1",
    sport: "Pádel",
    title: "Dobles de Pádel Competitivo",
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    })(),
    time: "18:00",
    max_players: 4,
    required_level: "Intermedio",
    creator_id: "user-1",
    status: "Open",
    court: MOCK_COURTS[0],
    current_players: [MOCK_USERS[0], MOCK_USERS[1]],
  },
  {
    id: "match-2",
    created_at: new Date().toISOString(),
    court_id: "court-3",
    sport: "Tenis",
    title: "Single de Tenis Amistoso",
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    })(),
    time: "10:00",
    max_players: 2,
    required_level: "Principiante",
    creator_id: "user-2",
    status: "Open",
    court: MOCK_COURTS[2],
    current_players: [MOCK_USERS[1]],
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user_id: "demo-user-id",
    amount: 150,
    description: "Reto completado: Jugá 3 partidos",
    type: "EARN",
  },
  {
    id: "tx-2",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: "demo-user-id",
    amount: -100,
    description: "Canje: Hora gratis de pádel",
    type: "SPEND",
  },
  {
    id: "tx-3",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user_id: "demo-user-id",
    amount: 50,
    description: "Match finalizado vs Carlos",
    type: "EARN",
  },
];

const MOCK_SPORTS: SportCatalog[] = [
  {
    id: "s1",
    name: "Pádel",
    icon_slug: "padel",
    default_max_players: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "s2",
    name: "Fútbol",
    icon_slug: "futbol",
    default_max_players: 14,
    created_at: new Date().toISOString(),
  },
  {
    id: "s3",
    name: "Tenis",
    icon_slug: "tenis",
    default_max_players: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "s4",
    name: "Vóley",
    icon_slug: "voley",
    default_max_players: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: "s5",
    name: "Básquet",
    icon_slug: "basquet",
    default_max_players: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "s6",
    name: "Running",
    icon_slug: "running",
    default_max_players: 20,
    created_at: new Date().toISOString(),
  },
];

interface MatchParticipantWithProfile {
  status: string;
  profile: User | null;
}

interface DBResponseMatch {
  id: string;
  created_at: string;
  court_id: string;
  sport: Sport;
  title: string;
  date: string;
  time: string;
  max_players: number;
  required_level: Level;
  creator_id: string;
  status?: "Open" | "Full" | "Finished" | "Cancelled" | "IN_PROGRESS";
  court: Court | null;
  match_participants?: MatchParticipantWithProfile[];
}

export const apiClient = {
  users: {
    async getMatches(excludeUserId?: string): Promise<User[]> {
      if (useAuthStore.getState().isDemoMode) {
        return excludeUserId ? MOCK_USERS.filter((u) => u.id !== excludeUserId) : MOCK_USERS;
      }

      let query = supabase.from("profiles").select("*").eq("user_role", "PLAYER").limit(30);
      if (excludeUserId) {
        query = query.neq("id", excludeUserId);
      }
      const { data, error } = await query;
      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching users/profiles:", error);
        throw error;
      }
      return (data || []) as User[];
    },

    async getLeaderboard(): Promise<User[]> {
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_USERS.sort((a, b) => b.fitcoins_balance - a.fitcoins_balance);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_role", "PLAYER")
        .order("fitcoins_balance", { ascending: false })
        .limit(20);

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching leaderboard:", error);
        throw error;
      }
      return (data || []) as User[];
    },
  },

  matches: {
    async getAll(): Promise<Match[]> {
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_MATCHES;
      }

      const { data, error } = await supabase.from("matches").select(`
          *,
          court:courts(*),
          match_participants(
            status,
            profile:profiles(*)
          )
        `);
      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching matches:", error);
        throw error;
      }
      return ((data as unknown as DBResponseMatch[]) || []).map((m) => ({
        ...m,
        current_players:
          m.match_participants
            ?.filter((p) => p.status === "ACCEPTED" || p.status === "ATTENDED")
            .map((p) => p.profile)
            .filter((p): p is User => !!p) || [],
      })) as unknown as Match[];
    },

    async getUserMatches(userId: string): Promise<Match[]> {
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_MATCHES.filter((m) => m.creator_id === userId);
      }

      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          court:courts(*),
          match_participants(
            status,
            profile:profiles(*)
          )
        `,
        )
        .eq("creator_id", userId);

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching user matches:", error);
        throw error;
      }
      return ((data as unknown as DBResponseMatch[]) || []).map((m) => ({
        ...m,
        current_players:
          m.match_participants
            ?.filter((p) => p.status === "ACCEPTED" || p.status === "ATTENDED")
            .map((p) => p.profile)
            .filter((p): p is User => !!p) || [],
      })) as unknown as Match[];
    },

    async create(match: {
      title: string;
      sport: string;
      court_id: string | null;
      date: string;
      time: string;
      max_players: number;
      required_level: string;
      creator_id: string;
    }): Promise<Match> {
      if (useAuthStore.getState().isDemoMode) {
        const newMatch: Match = {
          id: `match-demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          title: match.title,
          sport: match.sport as Sport,
          court_id: match.court_id || "",
          date: match.date,
          time: match.time,
          max_players: match.max_players,
          required_level: match.required_level as Level,
          creator_id: match.creator_id,
          status: "Open",
          court: MOCK_COURTS.find((c) => c.id === match.court_id),
          current_players: [useAuthStore.getState().user as User],
        };
        MOCK_MATCHES.push(newMatch);
        return newMatch;
      }

      const { data, error } = await withTimeout(
        supabase
          .from("matches")
          .insert({
            title: match.title,
            sport: match.sport,
            court_id: match.court_id,
            date: match.date,
            time: match.time,
            max_players: match.max_players,
            required_level: match.required_level,
            creator_id: match.creator_id,
            status: "Open",
          })
          .select()
          .single(),
      );

      if (error) {
        if (import.meta.env.DEV) console.error("Error creating match:", error);
        throw error;
      }
      return {
        ...data,
        current_players: [],
      } as unknown as Match;
    },
  },

  wallet: {
    async getBalance(userId: string): Promise<number> {
      if (useAuthStore.getState().isDemoMode) {
        const storedBalances = localStorage.getItem("sportmatch_demo_balances");
        const balances = storedBalances ? JSON.parse(storedBalances) : {};
        if (balances[userId] !== undefined) {
          return balances[userId];
        }
        const storedUsers = localStorage.getItem("sportmatch_demo_users");
        const demoUsers = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
        const mockUser = demoUsers.find((u: User) => u.id === userId);
        return mockUser ? mockUser.fitcoins_balance : 1500;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("fitcoins_balance")
        .eq("id", userId)
        .single();

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching balance:", error);
        throw error;
      }
      return data?.fitcoins_balance || 0;
    },

    async getTransactions(userId: string): Promise<Transaction[]> {
      if (useAuthStore.getState().isDemoMode) {
        const key = `sportmatch_demo_transactions_${userId}`;
        const stored = localStorage.getItem(key);
        if (!stored) {
          const seeded = MOCK_TRANSACTIONS.map((t) => ({
            ...t,
            user_id: userId,
          }));
          localStorage.setItem(key, JSON.stringify(seeded));
          return seeded;
        }
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching wallet transactions:", error);
        throw error;
      }
      return (data || []) as Transaction[];
    },

    saveTransaction(userId: string, tx: Transaction): void {
      if (useAuthStore.getState().isDemoMode) {
        const key = `sportmatch_demo_transactions_${userId}`;
        const stored = localStorage.getItem(key);
        let transactions: Transaction[] = [];
        if (stored) {
          try {
            transactions = JSON.parse(stored);
          } catch {
            transactions = [];
          }
        } else {
          transactions = MOCK_TRANSACTIONS.map((t) => ({
            ...t,
            user_id: userId,
          }));
        }
        if (!transactions.some((t) => t.id === tx.id)) {
          transactions = [tx, ...transactions];
        }
        localStorage.setItem(key, JSON.stringify(transactions));
      }
    },

    updateBalance(userId: string, newBalance: number): void {
      if (useAuthStore.getState().isDemoMode) {
        const storedBalances = localStorage.getItem("sportmatch_demo_balances");
        const balances = storedBalances ? JSON.parse(storedBalances) : {};
        balances[userId] = newBalance;
        localStorage.setItem("sportmatch_demo_balances", JSON.stringify(balances));

        const mockUser = MOCK_USERS.find((u) => u.id === userId);
        if (mockUser) {
          mockUser.fitcoins_balance = newBalance;
        }

        const storedUsers = localStorage.getItem("sportmatch_demo_users");
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const u = users.find((x: User) => x.id === userId);
          if (u) {
            u.fitcoins_balance = newBalance;
            localStorage.setItem("sportmatch_demo_users", JSON.stringify(users));
          }
        }

        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id === userId) {
          useAuthStore.setState({ user: { ...currentUser, fitcoins_balance: newBalance } });
        }
      }
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
    async getAll(sport?: string): Promise<Court[]> {
      if (useAuthStore.getState().isDemoMode) {
        if (sport) {
          return MOCK_COURTS.filter((c) => c.sport === sport);
        }
        return MOCK_COURTS;
      }

      let query = supabase.from("courts").select("*");
      if (sport) {
        query = query.eq("sport", sport);
      }
      const { data, error } = await query;
      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching courts:", error);
        throw error;
      }
      return (data || []) as Court[];
    },

    async getById(id: string): Promise<Court> {
      if (useAuthStore.getState().isDemoMode) {
        const found = MOCK_COURTS.find((c) => c.id === id);
        if (!found) throw new Error("Court not found");
        return found;
      }
      const { data, error } = await supabase.from("courts").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Court;
    },
  },

  sports: {
    async getAll(): Promise<SportCatalog[]> {
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_SPORTS;
      }

      const { data, error } = await supabase.from("sports").select("*").order("name");
      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching sports:", error);
        throw error;
      }
      return (data || []) as SportCatalog[];
    },
  },

  bookings: {
    async getByCourtAndDate(courtId: string, date: string): Promise<string[]> {
      if (useAuthStore.getState().isDemoMode) {
        const key = `${courtId}_${date}`;
        if (!demoBookingsCache[key]) {
          // BUG-03: Generate varied pre-occupied slots per court to make demo realistic.
          // Each court has a different baseline of occupied slots so UX feels authentic.
          const courtSlotMap: Record<string, string[]> = {
            "court-1": ["10:00", "16:00", "18:00"],
            "court-2": ["18:00", "20:00"],
            "court-3": ["08:00", "12:00"],
            "court-4": ["09:00", "15:00", "17:00"],
          };
          demoBookingsCache[key] = courtSlotMap[courtId] ?? ["10:00"];
        }
        return demoBookingsCache[key];
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("time_slot")
        .eq("court_id", courtId)
        .eq("date", date);

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching bookings:", error);
        throw error;
      }
      return (data || []).map((b) => b.time_slot);
    },

    async create(booking: {
      court_id: string;
      date: string;
      time_slot: string;
      user_id: string;
      operating_hours?: string[];
    }): Promise<void> {
      if (useAuthStore.getState().isDemoMode) {
        const key = `${booking.court_id}_${booking.date}`;
        if (!demoBookingsCache[key]) {
          demoBookingsCache[key] = [];
        }
        if (!demoBookingsCache[key].includes(booking.time_slot)) {
          demoBookingsCache[key].push(booking.time_slot);
        }
        return;
      }

      // SEC-03: Validate that the requested time_slot belongs to the court's operating_hours.
      // This prevents bookings at invalid times (e.g., 3 AM) even if RLS is misconfigured.
      if (booking.operating_hours && booking.operating_hours.length > 0) {
        if (!booking.operating_hours.includes(booking.time_slot)) {
          throw new Error(
            `El horario "${booking.time_slot}" no es válido para esta cancha. Horarios disponibles: ${booking.operating_hours.join(", ")}`,
          );
        }
      }

      const { time_slot, court_id, date, user_id } = booking;
      const { error } = await withTimeout(
        supabase.from("bookings").insert({ court_id, date, time_slot, user_id }),
      );
      if (error) {
        if (import.meta.env.DEV) console.error("Error creating booking:", error);
        throw error;
      }
    },
  },
};
