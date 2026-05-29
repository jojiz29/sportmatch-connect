import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Image as ImageIcon,
  Smile,
  Plus,
} from "lucide-react";
import { useChatStore } from "@/features/chat/useChatStore";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/useAuth";
import { apiClient } from "@/shared/api/apiClient";
import { User } from "@/entities/types";

export const Route = createFileRoute("/app/chat")({
  head: () => ({ meta: [{ title: "Chat — SportMatch" }] }),
  component: Chat,
});

function Chat() {
  const { t } = useTranslation();
  const {
    chats,
    activeConversationId,
    setActiveConversation,
    sendMessage,
    createChat,
    initChat,
    subscribeToChat,
  } = useChatStore();
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  useEffect(() => {
    let active = true;
    apiClient.users
      .getMatches()
      .then((users) => {
        if (active) setRegisteredUsers(users);
      })
      .catch((err) => console.error("Error fetching registered users:", err));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    initChat();
  }, [initChat]);

  const userChats = chats.filter((c) => currentUser && c.current_players.includes(currentUser.id));
  const activeChat = userChats.find((c) => c.id === activeConversationId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // Subscribe to Realtime messages for the active conversation.
  // Cleanup is automatic on unmount or when activeConversationId changes.
  useEffect(() => {
    if (!activeConversationId) return;
    const unsubscribe = subscribeToChat(activeConversationId);
    return unsubscribe;
  }, [activeConversationId, subscribeToChat]);

  const handleSend = () => {
    if (!text.trim() || !activeConversationId) return;
    sendMessage(activeConversationId, text);
    setText("");
  };

  if (!currentUser) return null;

  const filteredUserChats = userChats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 h-[calc(100vh-80px)] lg:h-[calc(100vh-40px)] flex flex-col">
      <PageHeader title={t("chat.title")} />

      <div className="flex-1 bg-gradient-card border border-border rounded-2xl shadow-card overflow-hidden flex mt-4">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-border flex flex-col bg-card/50">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("chat.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => {
                setUserSearchQuery("");
                setIsNewChatModalOpen(true);
              }}
              className="p-2 rounded-xl bg-neon text-neon-foreground hover:shadow-neon transition-shadow cursor-pointer"
              title="Nuevo Chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredUserChats.map((c) => {
              const lastMessage = c.messages[c.messages.length - 1];
              const isActive = c.id === activeConversationId;

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConversation(c.id)}
                  className={`w-full p-4 flex items-center gap-3 transition-colors text-left border-b border-border/50 ${isActive ? "bg-accent/50" : "hover:bg-accent/30"}`}
                >
                  <div className="relative">
                    {c.avatar.startsWith("http") ? (
                      <img
                        src={c.avatar}
                        alt=""
                        className="h-12 w-12 rounded-full bg-muted object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-primary grid place-items-center text-xl">
                        🎾
                      </div>
                    )}
                    {c.unread > 0 && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-neon border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold truncate">{c.name}</span>
                      <span
                        className={`text-[10px] ${c.unread ? "text-neon font-semibold" : "text-muted-foreground"}`}
                      >
                        {lastMessage
                          ? new Date(lastMessage.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground truncate">
                        {lastMessage ? lastMessage.text : "Sin mensajes"}
                      </span>
                      {c.unread > 0 && (
                        <span className="h-5 w-5 rounded-full bg-neon text-neon-foreground text-[10px] font-bold grid place-items-center ml-2 shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area (Hidden on mobile by default, unless conversation active... simple implementation) */}
        <div className="hidden md:flex flex-1 flex-col bg-background/50">
          {activeChat ? (
            <>
              <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10">
                    {activeChat.avatar.startsWith("http") ? (
                      <img
                        src={activeChat.avatar}
                        alt=""
                        className="h-10 w-10 rounded-full bg-muted object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-lg">
                        🎾
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{activeChat.name}</div>
                    <div className="text-xs text-neon">
                      {activeChat.current_players.length} {t("chat.online")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <button className="hover:text-foreground">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="hover:text-foreground">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="hover:text-foreground">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {activeChat.messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;
                  const sender = registeredUsers.find((u) => u.id === msg.sender_id) || {
                    name: activeChat.name,
                    avatar_url: activeChat.avatar,
                    id: msg.sender_id,
                  };
                  const time = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      {isMe ? (
                        <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-white text-xs font-bold shrink-0">
                          YO
                        </div>
                      ) : (
                        <img
                          src={sender.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full bg-muted shrink-0 object-cover"
                        />
                      )}
                      <div>
                        {!isMe && (
                          <div className="text-xs text-muted-foreground mb-1 ml-1">
                            {sender.name}
                          </div>
                        )}
                        <div
                          className={`p-3 text-sm ${isMe ? "bg-gradient-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-glow" : "bg-accent rounded-2xl rounded-tl-none"}`}
                        >
                          {msg.text}
                        </div>
                        <div
                          className={`text-[10px] mt-1 ${isMe ? "text-primary/70 mr-1 text-right" : "text-muted-foreground ml-1"}`}
                        >
                          {time} {isMe && "✓✓"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="p-4 bg-card/50 border-t border-border">
                <div className="flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2">
                  <button className="text-muted-foreground hover:text-neon">
                    <Smile className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    placeholder={t("chat.placeholder")}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <button className="text-muted-foreground hover:text-neon">
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSend}
                    className="h-8 w-8 rounded-full bg-neon text-neon-foreground grid place-items-center shadow-neon ml-2"
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-muted-foreground flex-col">
              {t("chat.empty")}
            </div>
          )}
        </div>
      </div>
      {/* New Chat Modal Overlay */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsNewChatModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-gradient-card border border-border rounded-3xl p-6 shadow-card overflow-hidden flex flex-col max-h-[80vh] z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Nuevo mensaje</h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted grid place-items-center hover:bg-accent transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {registeredUsers
                .filter(
                  (u) =>
                    u.id !== currentUser.id &&
                    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()),
                )
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={async () => {
                      await createChat(u.id);
                      setIsNewChatModalOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-accent/40 flex items-center gap-3 transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={u.avatar_url}
                      alt={u.name}
                      className="h-10 w-10 rounded-full bg-muted object-cover border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {u.bio || "Deportista"}
                      </div>
                    </div>
                    <div className="h-7 px-3 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold grid place-items-center shadow-glow">
                      Chatear
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
