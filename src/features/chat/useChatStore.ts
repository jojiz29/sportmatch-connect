import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

export interface ChatMessage {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
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
  setActiveConversation: (id: string | null) => void;
  sendMessage: (chatId: string, text: string) => void;
  createChat: (userId: string) => Promise<string>;
  initChat: () => void;

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

      setActiveConversation: (id) => set({ activeConversationId: id }),

      initChat: () => {
        const user = useAuthStore.getState().user;
        if (user) {
          const userChats = get().chats.filter((c) => c.current_players.includes(user.id));
          const currentActive = get().activeConversationId;
          if (!currentActive || !userChats.some((c) => c.id === currentActive)) {
            set({ activeConversationId: userChats[0]?.id || null });
          }
        } else {
          set({ activeConversationId: null });
        }
      },

      sendMessage: (chatId, text) =>
        set((state) => {
          const user = useAuthStore.getState().user;
          const sender_id = user ? user.id : "unknown";
          const newMessage: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            sender_id,
            text,
            created_at: new Date().toISOString(),
          };

          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId) {
              return { ...chat, messages: [...chat.messages, newMessage] };
            }
            return chat;
          });

          return { chats: updatedChats };
        }),

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

      subscribeToChat: (chatId) => {
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
              };

              // Skip messages we sent ourselves — already added optimistically
              if (row.sender_id === currentUser?.id) return;

              const incomingMsg: ChatMessage = {
                id: row.id,
                sender_id: row.sender_id,
                text: row.text,
                created_at: row.created_at,
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
            },
          )
          .subscribe();

        _activeChatChannel = channel;
        _subscribedChatId = chatId;

        // Return cleanup function for component unmount
        return () => {
          supabase.removeChannel(channel);
          _activeChatChannel = null;
          _subscribedChatId = null;
        };
      },
    }),
    {
      name: "sportmatch-chat",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

// Subscribe to useAuthStore.
// Only re-initializes chat when the user ID actually changes (login/logout).
let _prevChatUserId: string | null = null;
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
