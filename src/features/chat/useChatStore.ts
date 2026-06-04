import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { MOCK_USERS } from "@/shared/api/apiClient";
import { Match } from "@/entities/types";

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
  loadChatHistory: (chatId: string) => Promise<void>;
  sendTypingStatus: (isTyping: boolean) => void;
  markMessagesAsSeen: (chatId: string) => Promise<void>;

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

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeConversationId: null,
      typingUsers: {},

      setActiveConversation: (id) => {
        set({ activeConversationId: id, typingUsers: {} });
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
        } else {
          set({ activeConversationId: null });
        }
      },

      sendMessage: async (chatId, text, mediaUrl, metadata) => {
        const user = useAuthStore.getState().user;
        const sender_id = user ? user.id : "unknown";
        const newMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const isDemo =
          useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";

        const newMessage: ChatMessage = {
          id: newMessageId,
          sender_id,
          text,
          created_at: new Date().toISOString(),
          media_url: mediaUrl,
          metadata,
        };

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
          try {
            await supabase.from("messages").insert({
              id: newMessageId,
              chat_id: chatId,
              sender_id,
              text,
              media_url: mediaUrl || null,
              metadata: metadata || null,
            });
          } catch (err) {
            console.error("Failed to insert message in Supabase:", err);
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

        const existingChat = get().chats.find(
          (c) =>
            c.current_players.length === 2 &&
            c.current_players.includes(currentUser.id) &&
            c.current_players.includes(targetUserId),
        );

        if (existingChat) {
          set({ activeConversationId: existingChat.id });
          return existingChat.id;
        }

        // Fetch target user profile dynamically from Supabase profiles
        let name = "Deportista";
        let avatar = "";
        if (useAuthStore.getState().isDemoMode) {
          const targetUser = MOCK_USERS.find((u) => u.id === targetUserId);
          if (targetUser) {
            name = targetUser.name;
            avatar = targetUser.avatar_url || "";
          }
        } else {
          try {
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
            console.warn("Failed to fetch target user profile for chat:", e);
          }
        }

        const newChat: Chat = {
          id: `chat_${Date.now()}`,
          name,
          avatar,
          current_players: [currentUser.id, targetUserId],
          messages: [],
          unread: 0,
        };

        set((state) => ({
          chats: [...state.chats, newChat],
          activeConversationId: newChat.id,
        }));

        return newChat.id;
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
          console.warn("Failed to load chat history from database:", e);
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

        const currentUser = useAuthStore.getState().user;

        // The channel name is keyed on chatId to avoid duplicates across remounts
        const channel = supabase
          .channel(`chat-messages-${chatId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `chat_id=eq.${chatId}`,
            },
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

              // Skip messages we sent ourselves — already added optimistically
              if (row.sender_id === currentUser?.id) return;

              const incomingMsg: ChatMessage = {
                id: row.id,
                sender_id: row.sender_id,
                text: row.text,
                created_at: row.created_at,
                media_url: row.media_url || undefined,
                metadata: row.metadata || undefined,
              };

              set((state) => ({
                chats: state.chats.map((chat) => {
                  if (chat.id !== chatId) return chat;
                  // Deduplicate by ID
                  if (chat.messages.some((m) => m.id === incomingMsg.id)) return chat;
                  return {
                    ...chat,
                    messages: [...chat.messages, incomingMsg],
                    // Increment unread only when this isn't the active conversation
                    unread:
                      useChatStore.getState().activeConversationId !== chatId ? chat.unread + 1 : 0,
                  };
                }),
              }));

              // If active conversation, mark as seen
              if (useChatStore.getState().activeConversationId === chatId) {
                get().markMessagesAsSeen(chatId);
              }
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "messages",
              filter: `chat_id=eq.${chatId}`,
            },
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

              const updatedMsg: ChatMessage = {
                id: row.id,
                sender_id: row.sender_id,
                text: row.text,
                created_at: row.created_at,
                media_url: row.media_url || undefined,
                metadata: row.metadata || undefined,
              };

              set((state) => ({
                chats: state.chats.map((chat) => {
                  if (chat.id !== chatId) return chat;
                  return {
                    ...chat,
                    messages: chat.messages.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
                  };
                }),
              }));
            },
          )
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
          .subscribe();

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

    useChatStore.getState().initChat();
  }
});
