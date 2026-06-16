// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import {
  sendMessageToAI,
  fetchWelcomeMessage,
  AiChatResponse,
  ChatMessage,
} from "../api/sportyAiAPI";
import i18n from "@/shared/i18n";

// === BLOQUE: TIPOS DEL DOMINIO ===

/**
 * Mensaje estándar LLM en el flujo de conversación.
 * role: 'user' (humano) | 'assistant' (Sporty) | 'system' (info/error)
 */
export interface AiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  /** ISO 8601 — momento en que se generó el mensaje */
  timestamp: string;
  /** Sugerencias contextuales que la IA adjunta (chips clicables) */
  suggestions?: string[];
  /** Tipo de mensaje del sistema (sólo para role="system") */
  variant?: "error" | "info";
}

// === BLOQUE: INTERFAZ DEL ESTADO ===

export type SupportedLanguage = "es" | "en" | "pt";

interface AiAssistantState {
  /** Historial completo de la conversación. Vacío al inicio: la primera
   *  interacción la genera el propio usuario. Esto permite validar
   *  la conexión real con Vertex AI sin respuestas pre-fabricadas. */
  messages: AiMessage[];
  /** Indicador de "escribiendo..." para la UI */
  isTyping: boolean;
  /** Estado de visibilidad del panel de chat */
  isOpen: boolean;
  /** Último error de la API (si lo hubo) */
  error: string | null;
  /** Idioma activo del chat. Por defecto "en" (inglés).
   *  Se puede override con VITE_CHAT_DEFAULT_LANG o setLanguage(). */
  language: SupportedLanguage;
  /** Flag interno: previene múltiples loadWelcome simultáneos (race condition) */
  welcomeLoading: boolean;

  // --- Acciones ---
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  loadWelcome: () => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => void;
  clearMessages: () => void;
  dismissError: () => void;
}

// === BLOQUE: UTILIDADES ===
function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let fallback = "";
  const time = Date.now();
  for (let i = 0; i < 9; i++) {
    fallback += chars[(time + i) % chars.length];
  }
  return `id-${Date.now()}-${fallback}`;
}

// === BLOQUE: RESOLUCIÓN DE IDIOMA POR DEFECTO ===
// Prioridad:
//   1. VITE_CHAT_DEFAULT_LANG (override de build para presentaciones)
//   2. Idioma del i18n del navegador (es-MX, en-US, etc.) → mapea a es/en/pt
//   3. "en" (por defecto: inglés para showcase internacional)
function resolveDefaultLanguage(): SupportedLanguage {
  const override = import.meta.env.VITE_CHAT_DEFAULT_LANG as string | undefined;
  if (override === "es" || override === "en" || override === "pt") return override;

  const browserLang = i18n.language?.split("-")[0];
  if (browserLang === "es" || browserLang === "en" || browserLang === "pt") {
    return browserLang;
  }
  return "en";
}

// === BLOQUE: STORE ZUSTAND ===
// Administra el estado del chat: mensajes, typing, visibilidad.
// NO usa persist (consistente con useChatStore: sesión efímera).
// NO contiene un WELCOME_MESSAGE quemado: el chat inicia vacío para
// poder verificar de forma transparente que la primera respuesta viene
// realmente del backend (Vertex AI) y no de un catálogo local.
export const useAiAssistantStore = create<AiAssistantState>((set, get) => ({
  messages: [],
  isTyping: false,
  isOpen: false,
  error: null,
  language: resolveDefaultLanguage(),
  welcomeLoading: false,

  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
  setLanguage: (lang) => set({ language: lang }),

  // --- Acción principal: envía mensaje del usuario y gestiona ciclo IA ---
  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: AiMessage = {
      id: generateId(),
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isTyping: true,
      error: null,
    }));

    try {
      // Ventana deslizante: últimos 5 turnos (10 mensajes) para mantener contexto
      // conversacional sin exceder el límite de tokens del LLM.
      const currentMessages = get().messages;
      const history: ChatMessage[] = currentMessages.slice(-10).map((m) => ({
        role: m.role === "system" ? "user" : m.role,
        text: m.text,
      }));

      const response: AiChatResponse = await sendMessageToAI(trimmed, {
        language: get().language,
        history,
      });

      const aiMsg: AiMessage = {
        id: generateId(),
        role: "assistant",
        text: response.reply,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions,
      };
      set((s) => ({ messages: [...s.messages, aiMsg], isTyping: false }));
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Error desconocido";
      const errorMsg: AiMessage = {
        id: generateId(),
        role: "system",
        text: errorText,
        timestamp: new Date().toISOString(),
        variant: "error",
      };
      set((s) => ({
        messages: [...s.messages, errorMsg],
        isTyping: false,
        error: errorText,
      }));
    }
  },

  clearMessages: () => set({ messages: [], error: null }),
  dismissError: () => set({ error: null }),

  // --- Carga el primer mensaje del LLM (Vertex AI) ---
  // Se llama cuando el usuario abre el chat por primera vez.
  // Robusto contra:
  //   - Llamadas paralelas (race condition): usa flag `welcomeLoading`
  //   - Loop de useEffect: si ya hay mensajes o isTyping, no hace nada
  //   - Errores: muestra mensaje de error con variant="error" para la UI
  loadWelcome: async () => {
    const state = get();
    // Si ya hay mensajes O ya se está cargando, no hacer nada.
    // Esto previene el loop infinito que ocurría cuando ChatInterface
    // tenía `loadWelcome` en las dependencias de useEffect (cada
    // cambio de estado creaba una nueva referencia de la función).
    if (state.messages.length > 0 || state.isTyping || state.welcomeLoading) {
      return;
    }

    // Marcar como loading INMEDIATAMENTE antes del await para que
    // cualquier llamada concurrente vea el flag y se salga.
    set({ welcomeLoading: true, isTyping: true, error: null });

    try {
      const response: AiChatResponse = await fetchWelcomeMessage({
        language: get().language,
      });
      const aiMsg: AiMessage = {
        id: generateId(),
        role: "assistant",
        text: response.reply,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions,
      };
      set({ messages: [aiMsg], isTyping: false, welcomeLoading: false });
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Error desconocido";
      const errorMsg: AiMessage = {
        id: generateId(),
        role: "system",
        text: errorText,
        timestamp: new Date().toISOString(),
        variant: "error",
      };
      set({
        messages: [errorMsg],
        isTyping: false,
        welcomeLoading: false,
        error: errorText,
      });
    }
  },
}));
