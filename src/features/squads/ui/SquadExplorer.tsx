// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
import React, { useState, useEffect } from "react";
import {
  getSquads,
  joinSquad,
  leaveSquad,
  isMember,
  createSquad,
  getSquadMembers,
} from "@/shared/api/squadService";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { Squad, User, Court } from "@/entities/types";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Loader2,
  Check,
  Zap,
  ArrowLeft,
  MessageSquare,
  Calendar,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useChatStore } from "@/features/chat/useChatStore";
import { createNotification } from "@/shared/api/notificationService";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { BookingModal } from "@/components/BookingModal";

// === BLOQUE: COMPONENTE PRINCIPAL ===
// Explorador de Squads: lista clubs, permite unirse/crear con UI optimista,
// incluye dashboard de squad con chat grupal, invitaciones y reserva colectiva.
export function SquadExplorer() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});

  // Estado del dashboard del squad seleccionado.
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [squadMembers, setSquadMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);

  // Estado del modal de invitación.
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteSearch, setInviteSearch] = useState<string>("");
  const [allSystemUsers, setAllSystemUsers] = useState<User[]>([]);

  // Estado de reserva colectiva.
  const [squadCourts, setSquadCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState<boolean>(false);
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);

  // Estado del formulario de creación.
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // === BLOQUE: CARGA INICIAL DE SQUADS ===
  // Obtiene la lista de squads y verifica membresías en paralelo.
  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    async function loadSquads() {
      try {
        setLoading(true);
        const data = await getSquads();
        if (active) {
          setSquads(data);
          const membershipMap: Record<string, boolean> = {};
          await Promise.all(
            data.map(async (squad) => {
              if (!currentUser) return;
              const status = await isMember(squad.id, currentUser.id);
              membershipMap[squad.id] = status;
            }),
          );
          if (active) setMemberships(membershipMap);
        }
      } catch (err) {
        console.error("Failed to load squads:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSquads();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // === BLOQUE: CARGA DE MIEMBROS DEL SQUAD SELECCIONADO ===
  useEffect(() => {
    if (!selectedSquad) {
      setSquadMembers([]);
      return;
    }
    let active = true;
    async function fetchMembers() {
      try {
        setLoadingMembers(true);
        if (!selectedSquad) return;
        const list = await getSquadMembers(selectedSquad.id);
        if (active) setSquadMembers(list);
      } catch (err) {
        console.error("Error loading squad members:", err);
      } finally {
        if (active) setLoadingMembers(false);
      }
    }
    fetchMembers();
    return () => {
      active = false;
    };
  }, [selectedSquad]);

  // === BLOQUE: CARGA DE USUARIOS Y CANCHAS PARA INVITACIÓN/RESERVA ===
  useEffect(() => {
    if (!currentUser) return;
    apiClient.users
      .getMatches()
      .then((users) => setAllSystemUsers(users))
      .catch((err) => console.error("Error fetching match users:", err));
    setLoadingCourts(true);
    backendApi.courts
      .getAll()
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          setSquadCourts(res.data);
        } else {
          apiClient.courts
            .getAll()
            .then((list) => setSquadCourts(list))
            .catch((err) => console.error("Error fetching courts:", err));
        }
      })
      .catch(() => {
        apiClient.courts
          .getAll()
          .then((list) => setSquadCourts(list))
          .catch((err) => console.error("Error fetching courts:", err));
      })
      .finally(() => setLoadingCourts(false));
  }, [currentUser]);

  // === BLOQUE: REALTIME — NUEVOS SQUADS EN VIVO ===
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel(`squads-realtime-${currentUser.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "squads" }, (payload) => {
        const newRow = payload.new as {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          creator_id: string;
          avatar_url: string | null;
        };
        if (newRow.creator_id === currentUser.id) return;
        const newSquad: Squad = {
          id: newRow.id,
          name: newRow.name,
          description: newRow.description,
          created_at: newRow.created_at,
          creator_id: newRow.creator_id,
          avatar_url: newRow.avatar_url,
          members_count: 1,
        };
        setSquads((prev) => {
          if (prev.some((s) => s.id === newSquad.id)) return prev;
          return [newSquad, ...prev];
        });
        toast(`Nuevo Squad disponible: ${newSquad.name}`, { description: "¡Puedes unirte ahora!" });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // === BLOQUE: MANEJADOR DE UNIRSE/SALIR (OPTIMISTIC UI) ===
  const handleToggleJoin = async (squadId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    if (!currentUser) return;
    const isCurrentlyMember = memberships[squadId];

    // Actualización optimista inmediata.
    setMemberships((prev) => ({ ...prev, [squadId]: !isCurrentlyMember }));
    setSquads((prev) =>
      prev.map((s) =>
        s.id === squadId
          ? {
              ...s,
              members_count: isCurrentlyMember
                ? Math.max(0, (s.members_count ?? 1) - 1)
                : (s.members_count ?? 0) + 1,
            }
          : s,
      ),
    );

    try {
      if (isCurrentlyMember) {
        await leaveSquad(squadId, currentUser.id);
        toast.success("Has salido del Squad");
      } else {
        await joinSquad(squadId, currentUser.id);
        toast.success("¡Te has unido al Squad!");
      }
    } catch (error) {
      // Rollback en caso de error.
      setMemberships((prev) => ({ ...prev, [squadId]: isCurrentlyMember }));
      setSquads((prev) =>
        prev.map((s) =>
          s.id === squadId
            ? {
                ...s,
                members_count: isCurrentlyMember
                  ? (s.members_count ?? 0) + 1
                  : Math.max(0, (s.members_count ?? 1) - 1),
              }
            : s,
        ),
      );
      console.error("Squad toggle failed:", error);
      toast.error("Error al procesar la solicitud de membresía");
    }
  };

  // === BLOQUE: CREACIÓN DE SQUAD ===
  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !name.trim()) return;
    try {
      setSubmitting(true);
      const newSquad = await createSquad(name, description, currentUser.id);
      setSquads((prev) => [newSquad, ...prev]);
      setMemberships((prev) => ({ ...prev, [newSquad.id]: true }));
      setName("");
      setDescription("");
      setShowCreateForm(false);
      toast.success(`¡Squad "${newSquad.name}" creado con éxito!`);
    } catch (err) {
      console.error("Failed to create squad:", err);
      toast.error("Error al crear el Squad");
    } finally {
      setSubmitting(false);
    }
  };

  // === BLOQUE: APERTURA DE CHAT GRUPAL ===
  const handleOpenChat = async () => {
    if (!currentUser || !selectedSquad) return;
    const chatId = `chat_squad_${selectedSquad.id}`;
    const chatStore = useChatStore.getState();
    const existing = chatStore.chats.find((c) => c.id === chatId);
    if (!existing) {
      chatStore.chats.push({
        id: chatId,
        name: selectedSquad.name,
        avatar: "👥",
        current_players: [currentUser.id, ...squadMembers.map((m) => m.id)],
        messages: [
          {
            id: `msg_system_${Date.now()}`,
            sender_id: "system",
            text: `Chat grupal iniciado para el Squad "${selectedSquad.name}".`,
            created_at: new Date().toISOString(),
          },
        ],
        unread: 0,
      });
    }
    chatStore.setActiveConversation(chatId);
    navigate({ to: "/app/chat" });
  };

  // === BLOQUE: INVITACIÓN A USUARIO ===
  const handleInviteUser = async (user: User) => {
    if (!selectedSquad || !currentUser) return;
    try {
      await joinSquad(selectedSquad.id, user.id);
      await createNotification(
        user.id,
        "SQUAD_INVITE",
        `Invitación de Squad`,
        `${currentUser.name} te ha invitado a unirte a su Squad "${selectedSquad.name}".`,
        `/app/chat`,
      );
      toast.success(`Invitación enviada con éxito a ${user.name}`);
      const list = await getSquadMembers(selectedSquad.id);
      setSquadMembers(list);
    } catch (err) {
      console.error("Failed to invite user:", err);
      toast.error("Error al enviar la invitación.");
    }
  };

  if (!currentUser) return null;

  // === BLOQUE: DASHBOARD DEL SQUAD SELECCIONADO ===
  if (selectedSquad) {
    const isUserMember = memberships[selectedSquad.id] || false;
    const filteredUsersToInvite = allSystemUsers.filter(
      (u) =>
        u.id !== currentUser.id &&
        !squadMembers.some((m) => m.id === u.id) &&
        u.name.toLowerCase().includes(inviteSearch.toLowerCase()),
    );

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Cabecera del squad */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setSelectedSquad(null)}
              className="p-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/80 transition-colors border border-border"
              title="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <img
              src={selectedSquad.avatar_url || "https://api.dicebear.com/7.x/identicon/svg"}
              alt=""
              className="h-16 w-16 rounded-2xl bg-card border border-border p-1 object-cover"
            />
            <div>
              <h2 className="text-xl font-bold">{selectedSquad.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedSquad.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleJoin(selectedSquad.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isUserMember
                  ? "bg-accent text-accent-foreground border-border hover:bg-accent/80"
                  : "bg-gradient-neon text-neon-foreground shadow-neon border-transparent hover:scale-105"
              }`}
            >
              {isUserMember ? "Salir del Squad" : "Unirse al Squad"}
            </button>
            {isUserMember && (
              <button
                onClick={handleOpenChat}
                className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold hover:scale-105 transition-transform flex items-center gap-1.5 shadow-glow"
              >
                <MessageSquare className="h-4 w-4" /> Chat Grupal
              </button>
            )}
          </div>
        </div>

        {/* Grid del dashboard */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Columna de miembros */}
          <div className="md:col-span-1 bg-gradient-card border border-border rounded-3xl p-5 shadow-card space-y-4 flex flex-col h-[500px]">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Miembros ({squadMembers.length})
              </h3>
              {isUserMember && (
                <button
                  onClick={() => {
                    setInviteSearch("");
                    setIsInviteModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neon text-neon-foreground text-[10px] font-bold shadow-neon hover:scale-105 transition-transform"
                >
                  Invitar
                </button>
              )}
            </div>
            {loadingMembers ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-electric" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {squadMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-background/40 border border-border/40"
                  >
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="h-8 w-8 rounded-full bg-muted object-cover border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">{member.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {member.city || "Lima, PE"}
                      </div>
                    </div>
                    {member.id === selectedSquad.creator_id && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase tracking-wider shrink-0">
                        Fundador
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna de reserva colectiva */}
          <div className="md:col-span-2 bg-gradient-card border border-border rounded-3xl p-5 shadow-card space-y-4 flex flex-col h-[500px]">
            <div className="pb-2 border-b border-border/50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-electric" /> Reserva Colectiva (Dividir Costo)
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Al reservar desde este panel, el costo se dividirá automáticamente en partes iguales
                entre todos los miembros activos del Squad.
              </p>
            </div>
            {loadingCourts ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-electric" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {squadCourts.slice(0, 8).map((court) => {
                  const bookingMembersCount = squadMembers.length || 1;
                  const priceSplit = (court.price_per_hour + 3) / bookingMembersCount;
                  return (
                    <div
                      key={court.id}
                      className="p-4 bg-background/40 border border-border/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex gap-3">
                        <img
                          src={court.image_url}
                          alt={court.name}
                          className="h-14 w-20 rounded-xl object-cover border border-border"
                        />
                        <div>
                          <h4 className="font-semibold text-xs text-foreground leading-snug">
                            {court.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {court.sport} · {court.address}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              Cancha: S/ {court.price_per_hour}/h
                            </span>
                            <span className="text-[10px] text-neon font-bold">
                              Tu parte: S/ {Math.ceil(priceSplit)} FC
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCourtForBooking(court)}
                        disabled={!isUserMember}
                        className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold hover:shadow-glow transition-all shrink-0 w-full sm:w-auto text-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                      >
                        Reserva Colectiva
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal de invitación */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsInviteModalOpen(false)}
            />
            <div className="relative w-full max-w-md bg-gradient-card border border-border rounded-3xl p-6 shadow-card overflow-hidden flex flex-col max-h-[80vh] z-10 animate-scale-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Invitar al Squad</h3>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-muted grid place-items-center hover:bg-accent transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar deportistas..."
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
                {filteredUsersToInvite.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-10 text-center">
                    No se encontraron deportistas disponibles.
                  </div>
                ) : (
                  filteredUsersToInvite.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl border border-border/40 hover:bg-accent/40 flex items-center justify-between gap-3 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatar_url}
                          alt={u.name}
                          className="h-9 w-9 rounded-full bg-muted object-cover border border-border"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs truncate">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {u.bio || "Deportista"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInviteUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-neon text-neon-foreground text-[10px] font-bold shadow-neon hover:scale-105 transition-transform"
                      >
                        Invitar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <BookingModal
          court={selectedCourtForBooking}
          isOpen={selectedCourtForBooking !== null}
          onOpenChange={(open) => !open && setSelectedCourtForBooking(null)}
          baseLocation={null}
          squadForGroupBooking={selectedSquad}
        />
      </div>
    );
  }

  // === BLOQUE: VISTA DE EXPLORACIÓN (LISTA DE SQUADS) ===
  return (
    <div className="space-y-6">
      {/* Formulario de creación de squad */}
      <div className="bg-gradient-card border border-border rounded-3xl p-5 shadow-card">
        {!showCreateForm ? (
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-sm">¿Quieres fundar tu propio club?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crea un Squad e invita a tus rivales.
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              id="create-squad-btn"
            >
              <Plus className="h-4 w-4" /> Nuevo Squad
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateSquad} className="space-y-4">
            <h3 className="font-semibold text-sm">Nuevo Squad</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Real Padel Club Surco"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  id="squad-name-input"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe la comunidad, deportes y reglas..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none h-16 resize-none"
                  id="squad-desc-input"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-2 rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
                id="squad-submit-btn"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Crear Squad
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Indicador en vivo */}
      <div className="flex items-center gap-2 text-xs text-electric font-semibold mb-2">
        <Zap className="h-3 w-3 animate-pulse" />
        <span>En vivo — Nuevos squads aparecen al instante</span>
      </div>

      {/* Lista de squads */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-electric" />
          <span>Buscando squads recomendados...</span>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4" id="squads-list">
          <AnimatePresence>
            {squads.map((squad) => {
              const joined = memberships[squad.id] || false;
              return (
                <motion.div
                  key={squad.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedSquad(squad)}
                  className="bg-gradient-card border border-border rounded-3xl p-5 shadow-card hover:ring-glow transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex gap-3">
                      <img
                        src={squad.avatar_url || "https://api.dicebear.com/7.x/identicon/svg"}
                        alt=""
                        className="h-12 w-12 rounded-xl bg-card border border-border p-1 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate group-hover:text-neon transition-colors">
                          {squad.name}
                        </h4>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          <span className="squad-members-count">
                            {squad.members_count || 0} miembros
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                      {squad.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center">
                    <span className="text-[10px] text-electric font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver Panel →
                    </span>
                    <button
                      onClick={(e) => handleToggleJoin(squad.id, e)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        joined
                          ? "bg-accent text-accent-foreground border border-border hover:bg-accent/85"
                          : "bg-gradient-neon text-neon-foreground shadow-neon hover:scale-105"
                      }`}
                      id={`join-btn-${squad.id}`}
                    >
                      {joined ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Miembro
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Unirme
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
export default SquadExplorer;
