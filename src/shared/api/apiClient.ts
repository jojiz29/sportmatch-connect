/**
 * ===================================================================
 * ARCHIVO: src/shared/api/apiClient.ts
 * PROPÓSITO: Cliente de API central con datos mock y reales.
 *            Sirve como capa de abstracción entre la UI y Supabase.
 * FLUJO: Para cada operación, primero verifica si estamos en
 *        "Demo Mode". Si es así, usa datos mock en memoria/localStorage.
 *        Si no, consulta Supabase en tiempo real.
 * ===================================================================
 */

// ------------------------------------------------------------------
// IMPORTACIONES
// ------------------------------------------------------------------
import { supabase } from "./supabase";
import {
  User,
  Court,
  Venue,
  Match,
  Transaction,
  SportCatalog,
  Sport,
  Level,
} from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { withTimeout } from "./timeoutHelper";

// ------------------------------------------------------------------
// CACHÉS EN MEMORIA
// ------------------------------------------------------------------

// Cache de reservas para Demo Mode: evita que se pierdan al navegar
// { "courtId_fecha": ["10:00", "12:00", ...] }
const demoBookingsCache: Record<string, string[]> = {};

// Cache del catálogo de deportes: reduce viajes a la DB en carga inicial
let cachedSportsCatalog: SportCatalog[] | null = null;

// ------------------------------------------------------------------
// DATOS MOCK: Canchas y sedes
// Se importan desde mockCourtsData.ts (listado extenso de 300KB)
// y se re-exportan como MOCK_VENUES y MOCK_COURTS (alias)
// ------------------------------------------------------------------
import { EXCEL_MOCK_COURTS } from "./mockCourtsData";
export const MOCK_VENUES: Venue[] = EXCEL_MOCK_COURTS;
export const MOCK_COURTS: Court[] = MOCK_VENUES;

