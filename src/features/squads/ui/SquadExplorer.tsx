import React, { useState, useEffect } from "react";
import { getSquads, joinSquad, leaveSquad, isMember, createSquad } from "@/shared/api/squadService";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { Squad } from "@/entities/types";
import { toast } from "sonner";
import { Plus, Users, Loader2, Check, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SquadExplorer component.
 * Lists clubs/squads, handles joining/leaving with optimistic UI updates, and provides a create squad form.
 */
export function SquadExplorer() {
  const currentUser = useAuthStore((state) => state.user);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});

  // Create squad form states
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    let active = true;
    async function loadSquads() {
      try {
        setLoading(true);
        const data = await getSquads();
        if (active) {
          setSquads(data);

          // Check memberships in parallel
          const membershipMap: Record<string, boolean> = {};
          await Promise.all(
            data.map(async (squad) => {
              const status = await isMember(squad.id, userId);
              membershipMap[squad.id] = status;
            }),
          );
          if (active) {
            setMemberships(membershipMap);
          }
        }
      } catch (err) {
        console.error("Failed to load squads:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadSquads();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // ── Realtime: broadcast new squads created by other users ────────────────
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

        // Skip squads we just created — handleCreateSquad already added them
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

        toast(`Nuevo Squad disponible: ${newSquad.name}`, {
          description: "¡Puedes unirte ahora!",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleToggleJoin = async (squadId: string) => {
    if (!currentUser) return;
    const isCurrentlyMember = memberships[squadId];

    // 1. Optimistic UI Updates
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

    // 2. Perform background request
    try {
      if (isCurrentlyMember) {
        await leaveSquad(squadId, currentUser.id);
        toast.success("Has salido del Squad");
      } else {
        await joinSquad(squadId, currentUser.id);
        toast.success("¡Te has unido al Squad!");
      }
    } catch (error) {
      // 3. Rollback on failure
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

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Create Squad Form Trigger & Card */}
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-transform"
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

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-electric font-semibold mb-2">
        <Zap className="h-3 w-3 animate-pulse" />
        <span>En vivo — Nuevos squads aparecen al instante</span>
      </div>

      {/* Discover Squads List */}
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
                  className="bg-gradient-card border border-border rounded-3xl p-5 shadow-card hover:ring-glow transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-3">
                      <img
                        src={squad.avatar_url || "https://api.dicebear.com/7.x/identicon/svg"}
                        alt=""
                        className="h-12 w-12 rounded-xl bg-card border border-border p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{squad.name}</h4>
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

                  <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
                    <button
                      onClick={() => handleToggleJoin(squad.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
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
