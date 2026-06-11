import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Clock, Plus, UserX, Star, Trophy, X, ShieldAlert } from "lucide-react";
import { usePublicMatchStore, type PublicMatch } from "@/features/matchmaking/usePublicMatchStore";
import { CreateMatchModal } from "@/features/matchmaking/ui/CreateMatchModal";
import { ReviewModal } from "@/features/matchmaking/ui/ReviewModal";
import { AdminModerationPanel } from "@/features/matchmaking/ui/AdminModerationPanel";
import { ReportModal } from "@/components/ReportModal";
import { useAuthStore } from "@/entities/user/useAuth";

// ─── Types ─────────────────────────────────────────────────────────────────────
type FilterKey = "TODAS" | "OPEN" | "FULL" | "MIS_PARTIDOS";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const SPORT_COLORS: Record<string, string> = {
  Fútbol: "border-l-neon",
  Pádel: "border-l-electric",
  Básquet: "border-l-warning",
  Tenis: "border-l-primary",
  Vóley: "border-l-violet",
  Running: "border-l-electric",
  default: "border-l-primary",
};

const SPORT_EMOJIS: Record<string, string> = {
  Fútbol: "⚽",
  Básquet: "🏀",
  Tenis: "🎾",
  Pádel: "🏓",
  Vóley: "🏐",
  Running: "🏃",
  Rugby: "🏉",
  Natación: "🏊",
  Gimnasio: "💪",
  "Tenis de Mesa": "🏓",
  "Boxeo / MMA": "🥊",
  Ciclismo: "🚴",
};

