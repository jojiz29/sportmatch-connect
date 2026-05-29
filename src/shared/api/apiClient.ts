import { supabase } from "./supabase";
import { User, Court, Match, Transaction, SportCatalog, Sport, Level } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";

// In-memory cache for bookings made during Demo Mode to allow realistic UX updates
const demoBookingsCache: Record<string, string[]> = {};

export const MOCK_COURTS: Court[] = [
  {
    id: "lima-court-01",
    created_at: new Date().toISOString(),
    name: "Miraflores Padel Club",
    sport: "Pádel",
    price_per_hour: 120,
    rating: 4.9,
    reviews_count: 142,
    lat: -12.1221,
    lng: -77.0298,
    image_url:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600",
    amenities: ["Vestuarios", "Iluminación Led", "Estacionamiento", "Cafetería Pro"],
    is_available: true,
    address: "Malecón de la Reserva 610, Miraflores",
    distance_km: 0.5,
    is_sponsored: true,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "21:00"],
    max_players: 4,
  },
  {
    id: "lima-court-02",
    created_at: new Date().toISOString(),
    name: "Padel Surco Club",
    sport: "Pádel",
    price_per_hour: 100,
    rating: 4.7,
    reviews_count: 98,
    lat: -12.1284,
    lng: -76.9745,
    image_url:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600",
    amenities: ["Estacionamiento", "Alquiler de Palas", "Duchas", "Bebidas"],
    is_available: true,
    address: "Av. Cerros de Camacho 500, Santiago de Surco",
    distance_km: 1.2,
    is_sponsored: true,
    operating_hours: ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"],
    max_players: 4,
  },
  {
    id: "lima-court-03",
    created_at: new Date().toISOString(),
    name: "La Molina Padel Arena",
    sport: "Pádel",
    price_per_hour: 130,
    rating: 4.8,
    reviews_count: 64,
    lat: -12.0854,
    lng: -76.9452,
    image_url:
      "https://images.unsplash.com/photo-1546429070-1fc422f1d77a?auto=format&fit=crop&q=80&w=600",
    amenities: ["Techado completo", "Gimnasio integrado", "Duchas Premium", "Parking Privado"],
    is_available: true,
    address: "Av. Raúl Ferrero 1200, La Molina",
    distance_km: 2.3,
    is_sponsored: false,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
    max_players: 4,
  },
  {
    id: "lima-court-04",
    created_at: new Date().toISOString(),
    name: "Pádel Club Rinconada",
    sport: "Pádel",
    price_per_hour: 120,
    rating: 4.6,
    reviews_count: 37,
    lat: -12.0982,
    lng: -76.9324,
    image_url:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600",
    amenities: ["Seguridad 24h", "Snack Bar", "Wifi", "Tribuna"],
    is_available: true,
    address: "Calle El Rincón 200, La Molina",
    distance_km: 3.1,
    is_sponsored: false,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
    max_players: 4,
  },
  {
    id: "lima-court-05",
    created_at: new Date().toISOString(),
    name: "Padel Lima Club",
    sport: "Pádel",
    price_per_hour: 110,
    rating: 4.7,
    reviews_count: 85,
    lat: -12.1021,
    lng: -76.9932,
    image_url:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600",
    amenities: ["Luz Artificial Pro", "Cafetería", "Lockers", "Pádel Shop"],
    is_available: true,
    address: "Av. San Luis 1520, San Borja",
    distance_km: 1.5,
    is_sponsored: false,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
    max_players: 4,
  },
  {
    id: "lima-court-06",
    created_at: new Date().toISOString(),
    name: "Deporcentro Casuarinas",
    sport: "Fútbol",
    price_per_hour: 90,
    rating: 4.5,
    reviews_count: 210,
    lat: -12.1174,
    lng: -76.9682,
    image_url:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
    amenities: ["Pasto Sintético FIFA", "Vestuarios amplios", "Estacionamiento", "Luz de Noche"],
    is_available: true,
    address: "Av. Jacarandá 850, Santiago de Surco",
    distance_km: 2.1,
    is_sponsored: true,
    operating_hours: ["18:00", "19:00", "20:00", "21:00", "22:00"],
    max_players: 14,
  },
  {
    id: "lima-court-07",
    created_at: new Date().toISOString(),
    name: "La 10 - Surco",
    sport: "Fútbol",
    price_per_hour: 80,
    rating: 4.4,
    reviews_count: 156,
    lat: -12.1382,
    lng: -76.9805,
    image_url:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600",
    amenities: ["Tribuna techada", "Arbitraje opcional", "Snacks", "Estacionamiento"],
    is_available: true,
    address: "Av. Caminos del Inca 256, Surco",
    distance_km: 1.1,
    is_sponsored: false,
    operating_hours: ["18:00", "19:00", "20:00", "21:00", "22:00"],
    max_players: 14,
  },
  {
    id: "lima-court-08",
    created_at: new Date().toISOString(),
    name: "Futbol Plaza La Molina",
    sport: "Fútbol",
    price_per_hour: 70,
    rating: 4.3,
    reviews_count: 112,
    lat: -12.0721,
    lng: -76.9582,
    image_url:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
    amenities: ["Césped Sintético", "Luz artificial", "Parking gratis"],
    is_available: true,
    address: "Av. Separadora Industrial 3050, La Molina",
    distance_km: 3.5,
    is_sponsored: false,
    operating_hours: ["18:00", "19:00", "20:00", "21:00", "22:00"],
    max_players: 14,
  },
  {
    id: "lima-court-09",
    created_at: new Date().toISOString(),
    name: "San Borja Fútbol Club",
    sport: "Fútbol",
    price_per_hour: 85,
    rating: 4.6,
    reviews_count: 93,
    lat: -12.0912,
    lng: -77.0123,
    image_url:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600",
    amenities: ["Vestuarios", "Seguridad Municipal", "Estacionamiento", "Parrillas"],
    is_available: true,
    address: "Av. Javier Prado Este 2500, San Borja",
    distance_km: 2.8,
    is_sponsored: false,
    operating_hours: ["18:00", "19:00", "20:00", "21:00", "22:00"],
    max_players: 14,
  },
  {
    id: "lima-court-10",
    created_at: new Date().toISOString(),
    name: "Complejo DeporLima Surco",
    sport: "Fútbol",
    price_per_hour: 80,
    rating: 4.5,
    reviews_count: 78,
    lat: -12.145,
    lng: -76.991,
    image_url:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
    amenities: ["Duchas caliente", "Cafetería", "Luz de Noche", "Chalecos gratis"],
    is_available: true,
    address: "Jr. Batallón Callao 400, Santiago de Surco",
    distance_km: 1.8,
    is_sponsored: false,
    operating_hours: ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    max_players: 14,
  },
  {
    id: "lima-court-11",
    created_at: new Date().toISOString(),
    name: "Centro Deportivo Municipal",
    sport: "Vóley",
    price_per_hour: 60,
    rating: 4.7,
    reviews_count: 240,
    lat: -12.1332,
    lng: -76.9992,
    image_url:
      "https://images.unsplash.com/photo-1592656094247-b98a09698714?auto=format&fit=crop&q=80&w=600",
    amenities: ["Pabellón Cubierto", "Tribunas", "Servicio Médico", "Cafetería"],
    is_available: true,
    address: "Av. Loma Amarilla, Surco",
    distance_km: 1.2,
    is_sponsored: true,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
    max_players: 12,
  },
  {
    id: "lima-court-12",
    created_at: new Date().toISOString(),
    name: "Complejo Manuel Bonilla",
    sport: "Vóley",
    price_per_hour: 75,
    rating: 4.5,
    reviews_count: 115,
    lat: -12.1091,
    lng: -77.0423,
    image_url:
      "https://images.unsplash.com/photo-1592656094247-b98a09698714?auto=format&fit=crop&q=80&w=600",
    amenities: ["Vista al Mar", "Estacionamiento", "Luces Artificiales", "Tribuna"],
    is_available: true,
    address: "Av. Ejército 1300, Miraflores",
    distance_km: 3.8,
    is_sponsored: false,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
    max_players: 12,
  },
  {
    id: "lima-court-13",
    created_at: new Date().toISOString(),
    name: "Miraflores Tennis Center",
    sport: "Tenis",
    price_per_hour: 80,
    rating: 4.8,
    reviews_count: 164,
    lat: -12.1232,
    lng: -77.0374,
    image_url:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600",
    amenities: ["Arcilla Roja", "Entrenadores ATP", "Vestuarios", "Tennis Bar"],
    is_available: true,
    address: "Av. Larco 1150, Miraflores",
    distance_km: 3.2,
    is_sponsored: false,
    operating_hours: ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00"],
    max_players: 2,
  },
  {
    id: "lima-court-14",
    created_at: new Date().toISOString(),
    name: "San Borja Tenis y Pádel Club",
    sport: "Tenis",
    price_per_hour: 100,
    rating: 4.6,
    reviews_count: 74,
    lat: -12.0954,
    lng: -76.9982,
    image_url:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600",
    amenities: ["Canchas rápidas", "Cafetería", "Lockers", "Estacionamiento"],
    is_available: true,
    address: "Av. Boulevard de la Surco 300, San Borja",
    distance_km: 2.5,
    is_sponsored: false,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
    max_players: 2,
  },
  {
    id: "lima-court-15",
    created_at: new Date().toISOString(),
    name: "Rinconada Country Club",
    sport: "Pádel",
    price_per_hour: 150,
    rating: 4.9,
    reviews_count: 212,
    lat: -12.0911,
    lng: -76.9234,
    image_url:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600",
    amenities: ["Doble vidrio templado", "Club House Premium", "Piscina", "Duchas Vip"],
    is_available: true,
    address: "Av. Manuel Prado Ugarteche, La Molina",
    distance_km: 4.5,
    is_sponsored: true,
    operating_hours: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
    max_players: 4,
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

      const { data, error } = await supabase.from("matches").select("*, court:courts(*)");
      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching matches:", error);
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
        if (import.meta.env.DEV) console.error("Error fetching user matches:", error);
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
        return 1500;
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
        return MOCK_TRANSACTIONS.filter((t) => t.user_id === userId || userId === "demo-user-id");
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
  },

  courts: {
    async getAll(): Promise<Court[]> {
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_COURTS;
      }

      const { data, error } = await supabase.from("courts").select("*");
      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching courts:", error);
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
      const { error } = await supabase
        .from("bookings")
        .insert({ court_id, date, time_slot, user_id });
      if (error) {
        if (import.meta.env.DEV) console.error("Error creating booking:", error);
        throw error;
      }
    },
  },
};