// ------------------------------------------------------------------
// DATOS MOCK: Usuarios de demostración
// Array con usuarios ficticios para probar la app sin backend real.
// Incluye:
//   - PLAYER (jugadores comunes)
//   - BUSINESS (negocios: gimnasios, academias, tiendas)
// Cada usuario tiene datos completos: perfil, ubicación, deportes,
// nivel, saldo FitCoins, etc.
// ------------------------------------------------------------------
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
    onboarding_completed: true,
    user_sports: [
      { sport_id: "Pádel", level: 3 },
      { sport_id: "Fútbol", level: 2 },
    ],
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
    onboarding_completed: true,
    user_sports: [
      { sport_id: "Running", level: 2 },
      { sport_id: "Tenis", level: 1 },
    ],
  },
  {
    id: "user-puka-power",
    created_at: new Date().toISOString(),
    name: "Puka Power",
    email: "puka@puka.com",
    age: 42,
    city: "Surco, Lima",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=Puka",
    bio: "Representante de bebidas premium energéticas y organizador de torneos locales de pádel.",
    trust_score: 100,
    fitcoins_balance: 10000,
    level: "Elite",
    preferred_sports: ["Pádel"],
    matches_played: 0,
    last_location_lat: -12.086,
    last_location_lng: -76.975,
    user_role: "BUSINESS",
    company_name: "Puka Power Inc.",
    business_category: "Patrocinador",
    is_sponsored: true,
    address: "Av. Jockey Plaza 450",
    district: "Santiago de Surco",
    whatsapp: "+51999888777",
    instagram: "@pukapower.pe",
    website: "https://pukapower.com",
    operating_hours: ["08:00 - 20:00"],
    images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97"],
  },
  {
    id: "business-gym-1",
    created_at: new Date().toISOString(),
    name: "Megatlon Center",
    email: "megatlon@sportmatch.app",
    age: 35,
    city: "San Borja, Lima",
    avatar_url:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200",
    bio: "Gimnasio de alto rendimiento con zonas exclusivas para preparación física de padeleros y tenistas.",
    trust_score: 98,
    fitcoins_balance: 8000,
    level: "Avanzado",
    preferred_sports: ["Gimnasio"],
    matches_played: 0,
    last_location_lat: -12.1067,
    last_location_lng: -76.9989,
    user_role: "BUSINESS",
    company_name: "Megatlon Club",
    business_category: "Gym",
    is_sponsored: true,
    address: "Av. San Borja Sur 789",
    district: "San Borja",
    whatsapp: "+51987654321",
    instagram: "@megatlon.pe",
    website: "https://megatlon.com.pe",
    operating_hours: ["06:00 - 23:00"],
    images: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
    ],
  },
  {
    id: "business-academy-1",
    created_at: new Date().toISOString(),
    name: "Padel Academy Lima",
    email: "academy@sportmatch.app",
    age: 38,
    city: "Santiago de Surco, Lima",
    avatar_url:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=200",
    bio: "Clases y entrenamientos de pádel para todos los niveles con entrenadores certificados. Conectando deportistas.",
    trust_score: 97,
    fitcoins_balance: 9500,
    level: "Elite",
    preferred_sports: ["Pádel"],
    matches_played: 0,
    last_location_lat: -12.1314,
    last_location_lng: -76.9812,
    user_role: "BUSINESS",
    company_name: "Padel Academy Lima",
    business_category: "Academia",
    is_sponsored: true,
    address: "Av. Primavera 1230",
    district: "Santiago de Surco",
    whatsapp: "+51912345678",
    instagram: "@padelacademy.pe",
    website: "https://padelacademy.pe",
    operating_hours: ["07:00 - 22:00"],
    images: [
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8",
      "https://images.unsplash.com/photo-1622279457486-62dcc4a631d6",
    ],
  },
  {
    id: "business-store-1",
    created_at: new Date().toISOString(),
    name: "Marathon Sports Miraflores",
    email: "marathon@sportmatch.app",
    age: 40,
    city: "Miraflores, Lima",
    avatar_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200",
    bio: "Equipamiento premium para tenis, running y pádel. Te ayudamos a encontrar el calzado y raqueta ideal para tu nivel.",
    trust_score: 99,
    fitcoins_balance: 15000,
    level: "Avanzado",
    preferred_sports: ["Running", "Tenis", "Pádel"],
    matches_played: 0,
    last_location_lat: -12.1228,
    last_location_lng: -77.0282,
    user_role: "BUSINESS",
    company_name: "Marathon Sports",
    business_category: "Tienda",
    is_sponsored: false,
    address: "Av. Larco 450",
    district: "Miraflores",
    whatsapp: "+51999777666",
    instagram: "@marathonsports.pe",
    website: "https://marathon.com.pe",
    operating_hours: ["09:00 - 21:00"],
    images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8"],
  },
  {
    id: "business-nutri-1",
    created_at: new Date().toISOString(),
    name: "NutriSport Lince",
    email: "nutrisport@sportmatch.app",
    age: 32,
    city: "Lince, Lima",
    avatar_url:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=200",
    bio: "Asesoría nutricional deportiva especializada. Evaluaciones corporales InBody para optimizar tu rendimiento y evitar fatiga.",
    trust_score: 95,
    fitcoins_balance: 6000,
    level: "Intermedio",
    preferred_sports: ["Fútbol", "Running", "Gimnasio"],
    matches_played: 0,
    last_location_lat: -12.0833,
    last_location_lng: -77.0333,
    user_role: "BUSINESS",
    company_name: "NutriSport Lince",
    business_category: "Nutricionista",
    is_sponsored: false,
    address: "Av. Arequipa 2450",
    district: "Lince",
    whatsapp: "+51955444333",
    instagram: "@nutrisport.pe",
    website: "https://nutrisport.pe",
    operating_hours: ["09:00 - 18:00"],
    images: ["https://images.unsplash.com/photo-1490645935967-10de6ba17061"],
  },
  {
    id: "business-physio-1",
    created_at: new Date().toISOString(),
    name: "FisioKine Magdalena",
    email: "fisiokine@sportmatch.app",
    age: 34,
    city: "Magdalena, Lima",
    avatar_url:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200",
    bio: "Terapia física y descarga muscular para atletas. Prevención de lesiones deportivas y rehabilitación post-partido.",
    trust_score: 96,
    fitcoins_balance: 5500,
    level: "Avanzado",
    preferred_sports: ["Fútbol", "Pádel", "Tenis"],
    matches_played: 0,
    last_location_lat: -12.0911,
    last_location_lng: -77.0694,
    user_role: "BUSINESS",
    company_name: "FisioKine Magdalena",
    business_category: "Fisioterapia",
    is_sponsored: false,
    address: "Jirón Tacna 650",
    district: "Magdalena",
    whatsapp: "+51922333444",
    instagram: "@fisiokine.pe",
    website: "https://fisiokine.pe",
    operating_hours: ["08:00 - 20:00"],
    images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b"],
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
    onboarding_completed: true,
    user_sports: [{ sport_id: "Pádel", level: 3 }],
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
    onboarding_completed: true,
    user_sports: [{ sport_id: "Vóley", level: 2 }],
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
    onboarding_completed: true,
    user_sports: [{ sport_id: "Fútbol", level: 2 }],
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
    onboarding_completed: true,
    user_sports: [
      { sport_id: "Pádel", level: 2 },
      { sport_id: "Tenis", level: 1 },
    ],
  },
];

