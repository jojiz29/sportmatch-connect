import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Search, Plus, Users, MessageSquare } from "lucide-react";
import { useChatStore } from "@/features/chat/useChatStore";
import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/useAuth";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { User, Court, Match, Squad } from "@/entities/types";
import { useSocialStore } from "@/features/social/model/useSocialStore";
import { supabase } from "@/shared/api/supabase";
import { joinSquad, getSquads } from "@/shared/api/squadService";
import { BookingModal } from "@/components/BookingModal";
import { toast } from "sonner";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { getMutualPlayerConnections, PlayerConnection } from "@/shared/api/connectionService";

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
    subscribeToAllChats,
  } = useChatStore();
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateSquadModalOpen, setIsCreateSquadModalOpen] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [areProfilesLoading, setAreProfilesLoading] = useState(true);
  const [sidebarView, setSidebarView] = useState<"chats" | "connections">("chats");
  const [playerConnections, setPlayerConnections] = useState<PlayerConnection[]>([]);

  // Media attachments & interactive cards state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [userSquads, setUserSquads] = useState<Squad[]>([]);
  const [systemMatches, setSystemMatches] = useState<Match[]>([]);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);

  const [isJoiningMap, setIsJoiningMap] = useState<Record<string, boolean>>({});
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  const handleJoinSquad = async (squadId: string, squadName: string) => {
    if (!currentUser) return;
    try {
      setIsJoiningMap((prev) => ({ ...prev, [squadId]: true }));
      await joinSquad(squadId, currentUser.id);
      setJoinedMap((prev) => ({ ...prev, [squadId]: true }));
      toast.success(`¡Te has unido al Squad ${squadName}!`);
    } catch (err) {
      console.error("Error joining squad:", err);
      toast.error("Error al unirse al Squad.");
    } finally {
      setIsJoiningMap((prev) => ({ ...prev, [squadId]: false }));
    }
  };

  const relationships = useSocialStore((state) => state.relationships);
  const createGroupChat = useChatStore((state) => state.createGroupChat);

  // Sync followings & catalog information
  useEffect(() => {
    if (!currentUser || useAuthStore.getState().isDemoMode) return;

    async function syncRelationships() {
      try {
        const { data: followRows } = await supabase
          .from("followers")
          .select("follower_id, following_id");

        if (followRows) {
          const mapped = followRows.map((r) => ({
            followerId: r.follower_id,
            followingId: r.following_id,
          }));
          useSocialStore.setState({ relationships: mapped });
        }
      } catch (err) {
        console.warn("Could not sync follow relationships for squad chat:", err);
      }
    }
    syncRelationships();
  }, [currentUser]);

  // Load squads & matches for user attachments
  useEffect(() => {
    if (!currentUser) return;
    getSquads()
      .then((list) => setUserSquads(list))
      .catch((err) => console.warn("Failed to load user squads for attachments:", err));

    // Try backend first for matches, fallback to Supabase
    backendApi.matches
      .getAll()
      .then((list) => setSystemMatches(list as Match[]))
      .catch(() => {
        apiClient.matches
          .getAll()
          .then((list) => setSystemMatches(list))
          .catch((err) => console.warn("Failed to load active matches for attachments:", err));
      });
  }, [currentUser]);

  const socialUserIds = useMemo(() => {
    if (!currentUser) return [];
    const followingIds = relationships
      .filter((r) => r.followerId === currentUser.id)
      .map((r) => r.followingId);
    const followerIds = relationships
      .filter((r) => r.followingId === currentUser.id)
      .map((r) => r.followerId);

    return Array.from(new Set([...followingIds, ...followerIds])).filter(
      (id) => id !== currentUser.id,
    );
  }, [relationships, currentUser]);

  const socialUsers = useMemo(() => {
    return registeredUsers.filter((u) => socialUserIds.includes(u.id));
  }, [registeredUsers, socialUserIds]);

  useEffect(() => {
    let active = true;
    setAreProfilesLoading(true);
    apiClient.users
      .getMatches()
      .then((users) => {
        if (active) setRegisteredUsers(users);
      })
      .catch((err) => console.error("Error fetching registered users:", err))
      .finally(() => {
        if (active) setAreProfilesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;

    // Las conexiones se administran desde Mensajes para poder iniciar varias
    // conversaciones, desafíos o invitaciones con el mismo jugador.
    getMutualPlayerConnections(currentUser.id)
      .then((connections) => {
        if (active) setPlayerConnections(connections);
      })
      .catch((error) => console.error("Error al cargar conexiones deportivas:", error));

    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  useEffect(() => {
    // La bandeja global recibe mensajes de todas las conversaciones en tiempo real,
    // incluso cuando el usuario está leyendo otro chat.
    const unsubscribe = subscribeToAllChats();
    return unsubscribe;
  }, [subscribeToAllChats]);

  const userChats = chats.filter((c) => currentUser && c.current_players.includes(currentUser.id));
  const activeChat = userChats.find((c) => c.id === activeConversationId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  useEffect(() => {
    if (!activeConversationId) return;
    const unsubscribe = subscribeToChat(activeConversationId);
    return unsubscribe;
  }, [activeConversationId, subscribeToChat]);

  // Handle selected image attachments transcoding to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageBase64(reader.result as string);
        toast.success("Imagen adjuntada correctamente.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    console.log("[chat] ui:send-click", {
      activeConversationId,
      hasText: Boolean(text.trim()),
      hasImage: Boolean(selectedImageBase64),
    });
    // Un mensaje necesita conversación activa y contenido real o un adjunto.
    if (!activeConversationId) {
      toast.error("No hay una conversación activa");
      return;
    }
    if (!text.trim() && !selectedImageBase64) return;

    const pendingText = text.trim();
    const pendingImage = selectedImageBase64;

    // Limpiamos el compositor inmediatamente para que el chat responda como una
    // aplicación de mensajería. Si Supabase falla, recuperamos el borrador.
    setText("");
    setSelectedImageBase64(null);
    setIsAttachmentMenuOpen(false);

    try {
      await sendMessage(activeConversationId, pendingText, pendingImage || undefined);
    } catch (error) {
      setText((currentText) => currentText || pendingText);
      setSelectedImageBase64((currentImage) => currentImage || pendingImage);
      console.error("[chat] ui:send-error", { chatId: activeConversationId, error });
      toast.error("No se pudo enviar el mensaje", {
        description: "Revisa los logs [chat] de la consola para identificar la causa.",
      });
    }
  };

  // Helper callbacks to send Actionable Cards
  const sendSquadInviteCard = (squad: Squad) => {
    if (!activeConversationId) return;
    sendMessage(activeConversationId, `¡Únete a mi Squad: ${squad.name}! 👥`, undefined, {
      type: "squad_invite",
      squad_id: squad.id,
      squad_name: squad.name,
    });
    setIsAttachmentMenuOpen(false);
    toast.success("Invitación de Squad enviada.");
  };

  const sendMatchProposalCard = (match: Match) => {
    if (!activeConversationId) return;
    sendMessage(activeConversationId, `¿Jugamos un partido? ${match.title} 🎾`, undefined, {
      type: "match_proposal",
      match_id: match.id,
      match_title: match.title,
      court_name: match.court?.name || "Cancha recomendada",
      price: match.court?.price_per_hour || 100,
      court_id: match.court_id,
    });
    setIsAttachmentMenuOpen(false);
    toast.success("Propuesta de Partido enviada.");
  };

  const handlePlayCheckout = async (courtId: string) => {
    try {
      // Try backend first, fallback to Supabase
      const backendResult = await backendApi.courts.getById(courtId);
      if (backendResult.data) {
        setSelectedCourtForBooking(backendResult.data as Court);
      } else {
        const courtData = await apiClient.courts.getById(courtId);
        setSelectedCourtForBooking(courtData);
      }
    } catch (err) {
      console.error("Failed to load court for checkout:", err);
      toast.error("No se pudo cargar los detalles de la cancha.");
    }
  };

  if (!currentUser) return null;

  const filteredUserChats = userChats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredConnections = playerConnections.filter((connection) => {
    const profile =
      connection.connected_user ||
      registeredUsers.find((user) => user.id === connection.connected_user_id);
    return profile?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
                setSquadName("");
                setSelectedUserIds([]);
                setIsCreateSquadModalOpen(true);
              }}
              className="p-2 rounded-xl bg-accent text-accent-foreground border border-border hover:bg-accent/80 hover:shadow-glow transition-all cursor-pointer flex items-center justify-center"
              title={t("chat.create_squad")}
              aria-label={t("chat.create_squad")}
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setUserSearchQuery("");
                setIsNewChatModalOpen(true);
              }}
              className="p-2 rounded-xl bg-neon text-neon-foreground hover:shadow-neon transition-shadow cursor-pointer flex items-center justify-center"
              title={t("chat.new_message")}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 p-2 border-b border-border bg-background/30">
            <button
              onClick={() => setSidebarView("chats")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                sidebarView === "chats" ? "bg-accent text-foreground" : "text-muted-foreground"
              }`}
            >
              Conversaciones
            </button>
            <button
              onClick={() => setSidebarView("connections")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                sidebarView === "connections" ? "bg-neon/15 text-neon" : "text-muted-foreground"
              }`}
            >
              Conexiones ({playerConnections.length})
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarView === "chats" &&
              filteredUserChats.map((c) => {
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
                          {lastMessage ? lastMessage.text : t("chat.no_messages")}
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

            {sidebarView === "connections" &&
              filteredConnections.map((connection) => {
                const profile =
                  connection.connected_user ||
                  registeredUsers.find((user) => user.id === connection.connected_user_id);
                if (!profile) return null;

                return (
                  <div
                    key={connection.id}
                    className="p-4 border-b border-border/50 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="h-11 w-11 rounded-full bg-muted object-cover border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{profile.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {connection.sport || profile.preferred_sports?.[0] || "Deportista"}
                          {connection.compatibility_score
                            ? ` · ${connection.compatibility_score}% compatible`
                            : ""}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={async () => {
                          const chatId = await createChat(profile.id);
                          setActiveConversation(chatId);
                          setSidebarView("chats");
                        }}
                        className="rounded-lg bg-neon text-neon-foreground px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Mensaje
                      </button>
                      <Link
                        to="/app/profile/$userId"
                        params={{ userId: profile.id }}
                        className="rounded-lg border border-border bg-background px-2 py-2 text-xs font-semibold text-center hover:bg-accent/40"
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                );
              })}

            {sidebarView === "connections" && filteredConnections.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Conecta con jugadores desde Matchmaking para encontrarlos aquí.
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col bg-background/50">
          <ChatWindow
            activeChat={activeChat}
            currentUser={currentUser}
            registeredUsers={registeredUsers}
            areProfilesLoading={areProfilesLoading}
            text={text}
            setText={setText}
            handleSend={handleSend}
            handleFileChange={handleFileChange}
            selectedImageBase64={selectedImageBase64}
            setSelectedImageBase64={setSelectedImageBase64}
            isAttachmentMenuOpen={isAttachmentMenuOpen}
            setIsAttachmentMenuOpen={setIsAttachmentMenuOpen}
            userSquads={userSquads}
            systemMatches={systemMatches}
            sendSquadInviteCard={sendSquadInviteCard}
            sendMatchProposalCard={sendMatchProposalCard}
            handlePlayCheckout={handlePlayCheckout}
            onJoinSquad={handleJoinSquad}
            isJoiningMap={isJoiningMap}
            joinedMap={joinedMap}
            endRef={endRef}
            fileInputRef={fileInputRef}
            t={t}
          />
        </div>
      </div>

      {/* Booking Modal Checkout */}
      <BookingModal
        court={selectedCourtForBooking}
        isOpen={selectedCourtForBooking !== null}
        onOpenChange={(open) => !open && setSelectedCourtForBooking(null)}
        baseLocation={null}
      />

      {/* New Chat Modal Overlay */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsNewChatModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-gradient-card border border-border rounded-3xl p-6 shadow-card overflow-hidden flex flex-col max-h-[80vh] z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{t("chat.new_message")}</h3>
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
                placeholder={t("chat.search_users")}
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
                        {u.bio || t("register.role_player")}
                      </div>
                    </div>
                    <div className="h-7 px-3 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold grid place-items-center shadow-glow shrink-0">
                      {t("chat.chat_btn")}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Squad Modal Overlay */}
      {isCreateSquadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsCreateSquadModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-gradient-card border border-border rounded-3xl p-6 shadow-card overflow-hidden flex flex-col max-h-[80vh] z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">{t("chat.create_squad")}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t("chat.create_squad_hint")}</p>
              </div>
              <button
                onClick={() => setIsCreateSquadModalOpen(false)}
                aria-label={t("common.close", { defaultValue: "Cerrar" })}
                className="h-8 w-8 rounded-full bg-muted grid place-items-center hover:bg-accent transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>

            <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  {t("chat.squad_name")}
                </label>
                <input
                  type="text"
                  placeholder={t("chat.squad_placeholder")}
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="text-xs text-muted-foreground block">
                    {t("chat.select_members")}
                  </label>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {t("chat.selected_members", { count: selectedUserIds.length })}
                  </span>
                </div>
                {socialUsers.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-background/50 px-4 py-8 text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold">{t("chat.no_contacts")}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {t("chat.no_contacts_hint")}
                    </p>
                  </div>
                ) : (
                  socialUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                          } else {
                            setSelectedUserIds([...selectedUserIds, u.id]);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all text-left cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-accent/40 border-transparent"
                        }`}
                      >
                        <img
                          src={u.avatar_url}
                          alt={u.name}
                          className="h-10 w-10 rounded-full bg-muted object-cover border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{u.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {u.bio || t("register.role_player")}
                          </div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground"
                          }`}
                        >
                          {isSelected && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                disabled={!squadName.trim()}
                onClick={async () => {
                  await createGroupChat(squadName.trim(), selectedUserIds);
                  setIsCreateSquadModalOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-neon text-neon-foreground font-bold hover:shadow-neon transition-shadow disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-center"
              >
                {t("chat.create_squad_btn", { count: selectedUserIds.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Chat;
