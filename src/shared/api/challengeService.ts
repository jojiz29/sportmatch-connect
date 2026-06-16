/**
 * ===================================================================
 * ARCHIVO: src/shared/api/challengeService.ts
 * PROPÓSITO: Servicio de desafíos jugador vs jugador.
 *            Permite a los jugadores retarse mutuamente en un
 *            deporte específico, y aceptar/rechazar desafíos.
 * INCLUYE: Creación, listado de pendientes (enviados/recibidos),
 *          respuesta (aceptar/rechazar).
 * ===================================================================
 */

import { supabase } from "./supabase";
import { useAuthStore } from "@/entities/user/useAuth";

const DEMO_STORAGE_KEY = "sportmatch_demo_player_challenges";

// ==============================================================
// TIPOS
// ==============================================================

export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "counter_proposed";

export interface PlayerChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  sport: string;
  modality: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  location: string | null;
  message: string | null;
  status: ChallengeStatus;
  created_at: string;
  updated_at: string;
  challenger?: {
    id: string;
    name: string;
    avatar_url: string | null;
    level: string;
  } | null;
}

export interface CreateChallengeInput {
  challengerId: string;
  challengedId: string;
  sport: string;
  modality?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
  message?: string;
}

// ==============================================================
// HELPERS DE DEMO MODE
// ==============================================================
export interface CounterProposalInput {
  challengeId: string;
  challengedId: string;
  scheduledDate: string;
  scheduledTime: string;
  location?: string;
}

function getDemoChallenges(): PlayerChallenge[] {
  if (globalThis.window === undefined) return [];
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("No se pudieron leer los desafíos demo:", error);
    return [];
  }
}

function saveDemoChallenges(challenges: PlayerChallenge[]): void {
  if (globalThis.window === undefined) return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(challenges));
}

// ==============================================================
// FUNCIONES PRINCIPALES
// ==============================================================

/**
 * createPlayerChallenge(): Crea un desafío pendiente
 * ------------------------------------------------------------------
 * Valida que no sea autodesafío y evita duplicados activos
 * (mismo deporte + mismo rival + estado pending) tanto en el
 * cliente como en PostgreSQL (código 23505 = unique violation).
 */
