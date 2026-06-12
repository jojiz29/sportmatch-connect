// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { useAuthStore } from "@/entities/user/useAuth";
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";
import type { Sport, Level } from "@/entities/types";
import { toast } from "sonner";

// ─── INTERFACES ───────────────────────────────────────────────────────────────

// === PARTICIPANTE DE PARTIDO PÚBLICO ===
export interface PublicMatchParticipant {
  userId: string;
  name: string;
  avatarUrl: string;
  joinedAt: string;
}

// === PARTIDO PÚBLICO ===
// Partido visible para todos los usuarios, con datos de cancha, ubicación,
// participantes y estado (abierto, completo, finalizado o cancelado).
export interface PublicMatch {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  sport: Sport;
  level: Level;
  courtName: string;
  address: string;
  lat: number;
  lng: number;
  date: string;
  time: string;
  maxPlayers: number;
  participants: PublicMatchParticipant[];
  status: "Open" | "Full" | "Finished" | "Cancelled";
  createdAt: string;
}

// === VALORACIÓN DE USUARIO ===
export interface UserReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  targetUserId: string;
  rating: number; // 1-5
  comment: string;
  matchId?: string;
  createdAt: string;
}

// === REPORTE DE USUARIO ===
export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: "Abuso" | "Inapropiado" | "No se presentó" | "Spam" | "Acoso";
  evidence: string;
  status: "PENDING" | "IGNORED" | "SANCTIONED";
  createdAt: string;
}

// === INTERFAZ DEL ESTADO ===
interface MatchesState {
  publicMatches: PublicMatch[];
  reviews: UserReview[];
  reports: UserReport[];

  // Acciones de partidos
  createMatch: (
    data: Omit<
      PublicMatch,
      "id" | "participants" | "status" | "createdAt" | "creatorId" | "creatorName" | "creatorAvatar"
    >,
  ) => PublicMatch;
  joinMatch: (matchId: string) => void;
  kickParticipant: (matchId: string, userId: string) => void;
  cancelMatch: (matchId: string) => void;

  // Acciones de valoraciones
  submitReview: (
    data: Omit<UserReview, "id" | "createdAt" | "reviewerId" | "reviewerName" | "reviewerAvatar">,
  ) => void;
  getAverageRating: (userId: string) => number;

  // Acciones de moderación
  submitReport: (
    data: Omit<UserReport, "id" | "status" | "createdAt" | "reporterId" | "reporterName">,
  ) => void;
  ignoreReport: (reportId: string) => void;
  sanctionUser: (reportId: string) => void;
}

// ─── DATOS SEMILLA ────────────────────────────────────────────────────────────
// Partidos públicos de demostración con diversos deportes y niveles
const SEED_MATCHES: PublicMatch[] = [
  {
    id: "pm-1",
    creatorId: "mock-creator-1",
    creatorName: "Carlos Rodríguez",
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    title: "Fútbol 5vs5 · Cancha Norte",
    sport: "Fútbol",
    level: "Intermedio",
    courtName: "Cancha Sportmatch Norte",
    address: "Av. Universitaria 1200, Lima",
    lat: -12.046374,
    lng: -77.042793,
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "18:00",
    maxPlayers: 10,
    participants: [
      {
        userId: "mock-creator-1",
        name: "Carlos Rodríguez",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "mock-2",
        name: "María Gómez",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
        joinedAt: new Date().toISOString(),
      },
    ],
    status: "Open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pm-2",
    creatorId: "mock-creator-2",
    creatorName: "Andrés Torres",
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=andres",
    title: "Pádel Dobles · Club Racket",
    sport: "Pádel",
    level: "Avanzado",
    courtName: "Club Racket Miraflores",
    address: "Calle Los Olivos 450, Lima",
    lat: -12.121932,
    lng: -77.029617,
    date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    time: "10:00",
    maxPlayers: 4,
    participants: [
      {
        userId: "mock-creator-2",
        name: "Andrés Torres",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=andres",
        joinedAt: new Date().toISOString(),
      },
    ],
    status: "Open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pm-3",
    creatorId: "mock-creator-3",
    creatorName: "Valentina Cruz",
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=valentina",
    title: "Básquet 3x3 · Parque Kennedy",
    sport: "Básquet",
    level: "Principiante",
    courtName: "Cancha Kennedy",
    address: "Parque Kennedy, Miraflores",
    lat: -12.118982,
    lng: -77.031783,
    date: new Date(Date.now() + 259200000).toISOString().split("T")[0],
    time: "16:30",
    maxPlayers: 6,
    participants: [
      {
        userId: "mock-creator-3",
        name: "Valentina Cruz",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=valentina",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "mock-3",
        name: "Diego Sánchez",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=diego",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "mock-4",
        name: "Lucía Pérez",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucia",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "mock-5",
        name: "Roberto Díaz",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=roberto",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "mock-6",
        name: "Camila Ríos",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=camila",
        joinedAt: new Date().toISOString(),
      },
      {
        userId: "mock-7",
        name: "Felipe Castro",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=felipe",
        joinedAt: new Date().toISOString(),
      },
    ],
    status: "Full",
    createdAt: new Date().toISOString(),
  },
];

