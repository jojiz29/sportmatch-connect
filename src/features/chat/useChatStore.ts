import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { MOCK_USERS } from "@/shared/api/apiClient";
import { Match } from "@/entities/types";
import { withTimeout } from "@/shared/api/timeoutHelper";

export interface ChatMessage {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  media_url?: string;
  metadata?: Record<string, unknown>;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  current_players: string[];
  messages: ChatMessage[];
  unread: number;
}

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

// Module-level channel tracker — survives Zustand re-renders but is cleaned
// up when subscribeToChat is called again or on component unmount.
let _activeChatChannel: ReturnType<typeof supabase.channel> | null = null;
let _subscribedChatId: string | null = null;
let _globalChatChannel: ReturnType<typeof supabase.channel> | null = null;

function chatLog(event: string, context: Record<string, unknown> = {}) {
  // Los logs de chat incluyen identificadores y etapas, nunca el contenido privado.
  console.log(`[chat] ${event}`, context);
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeConversationId: null,
      typingUsers: {},
      lastDiagnostic: "Chat todavía no inicializado.",

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

      sendMessage: async (chatId, text, mediaUrl, metadata) => {
        const normalizedText = text.trim();
        // Esta validación protege todos los puntos de entrada, no solo el formulario del chat.
        if (!chatId || (!normalizedText && !mediaUrl)) return;

        const user = useAuthStore.getState().user;
        const sender_id = user ? user.id : "unknown";
        const newMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const isDemo =
          useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";
        const sendingMetadata = { ...metadata, delivery_status: "sending" };
        const sentMetadata = { ...metadata, delivery_status: "sent" };

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

        set((state) => {
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId) {
              return { ...chat, messages: [...chat.messages, newMessage] };
            }
            return chat;
          });
          return { chats: updatedChats };
        });

        if (!isDemo) {
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

          // Permite probar el chat aunque el RPC nuevo todavía no haya sido desplegado.
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
            // Si Supabase rechaza el mensaje, retiramos la copia optimista local.
            set((state) => ({
              chats: state.chats.map((chat) =>
                chat.id === chatId
                  ? {
                      ...chat,
                      messages: chat.messages.filter((message) => message.id !== newMessageId),
                    }
                  : chat,
              ),
              lastDiagnostic: `Error enviando en ${chatId}: ${error.message}`,
            }));
            console.error("[chat] send:error", { chatId, messageId: newMessageId, error });
            throw error;
          }
          chatLog("send:confirmed", { chatId, messageId: newMessageId });
          const confirmedMessage = { ...newMessage, metadata: sentMetadata };
          set((state) => ({
            chats: state.chats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    messages: chat.messages.map((message) =>
                      message.id === newMessageId ? confirmedMessage : message,
                    ),
                  }
                : chat,
            ),
            lastDiagnostic: `Mensaje confirmado en ${chatId}.`,
          }));

          // Broadcast entrega el mensaje inmediatamente al chat abierto del receptor.
          // PostgreSQL Realtime continúa siendo la fuente persistente y evita pérdidas.
          if (_subscribedChatId === chatId && _activeChatChannel) {
            await _activeChatChannel.send({
              type: "broadcast",
              event: "new-message",
              payload: { ...confirmedMessage, chat_id: chatId },
            });
          }
        } else {
          // Simulate target reads the message after 2 seconds in Demo mode
          setTimeout(() => {
            set((state) => {
              const updatedChats = state.chats.map((chat) => {
                if (chat.id === chatId) {
                  return {
                    ...chat,
                    messages: chat.messages.map((m) => {
                      if (m.id === newMessageId) {
                        return { ...m, metadata: { ...m.metadata, seen: true } };
                      }
                      return m;
                    }),
                  };
                }
                return chat;
              });
              return { chats: updatedChats };
            });
          }, 2000);
        }
      },

      createChat: async (targetUserId) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return "";
        const isDemo = useAuthStore.getState().isDemoMode;

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

        // Fetch target user profile dynamically from Supabase profiles
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
            return "";
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

      loadPersistentChats: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || useAuthStore.getState().isDemoMode) return;

        try {
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

          const { data: messageRows, error: messagesError } = await supabase
            .from("messages")
            .select("*")
            .in("chat_id", conversationIds)
            .order("created_at", { ascending: true });
          if (messagesError) throw messagesError;

          // Cargamos todos los historiales al entrar para que la lista se comporte
          // como una bandeja de mensajería y no dependa de abrir cada conversación.
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
            // Descartamos chats directos heredados con ID local porque cada navegador
            // generaba uno diferente y nunca podían compartir mensajes.
            const compatibleLocalChats = state.chats.filter(
              (chat) =>
                (chat.id.startsWith("chat_squad_") || chat.id.startsWith("chat_match_")) &&
                !persistentChats.some((persistent) => persistent.id === chat.id),
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

      createMatchGroupChat: (match) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const participantIds = match.current_players?.map((p) => p.id) || [];
        if (!participantIds.includes(match.creator_id)) {
          participantIds.push(match.creator_id);
        }

        // We only create if currentUser is a participant/creator of this match
        if (!participantIds.includes(currentUser.id)) return;

        const chatId = `chat_match_${match.id}`;
        const existing = get().chats.some((c) => c.id === chatId);
        if (existing) return;

        const sportEmoji =
          match.sport === "Fútbol"
            ? "⚽"
            : match.sport === "Tenis"
              ? "🎾"
              : match.sport === "Pádel"
                ? "🏓"
                : "🏆";

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

      sendTypingStatus: (isTyping) => {
        const user = useAuthStore.getState().user;
        if (!user || !_activeChatChannel) return;

        _activeChatChannel.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: user.id, isTyping },
        });
      },

      markMessagesAsSeen: async (chatId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const isDemo =
          useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";

        if (isDemo) {
          set((state) => ({
            chats: state.chats.map((c) => {
              if (c.id !== chatId) return c;
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.sender_id !== user.id) {
                    return { ...m, metadata: { ...m.metadata, seen: true } };
                  }
                  return m;
                }),
              };
            }),
          }));
          return;
        }

        try {
          // Select unseen messages sent by others
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

          // Reflejamos la lectura de inmediato para el receptor. El evento UPDATE de
          // Realtime actualizará los dobles checks en la sesión del remitente.
          set((state) => ({
            chats: state.chats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    unread: 0,
                    messages: chat.messages.map((message) =>
                      message.sender_id !== user.id
                        ? { ...message, metadata: { ...message.metadata, seen: true } }
                        : message,
                    ),
                  }
                : chat,
            ),
          }));
        } catch (e) {
          console.warn("Failed to mark messages as seen:", e);
        }
      },

      subscribeToChat: (chatId) => {
        if (useAuthStore.getState().isDemoMode) {
          return () => {};
        }

        // Load existing history first
        get().loadChatHistory(chatId);
        get().markMessagesAsSeen(chatId);

        // Prevent duplicate subscriptions for the same chat
        if (_subscribedChatId === chatId && _activeChatChannel) {
          return () => {
            if (_activeChatChannel) {
              supabase.removeChannel(_activeChatChannel);
              _activeChatChannel = null;
              _subscribedChatId = null;
            }
          };
        }

        // Clean up previous subscription
        if (_activeChatChannel) {
          supabase.removeChannel(_activeChatChannel);
          _activeChatChannel = null;
          _subscribedChatId = null;
        }

        // La conversación activa conserva un canal separado para eventos efímeros,
        // como el indicador "escribiendo".
        const channel = supabase
          .channel(`chat-messages-${chatId}`)
          .on("broadcast", { event: "new-message" }, ({ payload }) => {
            const row = payload as ChatMessage & { chat_id: string };
            if (row.sender_id === useAuthStore.getState().user?.id) return;

            set((state) => ({
              chats: state.chats.map((chat) =>
                chat.id === row.chat_id && !chat.messages.some((message) => message.id === row.id)
                  ? { ...chat, messages: [...chat.messages, row] }
                  : chat,
              ),
            }));
          })
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            const { userId, isTyping } = payload;
            set((state) => {
              const updated = { ...state.typingUsers };
              if (isTyping) {
                updated[userId] = true;
              } else {
                delete updated[userId];
              }
              return { typingUsers: updated };
            });
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

        // Return cleanup function for component unmount
        return () => {
          supabase.removeChannel(channel);
          _activeChatChannel = null;
          _subscribedChatId = null;
          set({ typingUsers: {} });
        };
      },

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
              set((state) => ({
                chats: state.chats.map((chat) => {
                  if (chat.id !== row.chat_id || chat.messages.some((m) => m.id === row.id)) {
                    return chat;
                  }
                  return {
                    ...chat,
                    messages: [...chat.messages, incomingMessage],
                    unread:
                      row.sender_id !== currentUser?.id &&
                      state.activeConversationId !== row.chat_id
                        ? chat.unread + 1
                        : chat.unread,
                  };
                }),
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
              set((state) => ({
                chats: state.chats.map((chat) =>
                  chat.id === row.chat_id
                    ? {
                        ...chat,
                        messages: chat.messages.map((message) =>
                          message.id === row.id ? { ...message, ...row } : message,
                        ),
                      }
                    : chat,
                ),
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
      partialize: (state) => ({
        chats: state.chats,
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
);

// Subscribe to useAuthStore.
// Only re-initializes chat when the user ID actually changes (login/logout).
let _prevChatUserId: string | null = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const userId = state.user?.id ?? null;
  if (userId !== _prevChatUserId) {
    _prevChatUserId = userId;

    // Clean up any active Realtime channel on user change
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