export async function createPlayerChallenge(input: CreateChallengeInput): Promise<PlayerChallenge> {
  if (input.challengerId === input.challengedId) {
    throw new Error("No puedes desafiarte a ti mismo.");
  }

  if (useAuthStore.getState().isDemoMode) {
    const challenges = getDemoChallenges();
    const duplicate = challenges.find(
      (challenge) =>
        challenge.challenger_id === input.challengerId &&
        challenge.challenged_id === input.challengedId &&
        challenge.sport === input.sport &&
        challenge.status === "pending",
    );
    if (duplicate) return duplicate;

    const now = new Date().toISOString();
    const challenge: PlayerChallenge = {
      id: `challenge-${Date.now()}`,
      challenger_id: input.challengerId,
      challenged_id: input.challengedId,
      sport: input.sport,
      modality: input.modality || "amistoso",
      scheduled_date: input.scheduledDate || null,
      scheduled_time: input.scheduledTime || null,
      location: input.location?.trim() || null,
      message: input.message?.trim() || null,
      status: "pending",
      created_at: now,
      updated_at: now,
    };
    saveDemoChallenges([challenge, ...challenges]);
    return challenge;
  }

  const { data, error } = await supabase
    .from("player_challenges")
    .insert({
      challenger_id: input.challengerId,
      challenged_id: input.challengedId,
      sport: input.sport,
      modality: input.modality || "amistoso",
      scheduled_date: input.scheduledDate || null,
      scheduled_time: input.scheduledTime || null,
      location: input.location?.trim() || null,
      message: input.message?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    // PostgreSQL error 23505 = unique constraint violation (desafío duplicado)
    if (error.code === "23505") {
      const existing = await getPendingChallengesSent(input.challengerId);
      const duplicate = existing.find(
        (challenge) =>
          challenge.challenged_id === input.challengedId && challenge.sport === input.sport,
      );
      if (duplicate) return duplicate;
    }
    throw error;
  }

  return data as PlayerChallenge;
}

/**
 * getPendingChallengesSent(): Desafíos pendientes ENVIADOS por un jugador
 */
export async function getPendingChallengesSent(challengerId: string): Promise<PlayerChallenge[]> {
  if (useAuthStore.getState().isDemoMode) {
    return getDemoChallenges().filter(
      (challenge) => challenge.challenger_id === challengerId && challenge.status === "pending",
    );
  }

  const { data, error } = await supabase
    .from("player_challenges")
    .select("*")
    .eq("challenger_id", challengerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as PlayerChallenge[];
}

/**
 * getPendingChallengesReceived(): Desafíos pendientes RECIBIDOS por un jugador
 * Incluye los datos del retador (nombre, avatar, nivel) mediante JOIN.
 */
export async function getPendingChallengesReceived(
  challengedId: string,
): Promise<PlayerChallenge[]> {
  if (useAuthStore.getState().isDemoMode) {
    return getDemoChallenges().filter(
      (challenge) => challenge.challenged_id === challengedId && challenge.status === "pending",
    );
  }

  const { data, error } = await supabase
    .from("player_challenges")
    .select(
      "*, challenger:profiles!player_challenges_challenger_id_fkey(id, name, avatar_url, level)",
    )
    .eq("challenged_id", challengedId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as PlayerChallenge[];
}

/**
 * respondToPlayerChallenge(): Acepta o rechaza un desafío recibido
 * ------------------------------------------------------------------
 * La validación triple (id + challenged_id + status pending) actúa
 * como seguridad adicional a las políticas RLS, impidiendo responder
 * desafíos ajenos o ya cerrados.
 */
export async function respondToPlayerChallenge(
  challengeId: string,
  challengedId: string,
  decision: "accepted" | "rejected",
): Promise<PlayerChallenge> {
  if (useAuthStore.getState().isDemoMode) {
    const challenges = getDemoChallenges();
    const challenge = challenges.find(
      (item) =>
        item.id === challengeId && item.challenged_id === challengedId && item.status === "pending",
    );
    if (!challenge) throw new Error("El desafío ya no está disponible.");

    const updated = { ...challenge, status: decision, updated_at: new Date().toISOString() };
    saveDemoChallenges(challenges.map((item) => (item.id === challengeId ? updated : item)));
    return updated;
  }

  const { data, error } = await supabase
    .from("player_challenges")
    .update({ status: decision })
    .eq("id", challengeId)
    .eq("challenged_id", challengedId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error) throw error;
  return data as PlayerChallenge;
}

/**
 * Permite al receptor proponer otra fecha, hora o lugar sin aceptar todavía.
 * En Supabase se usa una función controlada para evitar modificar desafíos ajenos.
 */
export async function proposeChallengeChanges(
  input: CounterProposalInput,
): Promise<PlayerChallenge> {
  if (useAuthStore.getState().isDemoMode) {
    const challenges = getDemoChallenges();
    const challenge = challenges.find(
      (item) =>
        item.id === input.challengeId &&
        item.challenged_id === input.challengedId &&
        item.status === "pending",
    );
    if (!challenge) throw new Error("El desafío ya no está disponible.");

    const updated: PlayerChallenge = {
      ...challenge,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
      location: input.location?.trim() || null,
      status: "counter_proposed",
      updated_at: new Date().toISOString(),
    };
    saveDemoChallenges(challenges.map((item) => (item.id === input.challengeId ? updated : item)));
    return updated;
  }

  const { data, error } = await supabase.rpc("propose_challenge_changes", {
    target_challenge_id: input.challengeId,
    proposed_date: input.scheduledDate,
    proposed_time: input.scheduledTime,
    proposed_location: input.location?.trim() || null,
  });

  if (error) throw error;
  return data as PlayerChallenge;
}

/**
 * El creador original decide sobre la contrapropuesta recibida.
 */
export async function respondToChallengeCounterProposal(
  challengeId: string,
  challengerId: string,
  decision: "accepted" | "rejected",
): Promise<PlayerChallenge> {
  if (useAuthStore.getState().isDemoMode) {
    const challenges = getDemoChallenges();
    const challenge = challenges.find(
      (item) =>
        item.id === challengeId &&
        item.challenger_id === challengerId &&
        item.status === "counter_proposed",
    );
    if (!challenge) throw new Error("La contrapropuesta ya no está disponible.");

    const updated: PlayerChallenge = {
      ...challenge,
      status: decision,
      updated_at: new Date().toISOString(),
    };
    saveDemoChallenges(challenges.map((item) => (item.id === challengeId ? updated : item)));
    return updated;
  }

  const { data, error } = await supabase.rpc("respond_to_challenge_counter_proposal", {
    target_challenge_id: challengeId,
    decision,
  });

  if (error) throw error;
  return data as PlayerChallenge;
}
