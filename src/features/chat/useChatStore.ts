/* eslint-disable @typescript-eslint/no-explicit-any */
// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { MOCK_USERS } from "@/shared/api/apiClient";
import { Match } from "@/entities/types";
import { withTimeout } from "@/shared/api/timeoutHelper";
import { cryptoSecureRandomString } from "@/shared/lib/crypto";

// === BLOQUE: MENSAJE DE CHAT ===
export interface ChatMessage {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  media_url?: string;
  metadata?: Record<string, unknown>;
}

// === BLOQUE: CONVERSACIÓN ===
export interface Chat {
  id: string;
  name: string;
  avatar: string;
  current_players: string[];
  messages: ChatMessage[];
  unread: number;
}

// === BLOQUE: INTERFAZ DEL ESTADO ===
interface ChatState {
  chats: Chat[];
  activeConversationId: string | null;
  typingUsers: Record<string, boolean>;
  lastDiagnostic: string;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (
    chatId: string,
    text: string,
    mediaUrl?: string,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;
  createChat: (userId: string) => Promise<string>;
  createGroupChat: (name: string, targetUserIds: string[]) => Promise<string>;
  createMatchGroupChat: (match: Match) => void;
  initChat: () => void;
  loadPersistentChats: () => Promise<void>;
  loadChatHistory: (chatId: string) => Promise<void>;
  sendTypingStatus: (isTyping: boolean) => void;
  markMessagesAsSeen: (chatId: string) => Promise<void>;
  subscribeToAllChats: () => () => void;

  /**
   * Activates a Supabase Realtime subscription for the given chatId.
   * Cleans up the previous channel first to avoid duplicate listeners.
   * Returns the unsubscribe function (also stored internally).
   */
  subscribeToChat: (chatId: string) => () => void;
}

// === BLOQUE: CANALES REALTIME GLOBALES ===
// Variables a nivel de módulo que sobreviven a re-renders de Zustand.
// Se limpian cuando subscribeToChat se llama de nuevo o al desmontar el componente.
let _activeChatChannel: ReturnType<typeof supabase.channel> | null = null;
let _subscribedChatId: string | null = null;
let _globalChatChannel: ReturnType<typeof supabase.channel> | null = null;

// === BLOQUE: LOG DE CHAT ===
// Incluye identificadores y etapas del ciclo de vida del mensaje,
// nunca el contenido privado del mensaje.
function chatLog(event: string, context: Record<string, unknown> = {}) {
  console.log(`[chat] ${event}`, context);
}

// === HELPERS DE MAPEO PARA EVITAR COGNITIVE COMPLEXITY Y ANIDAMIENTO DE NIVELES ===

const updateIsRead = (newMessageId: string) => (m: any) =>
  m.id === newMessageId ? { ...m, isRead: true } : m;

const markAsReadMap = (chatId: string, newMessageId: string) => (chat: any) => {
  if (chat.id !== chatId) return chat;
  return {
    ...chat,
    messages: chat.messages.map(updateIsRead(newMessageId)),
  };
};

const updateSeenInChat = (userId: string) => (m: any) =>
  m.sender_id === userId ? m : { ...m, metadata: { ...m.metadata, seen: true } };

const markAsSeenLocalMap = (chatId: string, userId: string) => (c: any) => {
  if (c.id !== chatId) return c;
  return {
    ...c,
    messages: c.messages.map(updateSeenInChat(userId)),
  };
};

const appendBroadcastMessage = (row: any) => (chat: any) => {
  const matchesChat = chat.id === row.chat_id;
  const hasMessage = chat.messages.some((message: any) => message.id === row.id);
  if (matchesChat && !hasMessage) {
    return { ...chat, messages: [...chat.messages, row] };
  }
  return chat;
};

const mapChatForInsert =
  (row: any, incomingMessage: any, currentUser: any, activeConversationId: any) => (chat: any) => {
    const hasMessage = chat.messages.some((m: any) => m.id === row.id);
    if (chat.id !== row.chat_id || hasMessage) {
      return chat;
    }
    const isUnread = row.sender_id !== currentUser?.id && activeConversationId !== row.chat_id;
    return {
      ...chat,
      messages: [...chat.messages, incomingMessage],
      unread: isUnread ? chat.unread + 1 : chat.unread,
    };
  };

const updateMessageInChat = (row: any) => (message: any) =>
  message.id === row.id ? { ...message, ...row } : message;

const mapChatForUpdate = (row: any) => (chat: any) => {
  if (chat.id !== row.chat_id) return chat;
  return {
    ...chat,
    messages: chat.messages.map(updateMessageInChat(row)),
  };
};

const filterMessagesById = (chatId: string, messageId: string) => (chat: any) => {
  if (chat.id !== chatId) return chat;
  return {
    ...chat,
    messages: chat.messages.filter((message: any) => message.id !== messageId),
  };
};

const mapMessagesWithConfirmed =
  (chatId: string, messageId: string, confirmedMessage: any) => (chat: any) => {
    if (chat.id !== chatId) return chat;
    return {
      ...chat,
      messages: chat.messages.map((message: any) =>
        message.id === messageId ? confirmedMessage : message,
      ),
    };
  };

const markAsSeenRealMap = (chatId: string, userId: string) => (chat: any) => {
  if (chat.id !== chatId) return chat;
  return {
    ...chat,
    unread: 0,
    messages: chat.messages.map((message: any) => {
      if (message.sender_id === userId) return message;
      return { ...message, metadata: { ...message.metadata, seen: true } };
    }),
  };
};

const updateTypingUsers = (userId: string, isTyping: boolean) => (state: any) => {
  const updated = { ...state.typingUsers };
  if (isTyping) {
    updated[userId] = true;
  } else {
    delete updated[userId];
  }
  return { typingUsers: updated };
};

const appendOptimisticMessage = (chatId: string, newMessage: ChatMessage) => (state: any) => {
  const updatedChats = state.chats.map((chat: any) => {
    if (chat.id === chatId) {
      return { ...chat, messages: [...chat.messages, newMessage] };
    }
    return chat;
  });
  return { chats: updatedChats };
};

// === BLOQUE: STORE DE CHAT ===
// Gestiona mensajería instantánea con soporte para:
// - Chats directos (1-a-1) con IDs persistentes vía RPC
// - Chats grupales por escuadra
// - Chats de partido (match)
// - Realtime con Supabase para mensajes y typing indicators
// - Actualizaciones optimistas con rollback en caso de error
// Persistido parcialmente en localStorage (chats + activeConversationId).
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeConversationId: null,
      typingUsers: {},
      lastDiagnostic: "Chat todavía no inicializado.",

