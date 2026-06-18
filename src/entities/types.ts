// === BLOQUE: TIPOS DE DEPORTES ===
// Unión de todos los deportes físicos y esports disponibles en la plataforma.
// Cada string coincide con el nombre mostrado en la UI y la clave en deportes_matrix.
export type Sport =
  | "Fútbol"
  | "Básquet"
  | "Tenis"
  | "Pádel"
  | "Vóley"
  | "Running"
  | "Rugby"
  | "Natación"
  | "Gimnasio"
  | "Calistenia"
  | "Tenis de Mesa"
  | "Boxeo / MMA"
  | "Ciclismo"
  | "Fútbol Americano"
  | "Béisbol"
  | "Skateboarding"
  | "Golf"
  | "Automovilismo"
  | "EA Sports FC"
  | "League of Legends"
  | "Valorant"
  | "Clash Royale"
  | "Fortnite"
  | "Brawl Stars"
  | "Counter-Strike 2"
  | "Dota 2"
  | "Rocket League"
  | "Overwatch 2"
  | "Street Fighter / Tekken"
  | "Apex Legends"
  | "PUBG Mobile"
  | "Free Fire"
  | "Call of Duty: Warzone"
  | "Rainbow Six Siege"
  | "Hearthstone"
  | "iRacing / F1 SimRacing";

// === BLOQUE: PREFERENCIAS DEPORTIVAS ===
// Almacena la matriz deportiva del usuario (nivel y peso por deporte) junto con
// la intención conductual (recreativo vs. competitivo) usada para el matchmaking.
export interface SportPreferences {
  sports_matrix: {
    [sportName: string]: {
      level: "Amateur" | "Intermediate" | "Advanced" | "Pro";
      weight: number;
    };
  };
  behavioral_intent: {
    weekly_hours: number;
    intent: "Recreativo" | "Competitivo";
  };
}

// === BLOQUE: CATÁLOGO DE DEPORTES ===
// Representa un deporte dentro del catálogo global, con su slug de icono
// y la cantidad máxima predeterminada de jugadores por partido.
export interface SportCatalog {
  id: string;
  name: string;
  icon_slug: string;
  default_max_players: number;
  created_at: string;
}

// === BLOQUE: NIVEL DE HABILIDAD ===
// Escala de cuatro niveles usada en partidos, perfiles y filtros de búsqueda.
export type Level = "Principiante" | "Intermedio" | "Avanzado" | "Elite";

// === BLOQUE: USUARIO / PERFIL ===
// Tipo principal que representa a cualquier usuario de la plataforma.
// Incluye tanto campos de jugador (PLAYER) como de negocio (BUSINESS),
// más metadatos de verificación DNI y datos comerciales B2B.
export interface User {
  id: string; // UUID — identificador único del perfil
  created_at: string; // ISO 8601 — fecha de creación del perfil
  name: string;
  age: number;
  city: string;
  avatar_url: string;
  bio: string | null;
  trust_score: number; // 0-100 — puntuación de confianza del usuario
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
  business_category?:
    | "Canchas"
    | "Gym"
    | "Tienda"
    | "Bebidas"
    | "Academia"
    | "Nutricionista"
    | "Fisioterapia"
    | "Torneos"
    | "Marcas"
    | "Patrocinador";
  is_sponsored?: boolean;
  is_admin?: boolean;
  sport_preferences?: SportPreferences;
  // B2B commercial fields
  images?: string[];
  address?: string;
  district?: string;
  operating_hours?: string[];
  whatsapp?: string;
  instagram?: string;
  website?: string;
  user_sports?: { sport_id: string; level: 1 | 2 | 3 }[];
  onboarding_completed?: boolean;
  push_token?: string | null;
  gender?: "Masculino" | "Femenino" | "Otro";
  dni_verificado?: boolean;
  photo_verified?: boolean;
  dni_hash?: string | null;
  dni_intentos?: number;
  fecha_verificacion?: string | null;
  xp?: number;
  xp_level?: number;
  xp_to_next_level?: number;
  tier?: "FREE" | "PREMIUM";
}

// === BLOQUE: SEDE / CANCHA DEPORTIVA ===
// Representa una cancha, gimnasio o instalación deportiva con geolocalización,
// precio, rating y metadatos B2B (como patrocinio destacado en mapa).
export interface Venue {
  id: string; // UUID
  created_at: string;
  name: string;
  sport: string; // String dinámico para admitir cualquier deporte del catálogo
  price_per_hour: number;
  rating: number;
  reviews_count: number;
  lat: number;
  lng: number;
  image_url: string;
  amenities: string[];
  is_available: boolean;
  location?: { lat: number; lng: number }; // Geolocalización estructurada
  address?: string;
  distance_km?: number;
  is_sponsored?: boolean; // Patrocinador B2B — destacado en mapa con borde dorado
  owner_id?: string;
  max_players?: number; // Para cálculo dinámico de costo por jugador
  operating_hours?: string[]; // Horarios únicos por cancha
  district?: string;
  description?: string;
}

