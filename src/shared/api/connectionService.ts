import { User } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "./supabase";
import { withTimeout } from "./timeoutHelper";

const DEMO_STORAGE_KEY = "sportmatch_demo_player_connections";

export interface PlayerConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  sport: string | null;
  compatibility_score: number | null;
  created_at: string;
  connected_user?: User | null;
}

export interface ConnectionResult {
  connection: PlayerConnection;
  isMutualMatch: boolean;
  conversationId: string | null;
}

interface CreateConnectionInput {
  userId: string;
  connectedUserId: string;
  sport?: string | null;
  compatibilityScore?: number | null;
}

function getDemoConnections(): PlayerConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("No se pudieron leer las conexiones demo:", error);
    return [];
  }
}

function saveDemoConnections(connections: PlayerConnection[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(connections));
}

/**
 * Guarda una recomendación como conexión deportiva sin crear todavía un desafío,
 * invitación o chat. Así cada acción posterior puede repetirse de forma independiente.
 */
export async function createPlayerConnection(
  input: CreateConnectionInput,
): Promise<ConnectionResult> {
  if (input.userId === input.connectedUserId) {
    throw new Error("No puedes conectarte contigo mismo.");
  }

  if (useAuthStore.getState().isDemoMode) {
    const connections = getDemoConnections();
    const existing = connections.find(
      (connection) =>
        connection.user_id === input.userId &&
        connection.connected_user_id === input.connectedUserId,
    );
    if (existing) {
      const reciprocal = connections.some(
        (connection) =>
          connection.user_id === input.connectedUserId &&
          connection.connected_user_id === input.userId,
      );
      return { connection: existing, isMutualMatch: reciprocal, conversationId: null };
    }

    const connection: PlayerConnection = {
      id: `connection-${Date.now()}`,
      user_id: input.userId,
      connected_user_id: input.connectedUserId,
      sport: input.sport || null,
      compatibility_score: input.compatibilityScore ?? null,
      created_at: new Date().toISOString(),
    };
    saveDemoConnections([connection, ...connections]);
    const reciprocal = connections.some(
      (item) => item.user_id === input.connectedUserId && item.connected_user_id === input.userId,
    );
    return { connection, isMutualMatch: reciprocal, conversationId: null };
  }

  // Consultamos primero para no depender de UPDATE durante un upsert.
  // Esto evita esperas innecesarias cuando las políticas RLS solo permiten insertar.
  const { data: existing, error: existingError } = await withTimeout(
    supabase
      .from("player_connections")
      .select("*")
      .eq("user_id", input.userId)
      .eq("connected_user_id", input.connectedUserId)
      .maybeSingle(),
  );

  if (existingError) throw existingError;
  let connection = existing as PlayerConnection | null;

  if (!connection) {
    const { data, error } = await withTimeout(
      supabase
        .from("player_connections")
        .insert({
          user_id: input.userId,
          connected_user_id: input.connectedUserId,
          sport: input.sport || null,
          compatibility_score: input.compatibilityScore ?? null,
        })
        .select("*")
        .single(),
    );

    if (error) throw error;
    connection = data as PlayerConnection;
  }

  const { data: reciprocal, error: reciprocalError } = await withTimeout(
    supabase
      .from("player_connections")
      .select("id")
      .eq("user_id", input.connectedUserId)
      .eq("connected_user_id", input.userId)
      .maybeSingle(),
  );
  if (reciprocalError) throw reciprocalError;

  let conversationId: string | null = null;
  if (reciprocal) {
    const { data, error } = await withTimeout(
      supabase.rpc("create_direct_conversation", { other_user_id: input.connectedUserId }),
    );
    if (error) throw error;
    conversationId = data as string;
  }

  return { connection, isMutualMatch: Boolean(reciprocal), conversationId };
}

/**
 * Recupera las conexiones del usuario junto con el perfil que se mostrará
 * en la bandeja de Mensajes.
 */
export async function getPlayerConnections(userId: string): Promise<PlayerConnection[]> {
  if (useAuthStore.getState().isDemoMode) {
    return getDemoConnections().filter((connection) => connection.user_id === userId);
  }

  const { data, error } = await supabase
    .from("player_connections")
    .select("*, connected_user:profiles!player_connections_connected_user_id_fkey(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as PlayerConnection[];
}

/**
 * Devuelve únicamente conexiones confirmadas por ambos jugadores.
 * Las solicitudes unilaterales permanecen fuera de Mensajes hasta convertirse en match.
 */
export async function getMutualPlayerConnections(userId: string): Promise<PlayerConnection[]> {
  const outgoing = await getPlayerConnections(userId);

  if (useAuthStore.getState().isDemoMode) {
    const allConnections = getDemoConnections();
    return outgoing.filter((connection) =>
      allConnections.some(
        (candidate) =>
          candidate.user_id === connection.connected_user_id &&
          candidate.connected_user_id === userId,
      ),
    );
  }

  const { data: incoming, error } = await supabase
    .from("player_connections")
    .select("user_id")
    .eq("connected_user_id", userId);
  if (error) throw error;

  const incomingUserIds = new Set((incoming || []).map((connection) => connection.user_id));
  return outgoing.filter((connection) => incomingUserIds.has(connection.connected_user_id));
}
