// ============================================================
// BlockedUsersSection.tsx — Lista de usuarios bloqueados
// ============================================================

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { UserX, Trash2, Loader2, Search, X } from "lucide-react";
import { useSettingsStore } from "../../model/useSettingsStore";
import { SectionCard } from "./SectionCard";
import { supabase } from "@/shared/api/supabase";

interface SearchUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
}

export function BlockedUsersSection() {
  const { t } = useTranslation();
  const { blocks, loadBlocks, blockUser, unblockUser } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, city")
          .ilike("name", `%${searchQuery}%`)
          .limit(10);
        setSearchResults((data || []) as SearchUser[]);
      } catch (err) {
        console.error("[blocked] search error", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleBlock = async (userId: string) => {
    await blockUser(userId, blockReason || undefined);
    setSearchQuery("");
    setBlockReason("");
    setShowAddModal(false);
  };

  return (
    <SectionCard
      title={t("settings.blocked.title", "Usuarios bloqueados")}
      description={t("settings.blocked.subtitle", "Personas que no pueden verte ni contactarte")}
    >
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border/60 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
      >
        <UserX className="h-4 w-4" />
        {t("settings.blocked.block_button", "Bloquear usuario")}
      </button>

      {blocks.length === 0 ? (
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
                className="h-10 w-10 rounded-full bg-muted object-cover border border-border"
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
              <button
                onClick={() => unblockUser(b.blocked_id)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                title={t("settings.blocked.unblock_button", "Desbloquear")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {t("settings.blocked.block_button", "Bloquear usuario")}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                  setBlockReason("");
                }}
                className="p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("settings.blocked.search_placeholder", "Buscar por nombre...")}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border/60 text-sm"
              />
            </div>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder={t("settings.blocked.reason_label", "Motivo (opcional)")}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm"
            />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <div className="text-sm text-muted-foreground p-3 text-center">
                  {t("settings.blocked.no_results", "Sin resultados")}
                </div>
              ) : (
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleBlock(u.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <img
                      src={u.avatar_url || ""}
                      alt={u.name || ""}
                      className="h-8 w-8 rounded-full bg-muted object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{u.name}</div>
                      {u.city && (
                        <div className="text-xs text-muted-foreground truncate">{u.city}</div>
                      )}
                    </div>
                    <UserX className="h-4 w-4 text-destructive" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
