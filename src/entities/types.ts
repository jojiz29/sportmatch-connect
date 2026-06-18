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
  gender?: "Masculino" | "Femenino" | "Mixto";
  dni_verificado?: boolean;
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
