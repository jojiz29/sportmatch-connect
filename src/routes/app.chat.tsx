// === BLOQUE: Ruta de Chat / Mensajería ===
// Punto de entrada para la mensajería en tiempo real entre jugadores.
// Gestiona la lista de conversaciones, conexiones deportivas, creación de
// Squads grupales y envío de tarjetas interactivas (invitaciones a Squads,
// propuestas de partido, booking de canchas).
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Search, Plus, Users, MessageSquare, Swords, X } from "lucide-react";
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
import { VerifiedBadge } from "@/shared/ui/VerifiedBadge";
import { PlayerConnection, getMutualPlayerConnections } from "@/shared/api/connectionService";
import {
  createPlayerChallenge,
  proposeChallengeChanges,
  respondToChallengeCounterProposal,
  respondToPlayerChallenge,
} from "@/shared/api/challengeService";

export const Route = createFileRoute("/app/chat")({
  head: () => ({ meta: [{ title: "Chats — SportMatch" }] }),
  component: Chats,
});

function Chats() {
  const { t } = useTranslation();

  // === BLOQUE: Estado del chat y búsqueda ===
  // Obtenemos el store central de chat (conversaciones, mensajes, suscripciones)
  // y variables de UI para búsqueda, modales y adjuntos.
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

  // === BLOQUE: Carga de perfiles y conexiones ===
  // Lista completa de usuarios registrados para mostrar nombres/avatares
  // en la lista de conversaciones y conexiones deportivas.
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [areProfilesLoading, setAreProfilesLoading] = useState(true);
  const [sidebarView, setSidebarView] = useState<"chats" | "connections">("chats");
  const [playerConnections, setPlayerConnections] = useState<PlayerConnection[]>([]);

  // === BLOQUE: Adjuntos y tarjetas interactivas ===
  // Manejo de imágenes en base64, menú de adjuntos, Squads y partidos
  // del usuario para enviar como tarjetas interactivas en el chat.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [userSquads, setUserSquads] = useState<Squad[]>([]);
  const [systemMatches, setSystemMatches] = useState<Match[]>([]);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);
  const [isChallengeComposerOpen, setIsChallengeComposerOpen] = useState(false);
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [challengeResponses, setChallengeResponses] = useState<
    Record<string, "accepted" | "rejected" | "counter_proposed">
  >({});
  const [counterProposalTarget, setCounterProposalTarget] = useState<{
    id: string;
    challengerId: string;
  } | null>(null);
  const [challengeDraft, setChallengeDraft] = useState({
    sport: "",
    modality: "amistoso",
    scheduledDate: "",
    scheduledTime: "",
    location: "",
    message: "",
  });

  // Mapas de estado para unirse a Squads desde el chat
  const [isJoiningMap, setIsJoiningMap] = useState<Record<string, boolean>>({});
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  // === BLOQUE: handleJoinSquad ===
  // Permite al usuario unirse a un Squad directamente desde el chat.
  // Actualiza el estado local de forma optimista y muestra notificación.
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

  // === BLOQUE: Sincronización de relaciones (followers) ===
  // Carga las relaciones de seguimiento desde Supabase para usarlas
  // en la selección de miembros para Squads grupales.
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

  // === BLOQUE: Carga de Squads y partidos para adjuntos ===
  // Obtiene los Squads y partidos activos del usuario para mostrarlos
  // como opciones en el menú de adjuntos del chat.
  useEffect(() => {
    if (!currentUser) return;
    getSquads()
      .then((list) => setUserSquads(list))
      .catch((err) => console.warn("Failed to load user squads for attachments:", err));

    backendApi.matches
      .getAll()
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          setSystemMatches(res.data);
        } else {
          apiClient.matches
            .getAll()
            .then((list) => setSystemMatches(list))
            .catch((err) => console.warn("Failed to load active matches for attachments:", err));
        }
      })
      .catch(() => {
        apiClient.matches
          .getAll()
          .then((list) => setSystemMatches(list))
          .catch((err) => console.warn("Failed to load active matches for attachments:", err));
      });
  }, [currentUser]);

  // === BLOQUE: IDs de usuarios seguidos/seguidores ===
  // Extrae los IDs de usuarios con los que el usuario actual tiene
  // una relación de seguimiento (para sugerir como contactos).
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

  // === BLOQUE: Usuarios con relación social ===
  // Filtra la lista completa de registrados para obtener solo aquellos
  // que tienen una relación de seguimiento con el usuario actual.
  const socialUsers = useMemo(() => {
    return registeredUsers.filter((u) => socialUserIds.includes(u.id));
  }, [registeredUsers, socialUserIds]);

  // === BLOQUE: Carga inicial de usuarios ===
  // Obtiene todos los usuarios registrados desde la API para
  // mostrar nombres y avatares en la interfaz de chat.
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

  // === BLOQUE: Carga de conexiones deportivas ===
  // Las conexiones se administran desde Mensajes para poder iniciar
  // varias conversaciones, desafíos o invitaciones con el mismo jugador.
  useEffect(() => {
    if (!currentUser) return;
    let active = true;

    getMutualPlayerConnections(currentUser.id)
      .then((connections) => {
        if (active) setPlayerConnections(connections);
      })
      .catch((error) => console.error("Error al cargar conexiones deportivas:", error));

    return () => {
      active = false;
    };
  }, [currentUser]);

  // === BLOQUE: Inicialización del chat y suscripción global ===
  // Inicializa el store de chat y se suscribe a todas las conversaciones
  // del usuario para recibir mensajes en tiempo real.
  useEffect(() => {
    initChat();
  }, [initChat]);

  useEffect(() => {
    const unsubscribe = subscribeToAllChats();
    return unsubscribe;
  }, [subscribeToAllChats]);

  // === BLOQUE: Filtrado de chats y scroll automático ===
  // Filtra los chats del usuario actual y hace scroll al último mensaje.
  const userChats = chats.filter((c) => currentUser && c.current_players.includes(currentUser.id));
  const activeChat = userChats.find((c) => c.id === activeConversationId);
  const visibleChallengeResponses = useMemo(() => {
    const responses = { ...challengeResponses };
    // Las respuestas también viajan como mensajes para sincronizar ambas sesiones
    // mediante Realtime y reconstruir el estado después de recargar la página.
    for (const message of activeChat?.messages || []) {
      if (
        message.metadata?.type === "challenge_response" &&
        typeof message.metadata.challenge_id === "string" &&
        (message.metadata.decision === "accepted" ||
          message.metadata.decision === "rejected" ||
          message.metadata.decision === "counter_proposed")
      ) {
        responses[message.metadata.challenge_id] = message.metadata.decision;
      }
    }
    return responses;
  }, [activeChat?.messages, challengeResponses]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // === BLOQUE: Suscripción a la conversación activa ===
  // Se suscribe a los cambios en tiempo real de la conversación activa
  // para mostrar mensajes entrantes sin recargar.
  useEffect(() => {
    if (!activeConversationId) return;
    const unsubscribe = subscribeToChat(activeConversationId);
    return unsubscribe;
  }, [activeConversationId, subscribeToChat]);

  // === BLOQUE: Manejo de adjuntos de imágenes ===
  // Convierte el archivo seleccionado a base64 para enviarlo como adjunto.
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

  // === BLOQUE: Envío de mensajes ===
  // Valida que haya una conversación activa y contenido, limpia el
  // compositor inmediatamente para experiencia de mensajería instantánea
  // y recupera el borrador si Supabase falla.
  const handleSend = async () => {
    console.log("[chat] ui:send-click", {
      activeConversationId,
      hasText: Boolean(text.trim()),
      hasImage: Boolean(selectedImageBase64),
    });
    if (!activeConversationId) {
      toast.error("No hay una conversación activa");
      return;
    }
    if (!text.trim() && !selectedImageBase64) return;

    const pendingText = text.trim();
    const pendingImage = selectedImageBase64;

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

  // === BLOQUE: Tarjetas interactivas ===
  // Envía tarjetas con datos estructurados (Squad invite, Match proposal)
  // para que el receptor pueda interactuar directamente desde el chat.
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

  // === BLOQUE: Checkout de cancha desde tarjeta ===
  // Al hacer clic en "Jugar" desde una tarjeta de propuesta de partido,
  // carga los datos de la cancha para abrir el modal de booking.
  const openChallengeComposer = () => {
    setCounterProposalTarget(null);
    setChallengeDraft((current) => ({
      ...current,
      sport: current.sport || currentUser?.preferred_sports?.[0] || "",
    }));
    setIsChallengeComposerOpen(true);
  };

  const openCounterProposal = (challenge: {
    id: string;
    sport: string;
    modality: string;
    scheduledDate: string;
    scheduledTime: string;
    location?: string;
    challengerId: string;
  }) => {
    setCounterProposalTarget({ id: challenge.id, challengerId: challenge.challengerId });
    setChallengeDraft({
      sport: challenge.sport,
      modality: challenge.modality,
      scheduledDate: challenge.scheduledDate,
      scheduledTime: challenge.scheduledTime,
      location: challenge.location || "",
      message: "",
    });
    setIsChallengeComposerOpen(true);
  };

  const sendChallengeProposal = async () => {
    if (!currentUser || !activeChat || !activeConversationId) return;
    const challengedId = activeChat.current_players.find((id: string) => id !== currentUser.id);
    if (!challengedId) return;
    if (!challengeDraft.sport || !challengeDraft.scheduledDate || !challengeDraft.scheduledTime) {
      toast.error("Completa deporte, fecha y hora");
      return;
    }

    try {
      setIsSavingChallenge(true);
      if (counterProposalTarget) {
        await proposeChallengeChanges({
          challengeId: counterProposalTarget.id,
          challengedId: currentUser.id,
          scheduledDate: challengeDraft.scheduledDate,
          scheduledTime: challengeDraft.scheduledTime,
          location: challengeDraft.location,
        });
        await sendMessage(
          activeConversationId,
          challengeDraft.message.trim() || "Propongo cambiar los detalles del desafío.",
          undefined,
          {
            type: "challenge_counter_proposal",
            challenge_id: counterProposalTarget.id,
            action_user_id: counterProposalTarget.challengerId,
            sport: challengeDraft.sport,
            modality: challengeDraft.modality,
            scheduled_date: challengeDraft.scheduledDate,
            scheduled_time: challengeDraft.scheduledTime,
            location: challengeDraft.location,
          },
        );
        await sendMessage(
          activeConversationId,
          "Se propusieron cambios para el desafío.",
          undefined,
          {
            type: "challenge_response",
            challenge_id: counterProposalTarget.id,
            decision: "counter_proposed",
          },
        );
        setCounterProposalTarget(null);
        setIsChallengeComposerOpen(false);
        toast.success("Contrapropuesta enviada");
        return;
      }

      // El desafío se persiste antes de enviarlo al chat para que la tarjeta siempre
      // represente una propuesta real y pueda ser respondida por el receptor.
      const challenge = await createPlayerChallenge({
        challengerId: currentUser.id,
        challengedId,
        sport: challengeDraft.sport,
        modality: challengeDraft.modality,
        scheduledDate: challengeDraft.scheduledDate,
        scheduledTime: challengeDraft.scheduledTime,
        location: challengeDraft.location,
        message: challengeDraft.message,
      });

      await sendMessage(
        activeConversationId,
        challengeDraft.message.trim() || `Te propongo un desafío de ${challengeDraft.sport}.`,
        undefined,
        {
          type: "challenge_proposal",
          challenge_id: challenge.id,
          challenger_id: currentUser.id,
          challenged_id: challengedId,
          sport: challengeDraft.sport,
          modality: challengeDraft.modality,
          scheduled_date: challengeDraft.scheduledDate,
          scheduled_time: challengeDraft.scheduledTime,
          location: challengeDraft.location,
        },
      );
      setIsChallengeComposerOpen(false);
      setChallengeDraft({
        sport: currentUser.preferred_sports?.[0] || "",
        modality: "amistoso",
        scheduledDate: "",
        scheduledTime: "",
        location: "",
        message: "",
      });
      toast.success("Desafío enviado en la conversación");
    } catch (error) {
      console.error("Error al proponer desafío desde el chat:", error);
      toast.error("No se pudo enviar el desafío");
    } finally {
      setIsSavingChallenge(false);
    }
  };

  const handleRespondChallenge = async (challengeId: string, decision: "accepted" | "rejected") => {
    if (!currentUser || !activeConversationId) return;
    try {
      const isCounterProposalResponse = activeChat?.messages.some(
        (message) =>
          message.metadata?.type === "challenge_counter_proposal" &&
          message.metadata.challenge_id === challengeId &&
          message.metadata.action_user_id === currentUser.id,
      );
      if (isCounterProposalResponse) {
        await respondToChallengeCounterProposal(challengeId, currentUser.id, decision);
      } else {
        await respondToPlayerChallenge(challengeId, currentUser.id, decision);
      }
      setChallengeResponses((current) => ({ ...current, [challengeId]: decision }));
      await sendMessage(
        activeConversationId,
        decision === "accepted"
          ? "Acepté el desafío. Coordinemos los últimos detalles."
          : "No podré aceptar este desafío.",
        undefined,
        { type: "challenge_response", challenge_id: challengeId, decision },
      );
      toast.success(decision === "accepted" ? "Desafío aceptado" : "Desafío rechazado");
    } catch (error) {
      console.error("Error al responder desafío desde el chat:", error);
      toast.error("El desafío ya no está disponible");
    }
  };

  const handlePlayCheckout = async (courtId: string) => {
    try {
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

  // === BLOQUE: Filtrado por búsqueda ===
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
        {/* === BLOQUE: Sidebar de conversaciones === */}
        {/* Barra lateral con buscador, botones de nuevo chat y crear Squad,
            y pestañas para alternar entre Conversaciones y Conexiones. */}
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
          {/* === BLOQUE: Pestañas de navegación === */}
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
            {/* === BLOQUE: Lista de conversaciones === */}
            {sidebarView === "chats" &&
              filteredUserChats.map((c) => {
                const lastMessage = c.messages[c.messages.length - 1];
                const isActive = c.id === activeConversationId;
                const otherPlayerId = c.current_players.find((id) => id !== currentUser.id);
                const otherPlayer = registeredUsers.find((u) => u.id === otherPlayerId);
                const isVerified = otherPlayer?.dni_verificado;

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversation(c.id)}
                    className={`w-full p-4 flex items-center gap-3 transition-colors text-left border-b border-border/50 ${isActive ? "bg-accent/50" : "hover:bg-accent/30"}`}
                  >
                    <div className="relative border border-border rounded-full p-0.5 bg-background shrink-0">
                      {c.avatar && c.avatar.startsWith("http") ? (
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
                        <span className="font-semibold truncate flex items-center gap-1">
                          {c.name}
                          {isVerified && <VerifiedBadge />}
                        </span>
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

            {/* === BLOQUE: Lista de conexiones deportivas === */}
            {sidebarView === "connections" &&
              filteredConnections.map((connection) => {
                const profile =
                  connection.connected_user ||
                  registeredUsers.find((user) => user.id === connection.connected_user_id);
                if (!profile) return null;

                return (
                  <div
                    key={connection.id}
                    className="w-full p-4 flex items-start gap-3 border-b border-border/50 bg-background/20"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="h-11 w-11 rounded-full bg-muted object-cover border border-border"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate flex items-center gap-1">
                        {profile.name}
                        {profile.dni_verificado && <VerifiedBadge />}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {connection.sport || profile.preferred_sports?.[0] || "Deportista"}
                        {connection.compatibility_score
                          ? ` · ${connection.compatibility_score}% compatible`
                          : ""}
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

        {/* === BLOQUE: Área de chat === */}
        {/* Panel principal de mensajería con ChatWindow que maneja
            el historial, el compositor y las tarjetas interactivas. */}
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
            openChallengeComposer={openChallengeComposer}
            challengeResponses={visibleChallengeResponses}
            onRespondChallenge={handleRespondChallenge}
            onOpenCounterProposal={openCounterProposal}
            onJoinSquad={handleJoinSquad}
            isJoiningMap={isJoiningMap}
            joinedMap={joinedMap}
            endRef={endRef}
            fileInputRef={fileInputRef}
            t={t}
          />
        </div>
      </div>

      {/* === BLOQUE: Modal de Booking === */}
      <BookingModal
        court={selectedCourtForBooking}
        isOpen={selectedCourtForBooking !== null}
        onOpenChange={(open) => !open && setSelectedCourtForBooking(null)}
        baseLocation={null}
      />

      {/* === BLOQUE: Modal de nuevo chat === */}
      {/* Overlay con buscador de usuarios registrados para iniciar
          una nueva conversación uno a uno. */}
      {isChallengeComposerOpen && activeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Cerrar formulario de desafío"
            className="absolute inset-0 bg-background/85 backdrop-blur-sm cursor-default"
            onClick={() => setIsChallengeComposerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card">
            <button
              onClick={() => setIsChallengeComposerOpen(false)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full bg-muted grid place-items-center cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-primary/15 grid place-items-center">
                <Swords className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-primary">
                  {counterProposalTarget ? "Proponer cambios" : "Nueva propuesta"}
                </div>
                <h2 className="text-xl font-bold">
                  {counterProposalTarget ? "Ajustar desafío" : `Desafiar a ${activeChat.name}`}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs font-semibold">
                Deporte
                <input
                  value={challengeDraft.sport}
                  onChange={(event) =>
                    setChallengeDraft((current) => ({ ...current, sport: event.target.value }))
                  }
                  placeholder="Ej. Fútbol"
                  disabled={Boolean(counterProposalTarget)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                Modalidad
                <select
                  value={challengeDraft.modality}
                  onChange={(event) =>
                    setChallengeDraft((current) => ({ ...current, modality: event.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  disabled={Boolean(counterProposalTarget)}
                >
                  <option value="amistoso">Amistoso</option>
                  <option value="competitivo">Competitivo</option>
                </select>
              </label>
              <label className="text-xs font-semibold">
                Lugar opcional
                <input
                  value={challengeDraft.location}
                  onChange={(event) =>
                    setChallengeDraft((current) => ({ ...current, location: event.target.value }))
                  }
                  placeholder="Distrito o cancha"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                Fecha
                <input
                  type="date"
                  value={challengeDraft.scheduledDate}
                  onChange={(event) =>
                    setChallengeDraft((current) => ({
                      ...current,
                      scheduledDate: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                Hora
                <input
                  type="time"
                  value={challengeDraft.scheduledTime}
                  onChange={(event) =>
                    setChallengeDraft((current) => ({
                      ...current,
                      scheduledTime: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </label>
              <label className="col-span-2 text-xs font-semibold">
                Mensaje opcional
                <textarea
                  value={challengeDraft.message}
                  maxLength={240}
                  rows={3}
                  onChange={(event) =>
                    setChallengeDraft((current) => ({ ...current, message: event.target.value }))
                  }
                  className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </label>
            </div>
            <button
              onClick={sendChallengeProposal}
              disabled={isSavingChallenge}
              className="mt-5 w-full rounded-xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow cursor-pointer disabled:opacity-50"
            >
              {isSavingChallenge
                ? "Enviando..."
                : counterProposalTarget
                  ? "Enviar contrapropuesta"
                  : "Enviar desafío"}
            </button>
          </div>
        </div>
      )}

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
                      <div className="font-semibold text-sm truncate flex items-center gap-1">
                        {u.name}
                        {u.dni_verificado && <VerifiedBadge />}
                      </div>
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

      {/* === BLOQUE: Modal de creación de Squad === */}
      {/* Overlay con formulario para crear un Squad grupal seleccionando
          miembros de la lista de contactos (followers/following). */}
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
                          <div className="font-semibold text-sm truncate flex items-center gap-1">
                            {u.name}
                            {u.dni_verificado && <VerifiedBadge />}
                          </div>
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

export default Chats;