      // === CAMBIAR CONVERSACIÓN ACTIVA ===
      // Al cambiar de conversación, resetea el estado de "escribiendo" y
      // marca los mensajes como leídos.
      setActiveConversation: (id) => {
        set({
          activeConversationId: id,
          typingUsers: {},
          lastDiagnostic: id ? `Conversación activa: ${id}` : "Sin conversación activa.",
        });
        if (id) {
          get().markMessagesAsSeen(id);
        }
      },

      // === INICIALIZAR CHAT ===
      // En modo demo, crea chats semilla precargados.
      // En modo real, carga las conversaciones persistentes desde Supabase.
      initChat: () => {
        const user = useAuthStore.getState().user;
        if (user) {
          const isDemo =
            useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";
          if (isDemo && get().chats.length === 0) {
            const seedChats: Chat[] = [
              {
                id: "chat-fabiola",
                name: "Fabiola",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fabiola",
                current_players: [user.id, "user-fabiola"],
                messages: [
                  {
                    id: "m1",
                    sender_id: "user-fabiola",
                    text: "Hola! ¿Confirmamos el partido para mañana?",
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                  },
                ],
                unread: 1,
              },
              {
                id: "chat-pichanga",
                name: "Pichanga Jueves",
                avatar: "⚽",
                current_players: [user.id, "user-1", "user-2"],
                messages: [
                  {
                    id: "m2",
                    sender_id: "system",
                    text: "Grupo creado para Pichanga Jueves. ¡Buena suerte!",
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                  },
                ],
                unread: 0,
              },
            ];
            set({ chats: seedChats });
          }

          const userChats = get().chats.filter((c) => c.current_players.includes(user.id));
          const currentActive = get().activeConversationId;
          if (!currentActive || !userChats.some((c) => c.id === currentActive)) {
            set({ activeConversationId: userChats[0]?.id || null });
          }
          if (!isDemo) {
            void get().loadPersistentChats();
          }
        } else {
          set({ activeConversationId: null });
        }
      },

