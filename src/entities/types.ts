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

  // Relaciones
  court?: Court;
  current_players?: User[];
}

export interface Transaction {
  id: string; // UUID
  created_at: string;
  user_id: string;
  amount: number; // Positivo (ganancia) o Negativo (gasto)
  description: string;
  type: "EARN" | "SPEND" | "EARN" | "SPEND" | "PENALTY"; // Added EARN and SPEND
}

export interface TelemetryData {
  heartRate: number;
  calories: number;
  distanceKm: number;
  pace: string;
  steps: number;
  timestamp: string; // ISO 8601
}
