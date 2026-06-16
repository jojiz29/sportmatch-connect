/**
 * ===================================================================
 * ARCHIVO: src/shared/api/connectionService.ts
 * PROPÓSITO: Servicio de conexiones entre jugadores (player_connections).
 *            Cuando dos jugadores se conectan mutuamente, se crea
 *            un "match mutuo" y se abre automáticamente un chat
 *            directo entre ellos.
 * FLUJO: Jugador A conecta con B -> se guarda relación ->
 *        Si B ya había conectado con A -> MatchMutuo! ->
 *        Se crea conversación de chat automáticamente.
 * ===================================================================
 */

import { User } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "./supabase";
import { withTimeout } from "./timeoutHelper";

const DEMO_STORAGE_KEY = "sportmatch_demo_player_connections";

// ==============================================================
// TIPOS
// ==============================================================

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

// ==============================================================
// HELPERS DE DEMO MODE
// ==============================================================

function getDemoConnections(): PlayerConnection[] {
  if (typeof globalThis.window === "undefined") return [];
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("No se pudieron leer las conexiones demo:", error);
    return [];
  }
}

function saveDemoConnections(connections: PlayerConnection[]): void {
  if (typeof globalThis.window === "undefined") return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(connections));
}

// ==============================================================
// FUNCIONES PRINCIPALES
// ==============================================================

/**
 * createPlayerConnection(): Crea una conexión entre dos jugadores
 * ------------------------------------------------------------------
 * Estrategia "query first, insert second" para evitar depender de
 * UPDATE en políticas RLS restrictivas (algunas solo permiten INSERT).
 *
 * Si la conexión ya existe, la retorna sin duplicar.
 * Si existe la conexión recíproca (el otro usuario ya conectó),
 * se considera "Mutual Match" y se crea automáticamente una
 * conversación de chat mediante la RPC create_direct_conversation.
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

  // --- MODO REAL: Primero consulta si ya existe ---
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

  // Si no existe, crea la conexión
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

  // Verifica si hay conexión recíproca (mutual match)
  const { data: reciprocal, error: reciprocalError } = await withTimeout(
    supabase
      .from("player_connections")
      .select("id")
      .eq("user_id", input.connectedUserId)
      .eq("connected_user_id", input.userId)
      .maybeSingle(),
  );
  if (reciprocalError) throw reciprocalError;

  // Si es mutuo, crea conversación de chat automáticamente
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
 * getPlayerConnections(): Conexiones de un usuario (salientes)
 * Incluye el perfil completo del usuario conectado via JOIN.
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
 * getMutualPlayerConnections(): Solo conexiones recíprocas
 * ------------------------------------------------------------------
 * Filtra las conexiones del usuario para devolver únicamente aquellas
 * donde el otro usuario también conectó con él (match mutuo).
 * Estas son las que aparecen en la bandeja de Mensajes.
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