      // === ENVIAR MENSAJE ===
      // Actualización optimista: agrega el mensaje al estado local de inmediato,
      // luego persiste en Supabase. Si falla, revierte (rollback).
      // En modo real, también hace broadcast vía Realtime para entrega inmediata.
      sendMessage: async (chatId, text, mediaUrl, metadata) => {
        const normalizedText = text.trim();
        // Esta validación protege todos los puntos de entrada, no solo el formulario del chat.
        if (!chatId || (!normalizedText && !mediaUrl)) return;

        const user = useAuthStore.getState().user;
        const sender_id = user ? user.id : "unknown";
        const newMessageId = `msg_${Date.now()}_${cryptoSecureRandomString(5)}`;
        const isDemo =
          useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";
        const sendingMetadata = { ...metadata, delivery_status: "sending" };
        const sentMetadata = { ...metadata, delivery_status: "sent" };

        // Crea el mensaje con estado "sending"
        const newMessage: ChatMessage = {
          id: newMessageId,
          sender_id,
          text: normalizedText,
          created_at: new Date().toISOString(),
          media_url: mediaUrl,
          metadata: sendingMetadata,
        };
        chatLog("send:start", { chatId, messageId: newMessageId, hasMedia: Boolean(mediaUrl) });
        set({ lastDiagnostic: `Enviando mensaje en ${chatId}...` });

        // Inserta el mensaje en el estado local (optimista)
        set(appendOptimisticMessage(chatId, newMessage));

        if (isDemo) {
          // Modo demo: simula que el destino lee el mensaje después de 2 segundos
          setTimeout(() => {
            set((state) => ({
              chats: state.chats.map(markAsReadMap(chatId, newMessageId)),
            }));
          }, 2000);
        } else {
          // Persiste en Supabase: usa RPC para directos o INSERT directo para grupales
          const sendResult = await withTimeout(
            chatId.startsWith("direct_")
              ? supabase.rpc("send_direct_message", {
                  target_conversation_id: chatId,
                  client_message_id: newMessageId,
                  message_text: normalizedText,
                  message_media_url: mediaUrl || null,
                  message_metadata: sentMetadata,
                })
              : supabase.from("messages").insert({
                  id: newMessageId,
                  chat_id: chatId,
                  sender_id,
                  text: normalizedText,
                  media_url: mediaUrl || null,
                  metadata: sentMetadata,
                }),
          );
          let { error } = sendResult;

          // Fallback: si el RPC no existe (PGRST202), intenta inserción directa
          if (error && chatId.startsWith("direct_") && error.code === "PGRST202") {
            console.warn("[chat] send:rpc-missing, intentando inserción directa", { chatId });
            const fallback = await supabase.from("messages").insert({
              id: newMessageId,
              chat_id: chatId,
              sender_id,
              text: normalizedText,
              media_url: mediaUrl || null,
              metadata: sentMetadata,
            });
            error = fallback.error;
          }

          if (error) {
            set((state) => ({
              chats: state.chats.map(filterMessagesById(chatId, newMessageId)),
              lastDiagnostic: `Error enviando en ${chatId}: ${error.message}`,
            }));
            console.error("[chat] send:error", { chatId, messageId: newMessageId, error });
            throw error;
          }

          chatLog("send:confirmed", { chatId, messageId: newMessageId });
          const confirmedMessage = { ...newMessage, metadata: sentMetadata };

          set((state) => ({
            chats: state.chats.map(
              mapMessagesWithConfirmed(chatId, newMessageId, confirmedMessage),
            ),
            lastDiagnostic: `Mensaje confirmado en ${chatId}.`,
          }));

          // Broadcast: entrega el mensaje inmediatamente al chat abierto del receptor.
          // PostgreSQL Realtime es la fuente persistente y evita pérdidas.
          if (_subscribedChatId === chatId && _activeChatChannel) {
            await _activeChatChannel.send({
              type: "broadcast",
              event: "new-message",
              payload: { ...confirmedMessage, chat_id: chatId },
            });
          }
        }
      },