const STATUS_CONFIG = {
  Open: { label: "Abierto", className: "bg-neon/10 text-neon border-neon/20" },
  Full: { label: "Completo", className: "bg-warning/10 text-warning border-warning/20" },
  Finished: { label: "Finalizado", className: "bg-muted text-muted-foreground border-border" },
  Cancelled: {
    label: "Cancelado",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

// ─── Match Card ────────────────────────────────────────────────────────────────
interface MatchCardProps {
  match: PublicMatch;
  currentUserId: string | undefined;
  onReview: (match: PublicMatch) => void;
  onReport: (match: PublicMatch) => void;
}

function MatchCard({ match, currentUserId, onReview, onReport }: MatchCardProps) {
  const joinMatch = usePublicMatchStore((s) => s.joinMatch);
  const kickParticipant = usePublicMatchStore((s) => s.kickParticipant);
  const cancelMatch = usePublicMatchStore((s) => s.cancelMatch);
  const getAverageRating = usePublicMatchStore((s) => s.getAverageRating);

  const isCreator = currentUserId === match.creatorId;
  const isParticipant = match.participants.some((p) => p.userId === currentUserId);
  const isFull = match.participants.length >= match.maxPlayers;
  const sportColor = SPORT_COLORS[match.sport] ?? SPORT_COLORS.default;
  const statusCfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.Open;
  const avg = getAverageRating(match.creatorId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      layout
      className={`bg-gradient-card border border-border rounded-2xl p-4 hover:ring-glow transition-all border-l-4 ${sportColor} flex flex-col gap-3`}
      id={`match-card-${match.id}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{SPORT_EMOJIS[match.sport] ?? "🏟️"}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{match.title}</p>
            <p className="text-[10px] text-muted-foreground">{match.level}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isCreator && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-bold">
              🎯 Tuyo
            </span>
          )}
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${statusCfg.className}`}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Trophy className="h-3 w-3" />
          {match.courtName}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span className="truncate max-w-[120px]">{match.address}</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(match.date)} {match.time}
        </span>
      </div>

      {/* Participants */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {match.participants.slice(0, 5).map((p) => (
              <div key={p.userId} className="relative group">
                <img
                  src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userId}`}
                  alt={p.name}
                  title={p.name}
                  className="h-7 w-7 rounded-full border-2 border-card bg-muted object-cover"
                />
                {/* Kick button — only for creator, not self */}
                {isCreator && p.userId !== currentUserId && match.status === "Open" && (
                  <button
                    onClick={() => kickParticipant(match.id, p.userId)}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    title={`Expulsar a ${p.name}`}
                    id={`kick-${match.id}-${p.userId}`}
                  >
                    <UserX className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
            {match.participants.length > 5 && (
              <div className="h-7 w-7 rounded-full border-2 border-card bg-muted grid place-items-center text-[10px] font-bold text-muted-foreground">
                +{match.participants.length - 5}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            <Users className="inline h-3 w-3 mr-0.5" />
            {match.participants.length}/{match.maxPlayers}
          </span>
        </div>

        {/* Creator rating */}
        {avg > 0 && (
          <span className="text-xs text-warning flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-warning" />
            {avg}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t border-border/40">
        {/* Join or status chip */}
        {match.status === "Open" &&
          !isCreator &&
          (isParticipant ? (
            <span className="flex-1 py-1.5 rounded-xl bg-neon/10 text-neon border border-neon/20 text-xs font-semibold text-center">
              ✓ Ya inscrito
            </span>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => joinMatch(match.id)}
              disabled={isFull}
              className="flex-1 py-1.5 rounded-xl bg-gradient-neon text-neon-foreground text-xs font-bold hover:shadow-neon transition-shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              id={`join-match-${match.id}`}
            >
              Unirse rápido ⚡
            </motion.button>
          ))}

        {/* Creator: cancel */}
        {isCreator && match.status === "Open" && (
          <button
            onClick={() => cancelMatch(match.id)}
            className="py-1.5 px-3 rounded-xl border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors cursor-pointer flex items-center gap-1"
            id={`cancel-match-${match.id}`}
          >
            <X className="h-3 w-3" /> Cancelar
          </button>
        )}

        {/* Review button */}
        {!isCreator && (
          <button
            onClick={() => onReview(match)}
            className="py-1.5 px-2.5 rounded-xl glass border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer flex items-center gap-1"
            id={`review-match-${match.id}`}
            title="Valorar al creador"
          >
            <Star className="h-3 w-3 text-warning" />
          </button>
        )}

        {/* Report button */}
        {!isCreator && (
          <button
            onClick={() => onReport(match)}
            className="py-1.5 px-2.5 rounded-xl glass border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer flex items-center gap-1"
            id={`report-match-${match.id}`}
            title="Reportar creador"
          >
            <ShieldAlert className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Public Match Board ────────────────────────────────────────────────────────
const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "TODAS", label: "Todos" },
  { key: "OPEN", label: "Abiertos" },
  { key: "FULL", label: "Completos" },
  { key: "MIS_PARTIDOS", label: "Mis partidos" },
];

export function PublicMatchBoard() {
  const currentUser = useAuthStore((s) => s.user);
  const matches = usePublicMatchStore((s) => s.publicMatches);

  const [activeFilter, setActiveFilter] = useState<FilterKey>("TODAS");
  const [createOpen, setCreateOpen] = useState(false);

  // Review state
  const [reviewTarget, setReviewTarget] = useState<{
    userId: string;
    name: string;
    avatar: string;
  } | null>(null);

  // Report state
  const [reportTarget, setReportTarget] = useState<{
    userId: string;
    name: string;
    avatar: string;
  } | null>(null);

  const filtered = matches.filter((m) => {
    if (activeFilter === "OPEN") return m.status === "Open";
    if (activeFilter === "FULL") return m.status === "Full";
    if (activeFilter === "MIS_PARTIDOS") return m.creatorId === currentUser?.id;
    return true;
  });

  const countByFilter = {
    TODAS: matches.length,
    OPEN: matches.filter((m) => m.status === "Open").length,
    FULL: matches.filter((m) => m.status === "Full").length,
    MIS_PARTIDOS: matches.filter((m) => m.creatorId === currentUser?.id).length,
  };

  return (
    <div className="space-y-6" id="public-match-board">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Partidos Públicos</h2>
          <p className="text-sm text-muted-foreground">Únete o crea tu propio partido</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm hover:shadow-glow transition-shadow cursor-pointer"
          id="open-create-match-btn"
        >
          <Plus className="h-4 w-4" />
          Crear Partido
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-border/50 gap-1">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer border-b-2 ${
              activeFilter === key
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            id={`match-filter-${key}`}
          >
            {label}
            {countByFilter[key] > 0 && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-muted-foreground"
                }`}
              >
                {countByFilter[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tactical Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <span className="text-5xl">⚽</span>
          <p className="font-semibold text-foreground">No hay partidos disponibles</p>
          <p className="text-sm">¡Crea el primero y convoca a tus rivales!</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-neon text-neon-foreground text-sm font-bold hover:shadow-neon transition-shadow cursor-pointer"
          >
            Crear partido ahora
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                currentUserId={currentUser?.id}
                onReview={(m) =>
                  setReviewTarget({
                    userId: m.creatorId,
                    name: m.creatorName,
                    avatar: m.creatorAvatar,
                  })
                }
                onReport={(m) =>
                  setReportTarget({
                    userId: m.creatorId,
                    name: m.creatorName,
                    avatar: m.creatorAvatar,
                  })
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Admin Moderation Panel (only visible to admins) */}
      <AdminModerationPanel />

      {/* Modals */}
      <CreateMatchModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          targetUserId={reviewTarget.userId}
          targetUserName={reviewTarget.name}
          targetUserAvatar={reviewTarget.avatar}
        />
      )}

      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reportedUserId={reportTarget.userId}
          reportedUserName={reportTarget.name}
          reportedUserAvatar={reportTarget.avatar}
        />
      )}
    </div>
  );
}
