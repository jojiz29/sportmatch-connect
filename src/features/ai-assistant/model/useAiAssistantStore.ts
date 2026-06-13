// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { sendMessageToAI, AiChatResponse } from "../api/sportyAiAPI";

// === BLOQUE: TIPOS DEL DOMINIO ===

/**
 * Mensaje estándar LLM en el flujo de conversación.
 * role: 'user' (humano) | 'assistant' (Sporty)
 */
export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** ISO 8601 — momento en que se generó el mensaje */
  timestamp: string;
  /** Sugerencias contextuales que la IA adjunta (chips clicables) */
  suggestions?: string[];
}

// === BLOQUE: INTERFAZ DEL ESTADO ===

interface AiAssistantState {
  /** Historial completo de la conversación (incluye mensaje de bienvenida) */
  messages: AiMessage[];
  /** Indicador de "escribiendo..." para la UI */
  isTyping: boolean;
  /** Estado de visibilidad del panel de chat */
  isOpen: boolean;
  /** Último error de la API (si lo hubo) */
  error: string | null;

  // --- Acciones ---
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  dismissError: () => void;
}

// === BLOQUE: MENSAJE DE BIENVENIDA ===
// Quemado en el store para garantizar render inmediato sin latencia de red.
const WELCOME_MESSAGE: AiMessage = {
  id: "welcome",
  role: "assistant",
  text: "¡Hola! Soy Sporty, tu asistente deportivo ⚡\n\nHe visto que hay canchas cerca de ti. ¿Te ayudo a encontrar un partido o reservar una cancha?",
  timestamp: new Date().toISOString(),
  suggestions: ["Buscar canchas cerca", "Recomiéndame un partido", "Ver mi racha"],
};

// === BLOQUE: STORE ZUSTAND ===
// Administra el estado del chat: mensajes, typing, visibilidad.
// NO usa persist (consistente con useChatStore: sesión efímera).
export const useAiAssistantStore = create<AiAssistantState>((set) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,
  isOpen: false,
  error: null,

  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),

  // --- Acción principal: envía mensaje del usuario y gestiona ciclo IA ---
  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: AiMessage = {
      id: crypto.randomUUID(),
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
      const response: AiChatResponse = await sendMessageToAI(trimmed);
      const aiMsg: AiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: response.reply,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions,
      };
      set((s) => ({ messages: [...s.messages, aiMsg], isTyping: false }));
    } catch (err) {
      // Red de seguridad: sendMessageToAI no debería lanzar (siempre retorna fallback),
      // pero si lo hace (p.ej. al conectar el backend real), capturamos aquí.
      set({
        isTyping: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },

  clearMessages: () => set({ messages: [WELCOME_MESSAGE], error: null }),
  dismissError: () => set({ error: null }),
}));