      // === CREAR CHAT DIRECTO ===
      // Crea o reutiliza una conversación directa 1-a-1.
      // En modo real usa el RPC create_direct_conversation que devuelve
      // siempre el mismo ID para una pareja de usuarios.
      createChat: async (targetUserId) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return "";
        const isDemo = useAuthStore.getState().isDemoMode;

        // Reutiliza conversación existente (directa y con los mismos 2 participantes)
        const existingChat = get().chats.find(
          (c) =>
            c.current_players.length === 2 &&
            c.current_players.includes(currentUser.id) &&
            c.current_players.includes(targetUserId) &&
            (isDemo || c.id.startsWith("direct_")),
        );

        if (existingChat) {
          chatLog("conversation:reuse", { chatId: existingChat.id, targetUserId });
          set({
            activeConversationId: existingChat.id,
            lastDiagnostic: `Conversación persistente reutilizada: ${existingChat.id}`,
          });
          return existingChat.id;
        }

        // Obtiene el perfil del usuario destino
        let name = "Deportista";
        let avatar = "";
        let chatId = `chat_${Date.now()}`;
        if (isDemo) {
          const targetUser = MOCK_USERS.find((u) => u.id === targetUserId);
          if (targetUser) {
            name = targetUser.name;
            avatar = targetUser.avatar_url || "";
          }
        } else {
          try {
            // Supabase devuelve siempre el mismo ID para una pareja con match mutuo.
            const { data: persistentChatId, error: conversationError } = await supabase.rpc(
              "create_direct_conversation",
              { other_user_id: targetUserId },
            );
            if (conversationError) throw conversationError;
            chatId = persistentChatId as string;
            chatLog("conversation:created", { chatId, targetUserId });

            const { data } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", targetUserId)
              .single();
            if (data) {
              name = data.name;
              avatar = data.avatar_url || "";
            }
          } catch (e) {
            console.error("[chat] conversation:error", { targetUserId, error: e });
            // FIX 15-jun-2026: Si el RPC falla porque el usuario destino
            // no tenía conexión previa, propagamos el error para que
            // la UI lo muestre. Antes el catch silenciaba los errores y el
            // chat no abría, dejando al usuario sin feedback.
            throw e;
          }
        }

        const newChat: Chat = {
          id: chatId,
          name,
          avatar,
          current_players: [currentUser.id, targetUserId],
          messages: [],
          unread: 0,
        };

        set((state) => ({
          chats: [...state.chats, newChat],
          activeConversationId: newChat.id,
          lastDiagnostic: `Conversación persistente creada: ${newChat.id}`,
        }));

