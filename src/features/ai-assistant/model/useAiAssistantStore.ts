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

  // --- Acciones ---
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  dismissError: () => void;
}

// === BLOQUE: STORE ZUSTAND ===
// Administra el estado del chat: mensajes, typing, visibilidad.
// NO usa persist (consistente con useChatStore: sesión efímera).
// NO contiene un WELCOME_MESSAGE quemado: el chat inicia vacío para
// poder verificar de forma transparente que la primera respuesta viene
// realmente del backend (Vertex AI) y no de un catálogo local.
export const useAiAssistantStore = create<AiAssistantState>((set) => ({
  messages: [],
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
      // Muestra el error como una burbuja visible para que el usuario
      // sepa exactamente qué falló (red, 401, 429, 5xx, etc.).
      const errorText = err instanceof Error ? err.message : "Error desconocido";
      const errorMsg: AiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `⚠️ ${errorText}`,
        timestamp: new Date().toISOString(),
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
}));
