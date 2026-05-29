import { supabase } from "./supabase";
import { User, Court, Match, Transaction, SportCatalog, Sport, Level } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";

// In-memory cache for bookings made during Demo Mode to allow realistic UX updates
const demoBookingsCache: Record<string, string[]> = {};

export const MOCK_COURTS: Court[] = [
  {
    id: "court-1",
    created_at: new Date().toISOString(),
    name: "SportMatch Arena Surco",
    sport: "Pádel",
    price_per_hour: 60,
    rating: 4.8,
    reviews_count: 42,
    lat: -12.1402,
    lng: -76.9952,
    image_url:
      "https://images.unsplash.com/photo-1546429070-1fc422f1d77a?auto=format&fit=crop&q=80&w=600",
    amenities: ["Duchas", "Estacionamiento", "Cafetería"],
    is_available: true,
    address: "Av. Primavera 1020, Surco",
    distance_km: 1.2,
    is_sponsored: true,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
    max_players: 4,
  },
  {
    id: "court-2",
    created_at: new Date().toISOString(),
    name: "Complejo DeporLima",
    sport: "Fútbol",
    price_per_hour: 80,
    rating: 4.5,
    reviews_count: 89,
    lat: -12.145,
    lng: -76.991,
    image_url:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
    amenities: ["Vestuarios", "Luz Artificial", "Arbitraje"],
    is_available: true,
    address: "Jr. Batallón Callao 400, Surco",
    distance_km: 2.1,
    is_sponsored: false,
    operating_hours: ["18:00", "19:00", "20:00", "21:00", "22:00"],
    max_players: 14,
  },
  {
    id: "court-3",
    created_at: new Date().toISOString(),
    name: "Surco Tennis Club",
    sport: "Tenis",
    price_per_hour: 50,
    rating: 4.6,
    reviews_count: 24,
    lat: -12.138,
    lng: -76.998,
    image_url:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600",
    amenities: ["Raquetas", "Estacionamiento"],
    is_available: true,
    address: "Av. Velasco Astete 750, Surco",
    distance_km: 0.8,
    is_sponsored: false,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00"],
    max_players: 2,
  },
  {
    id: "court-4",
    created_at: new Date().toISOString(),
    name: "Puka Power Inc.",
    sport: "Vóley",
    price_per_hour: 40,
    rating: 4.9,
    reviews_count: 15,
    lat: -12.1425,
    lng: -76.993,
    image_url:
      "https://images.unsplash.com/photo-1592656094247-b98a09698714?auto=format&fit=crop&q=80&w=600",
    amenities: ["Entrenadores", "Bebidas Gratis"],
    is_available: true,
    address: "Av. Caminos del Inca 1200, Surco",
    distance_km: 1.5,
    is_sponsored: true,
    operating_hours: ["09:00", "11:00", "13:00", "15:00", "17:00"],
    max_players: 12,
  },
];

export const MOCK_USERS: User[] = [
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
    date: new Date().toISOString().split("T")[0],
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
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    max_players: 2,
    required_level: "Principiante",
    creator_id: "user-2",
    status: "Open",
    court: MOCK_COURTS[2],
    current_players: [MOCK_USERS[1]],
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
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
        console.error("Error fetching users/profiles:", error);
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
        console.error("Error fetching leaderboard:", error);
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
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_MATCHES.filter((m) => m.creator_id === userId);
      }

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

      const { data, error } = await supabase
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
        .single();

      if (error) {
        console.error("Error creating match:", error);
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
        return 1500;
      }

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
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_TRANSACTIONS.filter((t) => t.user_id === userId || userId === "demo-user-id");
      }

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
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_COURTS;
      }

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
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_SPORTS;
      }

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
      if (useAuthStore.getState().isDemoMode) {
        const key = `${courtId}_${date}`;
        if (!demoBookingsCache[key]) {
          demoBookingsCache[key] = ["10:00", "16:00"];
        }
        return demoBookingsCache[key];
      }

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
      if (useAuthStore.getState().isDemoMode) {
        const key = `${booking.court_id}_${booking.date}`;
        if (!demoBookingsCache[key]) {
          demoBookingsCache[key] = ["10:00", "16:00"];
        }
        if (!demoBookingsCache[key].includes(booking.time_slot)) {
          demoBookingsCache[key].push(booking.time_slot);
        }
        return;
      }

      const { error } = await supabase.from("bookings").insert(booking);
      if (error) {
        console.error("Error creating booking:", error);
        throw error;
      }
    },
  },
};