// Valoraciones de demostración
const SEED_REVIEWS: UserReview[] = [
  {
    id: "rv-1",
    reviewerId: "mock-creator-1",
    reviewerName: "Carlos Rodríguez",
    reviewerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    targetUserId: "mock-creator-2",
    rating: 5,
    comment: "Excelente jugador, muy puntual y deportivo.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "rv-2",
    reviewerId: "mock-2",
    reviewerName: "María Gómez",
    reviewerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    targetUserId: "mock-creator-2",
    rating: 4,
    comment: "Buen nivel, se comunicó bien durante el partido.",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

// Reportes de demostración
const SEED_REPORTS: UserReport[] = [
  {
    id: "rpt-1",
    reporterId: "mock-2",
    reporterName: "María Gómez",
    reportedUserId: "mock-creator-3",
    reportedUserName: "Valentina Cruz",
    reason: "No se presentó",
    evidence: "Reservó el partido y nunca apareció.",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

// ─── STORE ─────────────────────────────────────────────────────────────────────
// Store de matchmaking público con persistencia en localStorage.
// Gestiona creación/unión/cancelación de partidos, valoraciones y reportes.
export const usePublicMatchStore = create<MatchesState>()(
  persist(
    (set, get) => ({
      publicMatches: SEED_MATCHES,
      reviews: SEED_REVIEWS,
      reports: SEED_REPORTS,

      // ── CREAR PARTIDO ────────────────────────────────────────────────────
      // Crea un nuevo partido y toma los datos del usuario desde useAuthStore.
      createMatch: (data) => {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("Not authenticated");

        const newMatch: PublicMatch = {
          ...data,
          id: `pm-${Date.now()}`,
          creatorId: user.id,
          creatorName: user.name,
          creatorAvatar: user.avatar_url,
          participants: [
            {
              userId: user.id,
              name: user.name,
              avatarUrl: user.avatar_url,
              joinedAt: new Date().toISOString(),
            },
          ],
          status: "Open",
          createdAt: new Date().toISOString(),
        };

        set((s) => ({ publicMatches: [newMatch, ...s.publicMatches] }));
        toast.success(`¡Partido "${newMatch.title}" creado exitosamente! ⚽`);
        return newMatch;
      },

      // ── UNIRSE A PARTIDO ─────────────────────────────────────────────────
      // Agrega al usuario actual como participante. Valida duplicados y capacidad máxima.
      // Notifica al creador del partido mediante el store de notificaciones.
      joinMatch: (matchId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const match = get().publicMatches.find((m) => m.id === matchId);
        if (!match) return;

        if (match.participants.some((p) => p.userId === user.id)) {
          toast.info("Ya estás participando en este partido.");
          return;
        }
        if (match.participants.length >= match.maxPlayers) {
          toast.error("El partido está completo.");
          return;
        }

        set((s) => ({
          publicMatches: s.publicMatches.map((m) => {
            if (m.id !== matchId) return m;
            const newParticipants = [
              ...m.participants,
              {
                userId: user.id,
                name: user.name,
                avatarUrl: user.avatar_url,
                joinedAt: new Date().toISOString(),
              },
            ];
            const isFull = newParticipants.length >= m.maxPlayers;
            return {
              ...m,
              participants: newParticipants,
              status: isFull ? "Full" : "Open",
            };
          }),
        }));

        toast.success(`¡Te uniste al partido "${match.title}"! 🎉`);

        // Notifica al creador del partido
        useNotificationStore.getState().addNotification({
          id: `notif-join-${Date.now()}`,
          user_id: match.creatorId,
          type: "MATCH_ALERT",
          title: "Nuevo participante 👥",
          content: `${user.name} se unió a tu partido "${match.title}"`,
          link: "/app/match",
        });
      },

      // ── EXPULSAR PARTICIPANTE ────────────────────────────────────────────
      // Solo el creador del partido puede expulsar. No se permite auto-expulsión.
      kickParticipant: (matchId, userId) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const match = get().publicMatches.find((m) => m.id === matchId);
        if (!match || match.creatorId !== currentUser.id) {
          toast.error("Solo el creador puede expulsar participantes.");
          return;
        }
        if (userId === currentUser.id) {
          toast.error("No puedes expulsarte a ti mismo.");
          return;
        }

        set((s) => ({
          publicMatches: s.publicMatches.map((m) => {
            if (m.id !== matchId) return m;
            const newParticipants = m.participants.filter((p) => p.userId !== userId);
            return { ...m, participants: newParticipants, status: "Open" };
          }),
        }));

        const kicked = match.participants.find((p) => p.userId === userId);
        toast.success(`${kicked?.name ?? "Participante"} fue expulsado del partido.`);
      },

      // ── CANCELAR PARTIDO ─────────────────────────────────────────────────
      // Cambia el estado del partido a "Cancelled". Solo el creador puede cancelar.
      cancelMatch: (matchId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set((s) => ({
          publicMatches: s.publicMatches.map((m) =>
            m.id === matchId && m.creatorId === user.id ? { ...m, status: "Cancelled" } : m,
          ),
        }));
        toast.success("Partido cancelado.");
      },

      // ── VALORACIONES ─────────────────────────────────────────────────────
      // Envía una valoración de 1-5 estrellas a otro usuario.
      // Evita valoraciones duplicadas del mismo revisor hacia el mismo usuario.
      submitReview: (data) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const existing = get().reviews.find(
          (r) => r.reviewerId === user.id && r.targetUserId === data.targetUserId,
        );
        if (existing) {
          toast.info("Ya valoraste a este jugador.");
          return;
        }

        const review: UserReview = {
          ...data,
          id: `rv-${Date.now()}`,
          reviewerId: user.id,
          reviewerName: user.name,
          reviewerAvatar: user.avatar_url,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({ reviews: [review, ...s.reviews] }));
        toast.success("¡Valoración enviada! ⭐");
      },

      // Calcula el promedio de valoraciones de un usuario
      getAverageRating: (userId) => {
        const userReviews = get().reviews.filter((r) => r.targetUserId === userId);
        if (!userReviews.length) return 0;
        const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / userReviews.length) * 10) / 10;
      },

      // ── REPORTES ─────────────────────────────────────────────────────────
      // Envía un reporte contra otro usuario. Notifica al administrador.
      submitReport: (data) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const report: UserReport = {
          ...data,
          id: `rpt-${Date.now()}`,
          reporterId: user.id,
          reporterName: user.name,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };

        set((s) => ({ reports: [report, ...s.reports] }));
        toast.success("Reporte enviado. Un moderador lo revisará pronto. 🛡️");

        // Notifica a los administradores
        useNotificationStore.getState().addNotification({
          id: `notif-report-${Date.now()}`,
          user_id: "ADMIN",
          type: "MATCH_ALERT",
          title: "⚠️ Nuevo reporte recibido",
          content: `${user.name} reportó a ${data.reportedUserName}: "${data.reason}"`,
          link: "/app/admin",
        });
      },

      // Marca un reporte como ignorado
      ignoreReport: (reportId) => {
        set((s) => ({
          reports: s.reports.map((r) => (r.id === reportId ? { ...r, status: "IGNORED" } : r)),
        }));
        toast.success("Reporte ignorado.");
      },

      // Aplica sanción al usuario reportado
      sanctionUser: (reportId) => {
        set((s) => ({
          reports: s.reports.map((r) => (r.id === reportId ? { ...r, status: "SANCTIONED" } : r)),
        }));
        toast.success("Sanción aplicada al usuario reportado. 🔒");
      },
    }),
    {
      name: "sportmatch-public-matches",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);
