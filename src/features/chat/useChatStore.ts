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
}

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
          const newMessage = {
            id: `msg_${Date.now()}`,
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
    }),
    {
      name: "sportmatch-chat",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

// Subscribe to useAuthStore
useAuthStore.subscribe(() => {
  useChatStore.getState().initChat();
});
