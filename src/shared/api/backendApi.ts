/**
 * ===================================================================
 * ARCHIVO: src/shared/api/backendApi.ts
 * PROPÓSITO: Cliente HTTP para el backend NestJS.
 *            Proporciona métodos tipados para cada endpoint REST
 *            del servidor (auth, matches, courts, posts, etc.).
 * DIFERENCIA con apiClient.ts: Este llama al backend NestJS
 * (API REST tradicional), mientras apiClient.ts usa Supabase
 * directo (API REST de Supabase + RLS).
 * ===================================================================
 */

import { supabase } from "./supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { toast } from "sonner";

// URL base de la API NestJS + prefijo /api/v1
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/v1";

// ==============================================================
// TIPOS INTERNOS
// ==============================================================

/** Formato de respuesta estándar: data + error */
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ==============================================================
// FUNCIÓN BASE: fetchApi
// ==============================================================
/**
 * fetchApi(): Ejecuta una llamada HTTP genérica al backend NestJS
 * ------------------------------------------------------------------
 * Características:
 *   - SEC-03: Obtiene dinámicamente el access_token de la sesión
 *     actual de Supabase y lo inyecta como Bearer token
 *   - Si el body es FormData, no fuerza Content-Type (lo pone el
 *     navegador automáticamente con el boundary correcto)
 *   - Si el body NO es FormData, fuerza application/json
 *   - Manejo de 401: cierra sesión y redirige al login
 *   - Manejo de errores HTTP: parsea el body de error
 *
 * @param endpoint - Ruta relativa (ej: "/matches")
 * @param options  - Opciones fetch estándar (method, headers, body)
 * @returns ApiResponse con data tipada o mensaje de error
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    // Obtiene token de sesión actual de Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {
      ...options?.headers,
    } as Record<string, string>;

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Si no es FormData, fuerza JSON
    if (!(options?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 401 = sesión expirada -> logout automático
    if (response.status === 401) {
      toast.error("Sesión expirada. Por favor, inicia sesión de nuevo.");
      useAuthStore.getState().logout();
      globalThis.window.location.href = "/login";
      return { error: "Unauthorized" };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      return { error: errorData.message || errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// ==============================================================
// BACKEND API: Exportación principal
// ==============================================================
export const backendApi = {
  // ------------------------------------------------------------
  // AUTH (Autenticación)
  // ------------------------------------------------------------
  auth: {
    async getProfile(token: string) {
      return fetchApi("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    async updateProfile(token: string, data: { name?: string; bio?: string; avatar_url?: string }) {
      return fetchApi("/auth/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },

    async verifyToken(token: string) {
      return fetchApi("/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },

  // ------------------------------------------------------------
  // MATCHES (Partidos)
  // ------------------------------------------------------------
  matches: {
    async getAll(sport?: string) {
      const endpoint = sport ? `/matches?sport=${encodeURIComponent(sport)}` : "/matches";
      return fetchApi(endpoint);
    },

    async getById(id: string) {
      return fetchApi(`/matches/${id}`);
    },

    async create(
      token: string,
      match: {
        title: string;
        sport: string;
        court_id?: string;
        date: string;
        time: string;
        max_players: number;
        required_level: string;
      },
    ) {
      return fetchApi("/matches", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(match),
      });
    },

    async update(
      token: string,
      id: string,
      data: {
        title?: string;
        sport?: string;
        court_id?: string;
        date?: string;
        time?: string;
        max_players?: number;
        required_level?: string;
        status?: string;
      },
    ) {
      return fetchApi(`/matches/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },

    async delete(token: string, id: string) {
      return fetchApi(`/matches/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    async join(token: string, matchId: string) {
      return fetchApi(`/matches/${matchId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    async leave(token: string, matchId: string) {
      return fetchApi(`/matches/${matchId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },

  // ------------------------------------------------------------
  // COURTS (Canchas)
  // ------------------------------------------------------------
  courts: {
    async getAll(sport?: string) {
      const endpoint = sport ? `/courts?sport=${encodeURIComponent(sport)}` : "/courts";
      return fetchApi(endpoint);
    },

    async getById(id: string) {
      return fetchApi(`/courts/${id}`);
    },

    async create(
      token: string,
      court: {
        name: string;
        sport: string;
        price_per_hour: number;
        lat: number;
        lng: number;
        address?: string;
        max_players?: number;
        operating_hours?: string[];
        amenities?: string[];
      },
    ) {
      return fetchApi("/courts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(court),
      });
    },

    async update(
      token: string,
      id: string,
      data: {
        name?: string;
        sport?: string;
        price_per_hour?: number;
        is_available?: boolean;
        amenities?: string[];
      },
    ) {
      return fetchApi(`/courts/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },

    async addReview(token: string, courtId: string, review: { rating: number; comment?: string }) {
      return fetchApi(`/courts/${courtId}/reviews`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(review),
      });
    },
  },

  // ------------------------------------------------------------
  // PROFILES (Perfiles de usuario)
  // ------------------------------------------------------------
  profiles: {
    async getById(id: string) {
      return fetchApi(`/profiles/${id}`);
    },

    async update(
      token: string,
      id: string,
      data: {
        name?: string;
        bio?: string;
        avatar_url?: string;
        city?: string;
        preferred_sports?: string[];
        sport_preferences?: Record<string, unknown>;
      },
    ) {
      return fetchApi(`/profiles/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },

    async getByUserId(userId: string) {
      return fetchApi(`/profiles/user/${userId}`);
    },

    async verifyDni(token: string, dni: string) {
      return fetchApi("/profiles/verify-dni", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dni }),
      });
    },
  },

  // ------------------------------------------------------------
  // POSTS (Publicaciones del feed)
  // ------------------------------------------------------------
  posts: {
    async getAll(sport?: string) {
      const endpoint = sport ? `/posts?sport=${encodeURIComponent(sport)}` : "/posts";
      return fetchApi(endpoint);
    },

    async getById(id: string) {
      return fetchApi(`/posts/${id}`);
    },

    async create(
      token: string,
      post: { content: string; type?: string; sport?: string; media_url?: string },
    ) {
      return fetchApi("/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(post),
      });
    },

    /** createMultipart(): Subida de post con imagen via FormData */
    async createMultipart(token: string, formData: FormData) {
      return fetchApi("/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    },

    async delete(token: string, id: string) {
      return fetchApi(`/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    async addComment(
      token: string,
      postId: string,
      comment: { content: string; parent_id?: string },
    ) {
      return fetchApi(`/posts/${postId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(comment),
      });
    },

    async addReaction(
      token: string,
      postId: string,
      reaction: { comment_id: string; reaction_type: string },
    ) {
      return fetchApi(`/posts/${postId}/reactions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(reaction),
      });
    },
  },

  // ------------------------------------------------------------
  // HEALTH (Estado del servidor)
  // ------------------------------------------------------------
  health: {
    async check() {
      return fetchApi("/health");
    },
  },

  // ------------------------------------------------------------
  // USERS (Usuarios)
  // ------------------------------------------------------------
  users: {
    async getAll(excludeUserId?: string) {
      const endpoint = excludeUserId ? `/users?excludeUserId=${excludeUserId}` : "/users";
      return fetchApi(endpoint);
    },

    async getLeaderboard() {
      return fetchApi("/users/leaderboard");
    },
  },

  // ------------------------------------------------------------
  // WALLET (Billetera FitCoins)
  // ------------------------------------------------------------
  wallet: {
    async getBalance(userId: string) {
      return fetchApi(`/wallet/${userId}/balance`);
    },

    async getTransactions(userId: string) {
      return fetchApi(`/wallet/${userId}/transactions`);
    },

    async createTransaction(
      token: string,
      data: { user_id: string; amount: number; description: string; type: "EARN" | "SPEND" },
    ) {
      return fetchApi("/wallet/transactions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },
  },

  // ------------------------------------------------------------
  // SPORTS (Catálogo de deportes)
  // ------------------------------------------------------------
  sports: {
    async getAll() {
      return fetchApi("/sports");
    },
  },

  // ------------------------------------------------------------
  // MATCHMAKING (V2.3 — Queue, Swipes, Elo)
  // ------------------------------------------------------------
  matchmaking: {
    async enterQueue(sport: string, lat: number, lng: number, radiusKm?: number) {
      return fetchApi("/matchmaking/queue/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport, lat, lng, radius_km: radiusKm ?? 10 }),
      });
    },

    async leaveQueue(sport: string) {
      return fetchApi(`/matchmaking/queue/leave/${encodeURIComponent(sport)}`, {
        method: "DELETE",
      });
    },

    async getQueueStatus(sport: string) {
      return fetchApi(`/matchmaking/queue/status/${encodeURIComponent(sport)}`);
    },

    async findMatch(sport: string) {
      return fetchApi(`/matchmaking/queue/find/${encodeURIComponent(sport)}`, {
        method: "POST",
      });
    },

    async swipe(targetId: string, action: "LIKE" | "PASS", sport: string) {
      return fetchApi<{ mutual_like: boolean; conversation_id?: string }>("/matchmaking/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: targetId, action, sport }),
      });
    },

    async reportResult(matchId: string, winnerId: string, scoreHome?: number, scoreAway?: number) {
      return fetchApi("/matchmaking/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          winner_id: winnerId,
          score_home: scoreHome,
          score_away: scoreAway,
        }),
      });
    },

    async getElo(sport: string) {
      return fetchApi(`/matchmaking/elo/${encodeURIComponent(sport)}`);
    },

    async getAllElo() {
      return fetchApi("/matchmaking/elo");
    },
  },

  // ------------------------------------------------------------
  // BOOKINGS (Reservas)
  // ------------------------------------------------------------
  bookings: {
    async getByCourtAndDate(courtId: string, date: string) {
      return fetchApi(`/bookings?courtId=${courtId}&date=${date}`);
    },

    async create(
      token: string,
      data: {
        court_id: string;
        date: string;
        time: string;
        user_id: string;
        precio_cancha?: number;
        porcentaje_comision?: number;
        monto_comision?: number;
        total_cobrado?: number;
      },
    ) {
      return fetchApi("/bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },
  },

  // ------------------------------------------------------------
  // PAYMENTS & SUBSCRIPTIONS
  // ------------------------------------------------------------
  payments: {
    async checkout(token: string, successUrl: string, cancelUrl: string) {
      return fetchApi<{ url: string; mock?: boolean }>("/payments/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ successUrl, cancelUrl }),
      });
    },

    async portal(token: string, returnUrl: string) {
      return fetchApi<{ url: string; mock?: boolean }>("/payments/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnUrl }),
      });
    },

    async mockUpgrade(token: string) {
      return fetchApi<{ success: boolean; message: string }>("/payments/mock-upgrade", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    async mockDowngrade(token: string) {
      return fetchApi<{ success: boolean; message: string }>("/payments/mock-downgrade", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },

  // ------------------------------------------------------------
  // AI (Inteligencia Artificial & Seguridad)
  // ------------------------------------------------------------
  ai: {
    async moderateAdvanced(
      token: string,
      data: {
        userId: string;
        content: string;
        contextType: "mensaje" | "comentario" | "perfil";
        metadata?: Record<string, unknown>;
      },
    ) {
      return fetchApi<{
        ensemble_score: number;
        signals: { name: string; score: number; description?: string }[];
        action_recommended: "allow" | "warn" | "block";
        reasoning: string;
      }>("/ai/moderate/advanced", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },

    async coachChat(
      token: string,
      data: {
        message: string;
        history?: { role: "user" | "assistant"; text: string }[];
        language?: string;
      },
    ) {
      return fetchApi<{
        reply: string;
        suggestions: string[];
        messagesRemaining: number;
        metadata: { tokens: number; model: string; latencyMs: number };
      }>("/ai/coach/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },

    async recommendSnack(
      token: string,
      data: {
        sport: string;
        duration: number;
        intensity: string;
        matchId?: string;
        language?: string;
      },
    ) {
      return fetchApi<{
        snack_name: string;
        calories: number;
        ingredients: string[];
        reasoning: string;
        calories_burned: number;
        snack_image?: string;
      }>("/ai/premium/nutrition", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },
  },
};

export default backendApi;