// Alias de compatibilidad hacia atrás para partes de la app fuera del flujo BUSINESS
export type Court = Venue;

// === BLOQUE: PARTIDO ===
// Representa un partido creado por un usuario, vinculado a una cancha,
// con fecha, hora, nivel requerido y estado del encuentro.
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
  creator_id: string; // Necesario para la política RLS
  status?: "Open" | "Full" | "Finished" | "Cancelled" | "IN_PROGRESS";

  // Relaciones
  court?: Court;
  current_players?: User[];
}

// === BLOQUE: PARTICIPANTE DE PARTIDO ===
// Relación muchos-a-muchos entre usuarios y partidos, con estado de asistencia.
export interface MatchParticipant {
  match_id: string;
  user_id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "ATTENDED";
  joined_at: string;
}

// === BLOQUE: TRANSACCIÓN ===
// Movimiento financiero dentro del monedero FitCoins.
// El amount puede ser positivo (ganancia) o negativo (gasto/penalización).
export interface Transaction {
  id: string; // UUID
  created_at: string;
  user_id: string;
  amount: number; // Positivo (ganancia) o Negativo (gasto)
  description: string;
  type: "EARN" | "SPEND" | "PENALTY";
}

// === BLOQUE: TELEMETRÍA ===
// Datos biométricos y de rendimiento enviados desde dispositivos wearables
// durante la práctica deportiva (frecuencia cardíaca, calorías, distancia, etc.).
export interface TelemetryData {
  heartRate: number;
  calories: number;
  distanceKm: number;
  pace: string;
  steps: number;
  timestamp: string; // ISO 8601
}

// === BLOQUE: PUBLICACIÓN ===
// Contenido generado por el usuario en el feed social.
// Puede ser resultado de partido, foto, anuncio de escuadra o texto plano.
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
  flagged?: boolean;
  sensitive?: boolean;
}

// === BLOQUE: ESCUADRA ===
// Grupo o equipo creado por un usuario para organizar partidos
// y mantener una comunidad deportiva cerrada.
export interface Squad {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  creator_id: string;
  avatar_url: string | null;
  members_count?: number;
}

// === BLOQUE: MIEMBRO DE ESCUADRA ===
// Relación muchos-a-muchos entre usuarios y escuadras.
export interface SquadMember {
  squad_id: string;
  user_id: string;
  joined_at: string;
}

// === BLOQUE: PRODUCTO / SERVICIO COMERCIAL ===
// Artículo del catálogo de un negocio (cancha, academia, tienda, etc.)
// Puede ser un producto físico o un servicio.
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

// === BLOQUE: NOTIFICACIÓN ===
// Notificación push o in-app enviada a un usuario.
// El campo link permite deep linking dentro de la app.
export interface AppNotification {
  id: string;
  user_id: string;
  type:
    | "FOLLOW"
    | "SQUAD_INVITE"
    | "TRANSACTION_SUCCESS"
    | "AD_IMPRESSION"
    | "MATCH_ALERT"
    | "SQUAD_MESSAGE";
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// === BLOQUE: TIPO DE REACCIÓN ===
// Reacciones admitidas en comentarios, incluyendo emojis inline.
export type ReactionType = "LIKE" | "DISLIKE" | "❤️" | "🔥" | "👏" | "😂" | "😢" | "🎉";

// === BLOQUE: COMENTARIO DE PUBLICACIÓN ===
// Comentario anidado dentro de una publicación del feed.
// parent_id permite respuestas en hilo (comentarios de comentarios).
export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user_name?: string;
  user_avatar?: string;
  flagged?: boolean;
  sensitive?: boolean;
}

// === BLOQUE: REACCIÓN A COMENTARIO ===
// Reacción de un usuario a un comentario específico.
export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

// === BLOQUE: ANUNCIO PUBLICITARIO ===
// Anuncio de un negocio visible en la plataforma.
// Incluye métricas de rendimiento (vistas, clics, contactos)
// y flags de monetización (destacado, premium).
export interface Ad {
  id: string;
  business_id: string;
  title: string;
  description: string;
  image_url: string;
  category:
    | "Canchas"
    | "Gym"
    | "Academia"
    | "Tienda"
    | "Nutricionista"
    | "Fisioterapia"
    | "Torneos"
    | "Marcas"
    | "Patrocinador"
    | "Bebidas";
  location: string;
  district?: string;
  valid_until: string; // ISO 8601 string
  contact_phone: string; // WhatsApp link or phone
  views: number;
  clicks: number;
  contacts: number;
  is_featured: boolean; // placeholder for monetization
  is_premium: boolean; // placeholder for monetization
  created_at: string;
}

// === BLOQUE: MATCHMAKING (V2.3) ===
export type QueueStatus = "WAITING" | "FOUND" | "CANCELLED";
export type SwipeAction = "LIKE" | "PASS";

