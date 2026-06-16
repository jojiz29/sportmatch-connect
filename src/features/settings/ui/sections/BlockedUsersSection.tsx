// ============================================================
// BlockedUsersSection.tsx — Lista de usuarios bloqueados
// Dialog de shadcn con buscador + motivo opcional
// ============================================================

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { UserX, Trash2, Loader2, Search, X } from "lucide-react";
import { useSettingsStore } from "../../model/useSettingsStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { SectionCard } from "./SectionCard";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { supabase } from "@/shared/api/supabase";
import { toast } from "sonner";

interface SearchUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
}

export function BlockedUsersSection() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const { blocks, loadBlocks, blockUser, unblockUser } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocks().finally(() => setLoading(false));
  }, [loadBlocks]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, city")
          .ilike("name", `%${searchQuery}%`)
          .limit(10);
        const results = ((data || []) as SearchUser[]).filter((u) => u.id !== currentUser?.id);
        setSearchResults(results);
      } catch (err) {
        console.error("[blocked] search error", err);
        toast.error(t("settings.blocked.search_error", "Error al buscar usuarios"));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery, currentUser?.id, t]);

  const handleBlock = async () => {
    if (!selectedUser) return;
    try {
      await blockUser(selectedUser.id, blockReason || undefined);
      setSearchQuery("");
      setBlockReason("");
      setSelectedUser(null);
      setShowAddModal(false);
    } catch {
      // toast ya mostrado
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSearchQuery("");
    setBlockReason("");
    setSelectedUser(null);
  };

  return (
    <SectionCard
      title={t("settings.blocked.title", "Usuarios bloqueados")}
      description={t("settings.blocked.subtitle", "Personas que no pueden verte ni contactarte")}
    >
      <Button
        variant="outline"
        onClick={() => setShowAddModal(true)}
        className="w-full border-dashed border-2 min-h-[48px]"
      >
        <UserX className="h-4 w-4 mr-2" />
        {t("settings.blocked.block_button", "Bloquear usuario")}
      </Button>

      {loading ? (
        <div className="flex items-center justify-center p-6" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="text-sm text-muted-foreground p-4 text-center">
          {t("settings.blocked.empty", "No has bloqueado a ningún usuario")}
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((b) => (
            <div
              key={b.blocked_id}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-border/40"
            >
              <img
                src={b.blocked_profile?.avatar_url || ""}
                alt={b.blocked_profile?.name || ""}
                className="h-10 w-10 rounded-full bg-muted object-cover border border-border shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {b.blocked_profile?.name ||
                    t("settings.blocked.unknown_user", "Usuario desconocido")}
                </div>
                {b.reason && (
                  <div className="text-xs text-muted-foreground truncate">{b.reason}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => unblockUser(b.blocked_id)}
                aria-label={t("settings.blocked.unblock_button", "Desbloquear")}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.blocked.block_button", "Bloquear usuario")}</DialogTitle>
            <DialogDescription>
              {t(
                "settings.blocked.dialog_help",
                "Busca a la persona y añade un motivo opcional. No podrá verte ni contactarte.",
              )}
            </DialogDescription>
          </DialogHeader>

          {!selectedUser ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("settings.blocked.search_placeholder", "Buscar por nombre...")}
                  className="pl-9 min-h-[44px]"
                  autoFocus
                />
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto -mx-2">
                {searching ? (
                  <div className="flex items-center justify-center p-4" role="status">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="text-sm text-muted-foreground p-3 text-center">
                    {t("settings.blocked.search_hint", "Escribe al menos 2 letras")}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 text-center">
                    {t("settings.blocked.no_results", "Sin resultados")}
                  </div>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors text-left min-h-[48px]"
                    >
                      <img
                        src={u.avatar_url || ""}
                        alt={u.name || ""}
                        className="h-8 w-8 rounded-full bg-muted object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{u.name}</div>
                        {u.city && (
                          <div className="text-xs text-muted-foreground truncate">{u.city}</div>
                        )}
                      </div>
                      <UserX className="h-4 w-4 text-destructive shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <img
                  src={selectedUser.avatar_url || ""}
                  alt={selectedUser.name || ""}
                  className="h-10 w-10 rounded-full bg-muted object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{selectedUser.name}</div>
                  {selectedUser.city && (
                    <div className="text-xs text-muted-foreground truncate">
                      {selectedUser.city}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                  aria-label={t("common.back", "Atrás")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={t("settings.blocked.reason_label", "Motivo (opcional)")}
                className="min-h-[44px]"
                maxLength={200}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="min-h-[44px]">
              {t("common.cancel", "Cancelar")}
            </Button>
            {selectedUser && (
              <Button
                onClick={handleBlock}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
              >
                <UserX className="h-4 w-4 mr-2" />
                {t("settings.blocked.confirm_block", "Bloquear")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
