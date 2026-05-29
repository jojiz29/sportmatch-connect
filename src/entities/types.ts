export type Sport = "Fútbol" | "Básquet" | "Tenis" | "Pádel" | "Vóley" | "Running";

export type Level = "Principiante" | "Intermedio" | "Avanzado" | "Elite";

export interface User {
  id: string; // UUID
  created_at: string; // ISO 8601
  name: string;
  age: number;
  city: string;
  avatar_url: string;
  bio: string | null;
  trust_score: number; // 0-100
  fitcoins_balance: number;
  level: Level;
  preferred_sports: Sport[];
  matches_played: number;
  last_location_lat: number | null;
  last_location_lng: number | null;
  distance_km?: number; // Calculado en runtime o vista de BD
  email?: string;
  password?: string;
  followers_count?: number;
  following_count?: number;
  user_role?: "PLAYER" | "BUSINESS";
  company_name?: string;
  business_category?: "Canchas" | "Gym" | "Tienda" | "Bebidas";
  is_sponsored?: boolean;
  is_admin?: boolean;
}

export interface Court {
  id: string; // UUID
  created_at: string;
  name: string;
  sport: Sport;
  price_per_hour: number;
  rating: number;
  reviews_count: number;
  lat: number;
  lng: number;
  image_url: string;
  amenities: string[];
  is_available: boolean;
  location?: { lat: number; lng: number }; // Added to match prompt
  address?: string; // Added to match prompt
  distance_km?: number;
  is_sponsored?: boolean; // Patrocinador B2B — destacado en mapa con borde dorado
  owner_id?: string;
}

export interface Match {
  id: string; // UUID
  created_at: string;
  court_id: string;
  sport: Sport;
  title: string;
  date: string; // ISO 8601 date
  time: string; // time string
  max_players: number;
  required_level: Level;
  creator_id: string; // Faltaba para hacer match con RLS
  status?: "Open" | "Full" | "Finished" | "Cancelled";

  // Relaciones
  court?: Court;
  current_players?: User[];
}

export interface MatchParticipant {
  match_id: string;
  user_id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  joined_at: string;
}

export interface Transaction {
  id: string; // UUID
  created_at: string;
  user_id: string;
  amount: number; // Positivo (ganancia) o Negativo (gasto)
  description: string;
  type: "EARN" | "SPEND" | "PENALTY";
}

export interface TelemetryData {
  heartRate: number;
  calories: number;
  distanceKm: number;
  pace: string;
  steps: number;
  timestamp: string; // ISO 8601
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  type: "MATCH_RESULT" | "PHOTO" | "SQUAD_ANNOUNCEMENT" | "TEXT";
  created_at: string;
  media_url?: string;
  sport?: Sport;
  user_name?: string;
  user_avatar?: string;
}

export interface Squad {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  creator_id: string;
  avatar_url: string | null;
  members_count?: number;
}

export interface SquadMember {
  squad_id: string;
  user_id: string;
  joined_at: string;
}

export interface CatalogItem {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  type: "PRODUCT" | "SERVICE";
  image_url: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: "FOLLOW" | "SQUAD_INVITE" | "TRANSACTION_SUCCESS" | "AD_IMPRESSION";
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