// ------------------------------------------------------------------
// DATOS MOCK: Partidos de demostración
// Cada partido tiene: fecha futura (+7 días), cancha asignada,
// deporte, nivel requerido, y jugadores actuales.
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// DATOS MOCK: Transacciones de billetera (FitCoins)
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// DATOS MOCK: Catálogo de deportes disponibles en la plataforma
// ------------------------------------------------------------------
const MOCK_SPORTS: SportCatalog[] = [
  { id: "s1", name: "Pádel", icon_slug: "padel", default_max_players: 4, created_at: new Date().toISOString() },
  { id: "s2", name: "Fútbol", icon_slug: "futbol", default_max_players: 14, created_at: new Date().toISOString() },
  { id: "s3", name: "Tenis", icon_slug: "tenis", default_max_players: 2, created_at: new Date().toISOString() },
  { id: "s4", name: "Vóley", icon_slug: "voley", default_max_players: 12, created_at: new Date().toISOString() },
  { id: "s5", name: "Básquet", icon_slug: "basquet", default_max_players: 10, created_at: new Date().toISOString() },
  { id: "s6", name: "Running", icon_slug: "running", default_max_players: 20, created_at: new Date().toISOString() },
];

// ------------------------------------------------------------------
// INTERFACES AUXILIARES (no exportadas)
// ------------------------------------------------------------------

/** Representa un participante de un partido con su perfil expandido */
interface MatchParticipantWithProfile {
  status: string;
  profile: User | null;
}

/** Estructura de un partido tal como lo devuelve Supabase (con relaciones) */
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

