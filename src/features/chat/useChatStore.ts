import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_CHATS, MOCK_USERS, Chat } from "@/lib/mock";
import { useAuthStore } from "@/entities/user/useAuth";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

interface ChatState {
  chats: Chat[];
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (chatId: string, text: string) => void;
  createChat: (userId: string) => string;
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
      createChat: (targetUserId) => {
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

        const targetUser = MOCK_USERS.find((u) => u.id === targetUserId);
        const name = targetUser ? targetUser.name : "Chat";
        const avatar = targetUser ? targetUser.avatar_url : "";

        const newChat: Chat = {
          id: `chat_${Date.now()}`,
          name,
          avatar,
          current_players: [currentUser.id, targetUserId],
          messages: [],
          unread: 0,
        };

        // Sync to mock and state
        MOCK_CHATS.push(newChat);
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

// Subscribe to useAuthStore to reset active chat appropriately
useAuthStore.subscribe(() => {
  useChatStore.getState().initChat();
});