        return newChat.id;
      },

      // === CARGAR CONVERSACIONES PERSISTENTES ===
      // Obtiene todas las conversaciones del usuario desde Supabase,
      // incluyendo los datos del perfil del otro participante y los mensajes.
      loadPersistentChats: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || useAuthStore.getState().isDemoMode) return;

        try {
          // Obtiene los IDs de conversación del usuario actual
          const { data: ownRows, error: ownError } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", currentUser.id);
          if (ownError) throw ownError;

          const conversationIds = (ownRows || []).map((row) => row.conversation_id);
          chatLog("conversations:loaded", { count: conversationIds.length });
          if (conversationIds.length === 0) {
            set({
              chats: [],
              activeConversationId: null,
              lastDiagnostic: "Supabase no devolvió conversaciones persistentes para este usuario.",
            });
            return;
          }

          // Obtiene los datos del otro participante de cada conversación
          const { data: participantRows, error: participantsError } = await supabase
            .from("conversation_participants")
            .select(
              "conversation_id, user_id, profile:profiles!conversation_participants_user_id_fkey(name, avatar_url)",
            )
            .in("conversation_id", conversationIds)
            .neq("user_id", currentUser.id);
          if (participantsError) throw participantsError;

          const persistentChats: Chat[] = (participantRows || []).map((row) => {
            const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
            return {
              id: row.conversation_id,
              name: profile?.name || "Deportista",
              avatar: profile?.avatar_url || "",
              current_players: [currentUser.id, row.user_id],
              messages: [],
              unread: 0,
            };
          });

          // Obtiene todos los mensajes de todas las conversaciones
          const { data: messageRows, error: messagesError } = await supabase
            .from("messages")
            .select("*")
            .in("chat_id", conversationIds)
            .order("created_at", { ascending: true });
          if (messagesError) throw messagesError;

          // Carga todos los historiales al entrar para que la lista se comporte
          // como una bandeja de mensajería sin depender de abrir cada conversación.
          for (const chat of persistentChats) {
            chat.messages = (messageRows || [])
              .filter((row) => row.chat_id === chat.id)
              .map((row) => ({
                id: row.id,
                sender_id: row.sender_id,
                text: row.text,
                created_at: row.created_at,
                media_url: row.media_url || undefined,
                metadata: row.metadata || undefined,
              }));
          }

          set((state) => {
            const persistentIds = new Set(persistentChats.map((persistent) => persistent.id));
            const compatibleLocalChats = state.chats.filter(
              (chat) =>
                (chat.id.startsWith("chat_squad_") || chat.id.startsWith("chat_match_")) &&
                !persistentIds.has(chat.id),
            );
            const nextChats = [...persistentChats, ...compatibleLocalChats];
            const activeStillExists = nextChats.some(
              (chat) => chat.id === state.activeConversationId,
            );
            return {
              chats: nextChats,
              activeConversationId: activeStillExists
                ? state.activeConversationId
                : persistentChats[0]?.id || null,
              lastDiagnostic: `${persistentChats.length} conversación(es) persistente(s) cargada(s).`,
            };
          });
        } catch (error) {
          console.error("[chat] conversations:error", { error });
          set({
            lastDiagnostic: `Error cargando conversaciones: ${
              error instanceof Error ? error.message : "respuesta desconocida"
            }`,
          });
        }
      },

      // === CREAR CHAT GRUPAL ===
      // Crea un chat grupal para una escuadra (squad).
      createGroupChat: async (name, targetUserIds) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return "";

        const newChat: Chat = {
          id: `chat_squad_${Date.now()}`,
          name,
          avatar: "👥",
          current_players: [currentUser.id, ...targetUserIds],
          messages: [
            {
              id: `msg_system_${Date.now()}`,
              sender_id: "system",
              text: `Squad "${name}" creado por ${currentUser.name}. ¡Comiencen a chatear!`,
              created_at: new Date().toISOString(),
            },
          ],
          unread: 0,
        };

        set((state) => ({
          chats: [...state.chats, newChat],
          activeConversationId: newChat.id,
        }));

        return newChat.id;
      },

      // === CREAR CHAT DE PARTIDO ===
      // Crea un chat grupal vinculado a un partido específico.
      // Solo se crea si el usuario actual es participante o creador.
      createMatchGroupChat: (match) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const participantIds = match.current_players?.map((p) => p.id) || [];
        if (!participantIds.includes(match.creator_id)) {
          participantIds.push(match.creator_id);
        }

        if (!participantIds.includes(currentUser.id)) return;

        const chatId = `chat_match_${match.id}`;
        const existing = get().chats.some((c) => c.id === chatId);
        if (existing) return;

        const getSportEmoji = (sport: string): string => {
          if (sport === "Fútbol") return "⚽";
          if (sport === "Tenis") return "🎾";
          if (sport === "Pádel") return "🏓";
          return "🏆";
        };
        const sportEmoji = getSportEmoji(match.sport);

        const newChat: Chat = {
          id: chatId,
          name: `Partido: ${match.title}`,
          avatar: sportEmoji,
          current_players: participantIds,
          messages: [
            {
              id: `msg_system_${Date.now()}`,
              sender_id: "system",
              text: `Grupo creado para coordinar el partido "${match.title}". ¡Buena suerte!`,
              created_at: new Date().toISOString(),
            },
          ],
          unread: 0,
        };

        set((state) => ({
          chats: [...state.chats, newChat],
        }));
      },

      // === CARGAR HISTORIAL DE MENSAJES ===
      // Obtiene todos los mensajes de una conversación desde Supabase.
      loadChatHistory: async (chatId) => {
        const isDemo =
          useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";
        if (isDemo) return;

        try {
          const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true });

          if (error) throw error;
          chatLog("history:loaded", { chatId, count: data?.length || 0 });

          if (data) {
            const mappedMessages: ChatMessage[] = data.map(
              (row: {
                id: string;
                sender_id: string;
                text: string;
                created_at: string;
                media_url: string | null;
                metadata: Record<string, unknown> | null;
              }) => ({
                id: row.id,
                sender_id: row.sender_id,
                text: row.text,
                created_at: row.created_at,
                media_url: row.media_url || undefined,
                metadata: row.metadata || undefined,
              }),
            );

            set((state) => ({
              chats: state.chats.map((c) =>
                c.id === chatId ? { ...c, messages: mappedMessages } : c,
              ),
            }));
          }
        } catch (e) {
          console.error("[chat] history:error", { chatId, error: e });
        }
      },

      // === INDICADOR "ESCRIBIENDO" ===
      // Envía vía broadcast Realtime el estado de escritura del usuario actual.
      sendTypingStatus: (isTyping) => {
        const user = useAuthStore.getState().user;
        if (!user || !_activeChatChannel) return;

        _activeChatChannel.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: user.id, isTyping },
        });
      },

      // === MARCAR MENSAJES COMO LEÍDOS ===
      // Marca como vistos todos los mensajes de otros usuarios en una conversación.
      // En modo demo, actualización local.
      // En modo real, persiste en Supabase y actualiza el estado local.
      markMessagesAsSeen: async (chatId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const isDemo =
          useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";

        if (isDemo) {
          set((state) => ({
            chats: state.chats.map(markAsSeenLocalMap(chatId, user.id)),
          }));
          return;
        }

        try {
          // Selecciona mensajes no vistos de otros usuarios
          const { data, error } = await supabase
            .from("messages")
            .select("id, metadata")
            .eq("chat_id", chatId)
            .neq("sender_id", user.id);

          if (error) throw error;

          if (data && data.length > 0) {
            const updates = data
              .filter((m) => !m.metadata?.seen)
              .map((m) => {
                const newMetadata = { ...m.metadata, seen: true };
                return supabase.from("messages").update({ metadata: newMetadata }).eq("id", m.id);
              });

            await Promise.all(updates);
          }

          // Refleja la lectura de inmediato.
          // El evento UPDATE de Realtime actualizará los dobles checks en la sesión del remitente.
          set((state) => ({
            chats: state.chats.map(markAsSeenRealMap(chatId, user.id)),
          }));
        } catch (e) {
          console.warn("Failed to mark messages as seen:", e);
        }
      },

      // === SUSCRIBIRSE A UN CANAL DE CHAT ===
      // Activa un canal Realtime para una conversación específica.
      // Escucha broadcasts "new-message" y "typing".
      // Limpia la suscripción anterior antes de crear una nueva.
      subscribeToChat: (chatId) => {
        if (useAuthStore.getState().isDemoMode) {
          return () => {};
        }

        // Carga el historial existente y marca como leído
        get().loadChatHistory(chatId);
        get().markMessagesAsSeen(chatId);

        // Si ya está suscrito al mismo chat, solo devuelve cleanup
        if (_subscribedChatId === chatId && _activeChatChannel) {
          return () => {
            if (_activeChatChannel) {
              supabase.removeChannel(_activeChatChannel);
              _activeChatChannel = null;
              _subscribedChatId = null;
            }
          };
        }

        // Limpia suscripción anterior a otro chat
        if (_activeChatChannel) {
          supabase.removeChannel(_activeChatChannel);
          _activeChatChannel = null;
          _subscribedChatId = null;
        }

        // La conversación activa tiene un canal separado para eventos efímeros
        // como el indicador "escribiendo" y entrega inmediata de mensajes.
        const channel = supabase
          .channel(`chat-messages-${chatId}`)
          .on("broadcast", { event: "new-message" }, ({ payload }) => {
            const row = payload as ChatMessage & { chat_id: string };
            if (row.sender_id === useAuthStore.getState().user?.id) return;

            set((state) => ({
              chats: state.chats.map(appendBroadcastMessage(row)),
            }));
          })
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            const { userId, isTyping } = payload;
            set(updateTypingUsers(userId, isTyping));
          })
          .subscribe((status, error) => {
            if (status === "SUBSCRIBED") {
              chatLog("realtime:subscribed", { chatId });
              set({ lastDiagnostic: `Realtime conectado a ${chatId}.` });
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              console.error("[chat] realtime:error", { chatId, status, error });
              set({ lastDiagnostic: `Realtime ${status.toLowerCase()} en ${chatId}.` });
            }
          });

        _activeChatChannel = channel;
        _subscribedChatId = chatId;

        // Devuelve función de limpieza para usar en el cleanup del componente
        return () => {
          supabase.removeChannel(channel);
          _activeChatChannel = null;
          _subscribedChatId = null;
          set({ typingUsers: {} });
        };
      },

      // === SUSCRIBIRSE A TODOS LOS CHATS ===
      // Canal global que escucha mensajes INSERT y UPDATE en la tabla messages
      // mediante postgres_changes. Actualiza la bandeja de entrada en tiempo real.
      subscribeToAllChats: () => {
        if (useAuthStore.getState().isDemoMode) return () => {};
        if (_globalChatChannel) return () => {};

        const currentUser = useAuthStore.getState().user;
        const channel = supabase
          .channel(`user-chat-inbox-${currentUser?.id || "anonymous"}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages" },
            (payload) => {
              const row = payload.new as {
                id: string;
                chat_id: string;
                sender_id: string;
                text: string;
                created_at: string;
                media_url?: string;
                metadata?: Record<string, unknown>;
              };
              const incomingMessage: ChatMessage = {
                id: row.id,
                sender_id: row.sender_id,
                text: row.text,
                created_at: row.created_at,
                media_url: row.media_url || undefined,
                metadata: row.metadata || undefined,
              };

              chatLog("realtime:message-received", {
                chatId: row.chat_id,
                messageId: row.id,
              });
              set((state: any) => ({
                chats: state.chats.map(
                  mapChatForInsert(row, incomingMessage, currentUser, state.activeConversationId),
                ),
                lastDiagnostic: `Mensaje recibido en vivo en ${row.chat_id}.`,
              }));

              if (row.sender_id !== currentUser?.id && get().activeConversationId === row.chat_id) {
                void get().markMessagesAsSeen(row.chat_id);
              }
            },
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "messages" },
            (payload) => {
              const row = payload.new as ChatMessage & { chat_id: string };
              set((state: any) => ({
                chats: state.chats.map(mapChatForUpdate(row)),
              }));
            },
          )
          .subscribe((status, error) => {
            if (status === "SUBSCRIBED") {
              chatLog("realtime:inbox-subscribed", { userId: currentUser?.id });
              set({ lastDiagnostic: "Bandeja conectada en tiempo real." });
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              console.error("[chat] realtime:inbox-error", { status, error });
              set({ lastDiagnostic: `Bandeja Realtime: ${status.toLowerCase()}.` });
            }
          });

        _globalChatChannel = channel;
        return () => {
          supabase.removeChannel(channel);
          if (_globalChatChannel === channel) _globalChatChannel = null;
        };
      },
    }),
    {
      name: "sportmatch-chat",
      storage: createJSONStorage(() => safeLocalStorage),
      // Solo persiste chats y activeConversationId, no el estado transitorio
      partialize: (state) => ({
        chats: state.chats,
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
);

// === BLOQUE: SUSCRIPCIÓN A CAMBIOS DE AUTENTICACIÓN ===
// Reinicializa el chat solo cuando cambia el ID del usuario (login/logout).
// Limpia los canales Realtime activos antes de recargar.
let _prevChatUserId: string | null = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const userId = state.user?.id ?? null;
  if (userId !== _prevChatUserId) {
    _prevChatUserId = userId;

    // Limpia canales Realtime activos al cambiar de usuario
    if (_activeChatChannel) {
      supabase.removeChannel(_activeChatChannel);
      _activeChatChannel = null;
      _subscribedChatId = null;
    }
    if (_globalChatChannel) {
      supabase.removeChannel(_globalChatChannel);
      _globalChatChannel = null;
    }

    useChatStore.getState().initChat();
  }
});