// ==================================================================
// API CLIENT: Objeto principal con todos los métodos de acceso a datos
// ==================================================================
// Cada método sigue el patrón:
//   1. Si isDemoMode -> opera con datos mock (memoria/localStorage)
//   2. Si no -> consulta Supabase y transforma la respuesta
// ==================================================================
export const apiClient = {

  // ==============================================================
  // SECCIÓN: USERS (Perfiles de usuario)
  // ==============================================================
  users: {
    /**
     * getMatches(): Obtiene perfiles de jugadores (PLAYER) para emparejamiento
     * @param excludeUserId - Opcional: excluir un usuario (ej: el actual)
     */
    async getMatches(excludeUserId?: string): Promise<User[]> {
      if (useAuthStore.getState().isDemoMode) {
        const storedUsers = localStorage.getItem("sportmatch_demo_users");
        const demoUsers = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
        const players = demoUsers.filter((u: User) => u.user_role !== "BUSINESS");
        return excludeUserId ? players.filter((u: User) => u.id !== excludeUserId) : players;
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

    /**
     * getBusinesses(): Obtiene perfiles de negocios (BUSINESS)
     * Útil para el marketplace B2B (gimnasios, academias, etc.)
     */
    async getBusinesses(): Promise<User[]> {
      if (useAuthStore.getState().isDemoMode) {
        const storedUsers = localStorage.getItem("sportmatch_demo_users");
        const demoUsers = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
        return demoUsers.filter((u: User) => u.user_role === "BUSINESS");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_role", "BUSINESS")
        .limit(30);

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching businesses:", error);
        throw error;
      }
      return (data || []) as User[];
    },

    /**
     * getLeaderboard(): Ranking de jugadores por saldo FitCoins
     * Orden descendente, top 20.
     */
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

  // ==============================================================
  // SECCIÓN: MATCHES (Partidos / Encuentros deportivos)
  // ==============================================================
  matches: {
    /**
     * getAll(): Obtiene todos los partidos abiertos
     * Incluye datos de la cancha (court) y participantes (match_participants)
     * con sus perfiles expandidos.
     */
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
      // Transforma la respuesta: extrae los perfiles de current_players
      // filtrando solo los que tienen status ACCEPTED o ATTENDED
      return ((data as unknown as DBResponseMatch[]) || []).map((m) => ({
        ...m,
        current_players:
          m.match_participants
            ?.filter((p) => p.status === "ACCEPTED" || p.status === "ATTENDED")
            .map((p) => p.profile)
            .filter((p): p is User => !!p) || [],
      })) as unknown as Match[];
    },

    /**
     * getUserMatches(): Partidos creados por un usuario específico
     */
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

    /**
     * create(): Crea un nuevo partido
     * Acepta múltiples naming conventions (creator_id/user_id, time/time_slot)
     * para compatibilidad con diferentes formularios.
     */
    async create(match: {
      title: string;
      sport: string;
      court_id: string | null;
      date: string;
      time?: string;
      time_slot?: string;
      max_players?: number;
      required_level?: string;
      creator_id?: string;
      user_id?: string;
      operating_hours?: string[];
    }): Promise<Match> {
      const creatorId = match.creator_id || match.user_id || "";
      const timeVal = match.time || match.time_slot || "";
      const maxPlayersVal = match.max_players || 4;
      const requiredLevelVal = match.required_level || "Intermedio";

      if (useAuthStore.getState().isDemoMode) {
        const newMatch: Match = {
          id: `match-demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          title: match.title,
          sport: match.sport as Sport,
          court_id: match.court_id || "",
          date: match.date,
          time: timeVal,
          max_players: maxPlayersVal,
          required_level: requiredLevelVal as Level,
          creator_id: creatorId,
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
            time: timeVal,
            max_players: maxPlayersVal,
            required_level: requiredLevelVal,
            creator_id: creatorId,
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

  // ==============================================================
  // SECCIÓN: WALLET (Billetera FitCoins)
  // ==============================================================
  wallet: {
    /**
     * getBalance(): Obtiene el saldo actual de FitCoins de un usuario
     */
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

    /**
     * getTransactions(): Historial de transacciones del usuario
     * Ordenado por fecha descendente (más reciente primero)
     */
    async getTransactions(userId: string): Promise<Transaction[]> {
      if (useAuthStore.getState().isDemoMode) {
        const key = `sportmatch_demo_transactions_${userId}`;
        const stored = localStorage.getItem(key);
        if (!stored) {
          // Primera vez: seed con transacciones mock
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

    /**
     * saveTransaction(): Guarda una transacción localmente (solo Demo Mode)
     * Persiste en localStorage para mantener el historial entre recargas.
     */
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
        // Evita duplicados
        if (!transactions.some((t) => t.id === tx.id)) {
          transactions = [tx, ...transactions];
        }
        localStorage.setItem(key, JSON.stringify(transactions));
      }
    },

    /**
     * updateBalance(): Actualiza el saldo localmente (solo Demo Mode)
     * Sincroniza: localStorage + MOCK_USERS + store de auth
     * para que el cambio sea visible en toda la app inmediatamente.
     */
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

        // Refleja el cambio en el store de autenticación (UI reactiva)
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id === userId) {
          useAuthStore.setState({ user: { ...currentUser, fitcoins_balance: newBalance } });
        }
      }
    },
  },

  // ==============================================================
  // SECCIÓN: VENUES (Canchas / Sedes deportivas)
  // ==============================================================
  venues: {
    /**
     * getAll(): Lista todas las canchas, opcionalmente filtradas por deporte
     */
    async getAll(sport?: string): Promise<Venue[]> {
      if (useAuthStore.getState().isDemoMode) {
        const stored = localStorage.getItem("sportmatch_demo_venues");
        let list: Venue[] = [];
        if (stored) {
          try {
            list = JSON.parse(stored);
          } catch {
            list = [...MOCK_VENUES];
          }
        } else {
          list = [...MOCK_VENUES];
          localStorage.setItem("sportmatch_demo_venues", JSON.stringify(list));
        }
        if (sport) {
          return list.filter((c) => c.sport === sport);
        }
        return list;
      }

      let query = supabase.from("courts").select("*");
      if (sport) {
        query = query.eq("sport", sport);
      }
      const { data, error } = await query;
      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching venues:", error);
        throw error;
      }
      return (data || []) as Venue[];
    },

    /**
     * getById(): Obtiene una cancha por su ID
     */
    async getById(id: string): Promise<Venue> {
      if (useAuthStore.getState().isDemoMode) {
        const stored = localStorage.getItem("sportmatch_demo_venues");
        let list: Venue[] = [];
        if (stored) {
          try {
            list = JSON.parse(stored);
          } catch {
            list = [...MOCK_VENUES];
          }
        } else {
          list = [...MOCK_VENUES];
          localStorage.setItem("sportmatch_demo_venues", JSON.stringify(list));
        }
        const found = list.find((c) => c.id === id);
        if (!found) throw new Error("Venue not found");
        return found;
      }
      const { data, error } = await supabase.from("courts").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Venue;
    },
  },

  // Alias "courts" para compatibilidad con código existente
  get courts() {
    return this.venues;
  },

  // ==============================================================
  // SECCIÓN: SPORTS (Catálogo de deportes)
  // ==============================================================
  sports: {
    /**
     * getAll(): Obtiene el catálogo completo de deportes
     * Implementa un caché simple para evitar consultas repetitivas.
     * Si la tabla "sports" no existe en Supabase, fallback a datos mock.
     */
    async getAll(): Promise<SportCatalog[]> {
      if (useAuthStore.getState().isDemoMode) {
        return MOCK_SPORTS;
      }

      if (cachedSportsCatalog) {
        return cachedSportsCatalog;
      }

      try {
        const { data, error } = await supabase.from("sports").select("*").order("name");
        if (error) {
          throw error;
        }
        cachedSportsCatalog = (data || []) as SportCatalog[];
        return cachedSportsCatalog;
      } catch (err) {
        console.warn(
          "Table 'sports' not found or failed to fetch. Falling back to local catalog:",
          err,
        );
        cachedSportsCatalog = MOCK_SPORTS;
        return cachedSportsCatalog;
      }
    },
  },

  // ==============================================================
  // SECCIÓN: BOOKINGS (Reservas de canchas)
  // ==============================================================
  bookings: {
    /**
     * getByCourtAndDate(): Obtiene los slots ocupados de una cancha en una fecha
     * @returns string[] - Array de time slots ya reservados (ej: ["10:00", "16:00"])
     */
    async getByCourtAndDate(courtId: string, date: string): Promise<string[]> {
      if (useAuthStore.getState().isDemoMode) {
        const key = `${courtId}_${date}`;
        if (!demoBookingsCache[key]) {
          // BUG-03: Cada cancha tiene slots pre-ocupados diferentes
          // para que la demo se sienta realista (no todas vacías)
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

    /**
     * create(): Reserva un slot horario en una cancha
     * Incluye validación SEC-03: verifica que el slot pertenezca
     * al horario de atención de la cancha (operating_hours).
     * También guarda datos financieros (comisiones, precios).
     */
    async create(booking: {
      court_id: string;
      date: string;
      time_slot: string;
      user_id: string;
      operating_hours?: string[];
      precio_cancha?: number;
      porcentaje_comision?: number;
      monto_comision?: number;
      total_cobrado?: number;
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

      // SEC-03: Validación de horario vs operating_hours
      // Evita reservas en horarios inválidos (ej: 3 AM) incluso si
      // las políticas RLS estuvieran mal configuradas
      if (booking.operating_hours && booking.operating_hours.length > 0) {
        if (!booking.operating_hours.includes(booking.time_slot)) {
          throw new Error(
            `El horario "${booking.time_slot}" no es válido para esta cancha. Horarios disponibles: ${booking.operating_hours.join(", ")}`,
          );
        }
      }

      const {
        time_slot,
        court_id,
        date,
        user_id,
        precio_cancha,
        porcentaje_comision,
        monto_comision,
        total_cobrado,
      } = booking;
      const { error } = await withTimeout(
        supabase.from("bookings").insert({
          court_id,
          date,
          time_slot,
          user_id,
          precio_cancha,
          porcentaje_comision,
          monto_comision,
          total_cobrado,
        }),
      );
      if (error) {
        if (import.meta.env.DEV) console.error("Error creating booking:", error);
        throw error;
      }
    },
  },
};
