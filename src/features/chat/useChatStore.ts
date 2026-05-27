import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_CHATS, Chat } from "@/lib/mock";
import { useAuthStore } from "@/entities/user/useAuth";

interface ChatState {
  chats: Chat[];
  activeConversationId: string | null;
  setActiveConversation: (id: string) => void;
  sendMessage: (chatId: string, text: string) => void;
  initChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: MOCK_CHATS,
      activeConversationId: null,
      setActiveConversation: (id) => set({ activeConversationId: id }),
      initChat: () => {
        const user = useAuthStore.getState().user;
        if (user) {
          const userChats = get().chats.filter((c) => c.current_players.includes(user.id));
          const currentActive = get().activeConversationId;
          // Only reset active conversation if the current one is not part of the user's chats
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

          // Sync to global mock array to persist
          const idx = MOCK_CHATS.findIndex((c) => c.id === chatId);
          if (idx !== -1) {
            MOCK_CHATS[idx].messages.push(newMessage);
          }

          return { chats: updatedChats };
        }),
    }),
    {
      name: "sportmatch-chat",
    },
  ),
);

// Subscribe to useAuthStore to reset active chat appropriately
useAuthStore.subscribe(() => {
  useChatStore.getState().initChat();
});