export interface PlayerRating {
  user_id: string;
  sport: string;
  elo_rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  last_match_at: string | null;
}

export interface QueueEntry {
  user_id: string;
  sport: string;
  status: QueueStatus;
  lat: number;
  lng: number;
  radius_km: number;
  matched_with: string | null;
  matched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SwipeResult {
  mutual_like: boolean;
  action?: SwipeAction;
  conversation_id?: string | null;
}

// ============================================================
// BLOQUE: B2B-AI — Tipos para inteligencia de negocios
// Feature #9 (Dynamic Pricing), #21 (Ads Optimizer), #23 (Churn Predictor)
// Espejo de los DTOs del backend NestJS (server/src/ai/b2b/dto/).
// ============================================================

/**
 * Contribución marginal SHAP-style de una feature a una predicción.
 * No es la librería SHAP oficial — es explicabilidad simulada
 * calculada en el backend como (value - baseline) * weight * scale.
 */
export interface ShapFeature {
  /** Nombre legible de la feature (en español) */
  feature: string;
  /** Contribución marginal al output. Positivo = subió la predicción, negativo = bajó. */
  contribution: number;
  /** Valor crudo observado para esta feature */
  value: number;
  /** Peso relativo usado en el modelo (0-1) */
  weight?: number;
}

/**
 * Metadata de la llamada al LLM (Vertex AI).
 * Devuelta por todos los endpoints B2B-AI.
 */
export interface AiMetadata {
  tokens: number;
  model: string;
  latencyMs: number;
}

/**
 * Feature #9 — Recomendación de precio dinámico para una cancha/fecha/hora.
 */
export interface PricingRecommendation {
  /** Precio recomendado en PEN para el slot */
  recommendedPrice: number;
  /** Precio base (precio_per_hour de la cancha) */
  baseline: number;
  /** Cambio porcentual respecto al baseline (-0.3 a +0.3) */
  deltaPct: number;
  /** Tasa de ocupación esperada (0-1) */
  occupancyRate: number;
  /** Nivel de confianza del modelo (0-1) */
  confidence: number;
  /** Cantidad de reservas históricas usadas */
  sampleSize: number;
  /** Mejor hora del día (si el request no especificó hour) */
  bestHour?: number;
  /** Drivers SHAP-style que explican la predicción */
  drivers: ShapFeature[];
  /** Narrative ejecutivo en lenguaje natural generado por Vertex AI */
  narrative: string;
  /** Metadata de la llamada LLM */
  metadata: AiMetadata;
}

/**
 * Feature #21 — Variante de anuncio generada o evaluada.
 */
export interface AdVariant {
  variantId: "A" | "B" | "C" | "D";
  title: string;
  description: string;
  style: "original" | "emocional" | "racional" | "urgencia";
  /** Score UCB1 (meanReward + explorationBonus) */
  score: number;
  /** CTR predicho (0-1) */
  predictedCtr: number;
}

/**
 * Feature #21 — Resultado de optimización de un anuncio.
 */
export interface AdsOptimization {
  variants: AdVariant[];
  /** variantId de la variante recomendada (la de mayor score) */
  recommendation: string;
  /** Lift esperado en puntos porcentuales de CTR al cambiar a la recomendada */
  expectedLift: number;
  /** CTR actual del anuncio (baseline) */
  currentCtr: number;
  /** Total de vistas acumuladas */
  sampleSize: number;
  drivers: ShapFeature[];
  narrative: string;
  metadata: AiMetadata;
}

/**
 * Feature #23 — Factor explicativo de churn.
 */
export interface ChurnFactor {
  name: string;
  description: string;
  /** Severidad 0-1, 1 = máxima contribución al churn */
  severity: number;
  suggestedAction: string;
}

/**
 * Feature #23 — Predicción de churn de un negocio.
 */
export interface ChurnPrediction {
  /** Score 0-1, 1 = máximo riesgo */
  churnScore: number;
  riskLevel: "low" | "medium" | "high";
  /** Factores ordenados por severity descendente */
  factors: ChurnFactor[];
  daysSinceLastInteraction: number;
  activeAdsCount: number;
  totalRevenue: number;
  totalEngagement: number;
  drivers: ShapFeature[];
  narrative: string;
  metadata: AiMetadata;
}

/**
 * Tipos de métricas de uso capturadas para alimentar los modelos B2B-AI.
 * Espejo del enum `b2b_metric_type` en la migración 20260616.
 */
export type UsageMetricType =
  | "profile_view"
  | "ad_view"
  | "ad_click"
  | "ad_contact"
  | "map_pin_click"
  | "venue_booking";

/**
 * Evento de uso individual. En Supabase vive en la tabla `usage_metrics`;
 * en demo mode se persiste en localStorage.
 */
export interface UsageMetric {
  id: string;
  business_id: string;
  metric_type: UsageMetricType;
  value: number;
  recorded_at: string;
}
