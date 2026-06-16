/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// usePublicMatchStore.test.ts — Tests unitarios para el store de matchmaking
// ============================================================

import { vi, describe, it, expect, beforeEach } from "vitest";
import { usePublicMatchStore } from "../usePublicMatchStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";
import { toast } from "sonner";

vi.mock("@/entities/user/useAuth", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/features/notifications/model/useNotificationStore", () => {
  const addNotification = vi.fn();
  return {
    useNotificationStore: {
      getState: vi.fn(() => ({
        addNotification,
      })),
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("usePublicMatchStore", () => {
  const mockUser = {
    id: "user-test-1",
    name: "Edwin Flores",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=edwin",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-iniciar el store con datos limpios
    usePublicMatchStore.setState({
      publicMatches: [
        {
          id: "pm-test-open",
          creatorId: "mock-creator-1",
          creatorName: "Carlos Rodríguez",
          creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
          title: "Fútbol 5vs5",
          sport: "Fútbol",
          level: "Intermedio",
          courtName: "Cancha Sur",
          address: "Av. Sur 123",
          lat: 10,
          lng: 20,
          date: "2026-06-20",
          time: "18:00",
          maxPlayers: 3,
          participants: [
            {
              userId: "mock-creator-1",
              name: "Carlos Rodríguez",
              avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
              joinedAt: new Date().toISOString(),
            },
          ],
          status: "Open",
          createdAt: new Date().toISOString(),
        },
      ],
      reviews: [],
      reports: [],
    });

    // Mock por defecto de autenticación
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: mockUser,
    } as any);
  });

  describe("createMatch", () => {
    it("debe crear un partido correctamente e incluir al creador como participante", () => {
      const matchData = {
        title: "Tenis Dobles",
        sport: "Tenis" as any,
        level: "Avanzado" as any,
        courtName: "Club Tenis",
        address: "Av. Tenis 456",
        lat: 12,
        lng: 22,
        date: "2026-06-25",
        time: "09:00",
        maxPlayers: 4,
      };

      const match = usePublicMatchStore.getState().createMatch(matchData);

      expect(match.id).toBeDefined();
      expect(match.creatorId).toBe(mockUser.id);
      expect(match.participants[0].userId).toBe(mockUser.id);
      expect(usePublicMatchStore.getState().publicMatches.length).toBe(2);
      expect(toast.success).toHaveBeenCalled();
    });

    it("debe lanzar un error si el usuario no está autenticado", () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
      } as any);

      expect(() => {
        usePublicMatchStore.getState().createMatch({} as any);
      }).toThrow("Not authenticated");
    });
  });

  describe("joinMatch", () => {
    it("debe permitir unirse a un partido abierto y notificar al creador", () => {
      usePublicMatchStore.getState().joinMatch("pm-test-open");

      const match = usePublicMatchStore
        .getState()
        .publicMatches.find((m) => m.id === "pm-test-open");
      expect(match?.participants.length).toBe(2);
      expect(match?.participants.some((p) => p.userId === mockUser.id)).toBe(true);
      expect(match?.status).toBe("Open");
      expect(toast.success).toHaveBeenCalled();

      const notificationStoreMock = useNotificationStore.getState() as any;
      expect(notificationStoreMock.addNotification).toHaveBeenCalled();
    });

    it("debe actualizar el estado a 'Full' si se alcanza el máximo de jugadores al unirse", () => {
      // Agregar un participante adicional antes de unirnos
      usePublicMatchStore.setState({
        publicMatches: usePublicMatchStore.getState().publicMatches.map((m) => {
          if (m.id === "pm-test-open") {
            return {
              ...m,
              participants: [
                ...m.participants,
                { userId: "player-2", name: "Player 2", avatarUrl: "", joinedAt: "" },
              ],
            };
          }
          return m;
        }),
      });

      usePublicMatchStore.getState().joinMatch("pm-test-open");

      const match = usePublicMatchStore
        .getState()
        .publicMatches.find((m) => m.id === "pm-test-open");
      expect(match?.participants.length).toBe(3); // Máximo alcanzado
      expect(match?.status).toBe("Full");
    });

    it("debe prevenir unirse si ya se está participando", () => {
      // Añadimos al usuario de prueba primero
      usePublicMatchStore.getState().joinMatch("pm-test-open");
      vi.clearAllMocks();

      // Intentar unirse otra vez
      usePublicMatchStore.getState().joinMatch("pm-test-open");

      expect(toast.info).toHaveBeenCalledWith("Ya estás participando en este partido.");
    });

    it("debe prevenir unirse si el partido ya está lleno", () => {
      // Llenamos el partido
      usePublicMatchStore.setState({
        publicMatches: usePublicMatchStore.getState().publicMatches.map((m) => {
          if (m.id === "pm-test-open") {
            return {
              ...m,
              maxPlayers: 1, // Ya tiene 1 participante (el creador)
              status: "Full",
            };
          }
          return m;
        }),
      });

      usePublicMatchStore.getState().joinMatch("pm-test-open");

      expect(toast.error).toHaveBeenCalledWith("El partido está completo.");
    });
  });

  describe("kickParticipant", () => {
    it("debe permitir al creador expulsar a otro participante", () => {
      // Hacemos que el usuario autenticado sea el creador del partido
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: { id: "mock-creator-1", name: "Carlos" },
      } as any);

      // Agregamos un participante a expulsar
      usePublicMatchStore.setState({
        publicMatches: usePublicMatchStore.getState().publicMatches.map((m) => {
          if (m.id === "pm-test-open") {
            return {
              ...m,
              participants: [
                ...m.participants,
                { userId: "user-to-kick", name: "Expulsado", avatarUrl: "", joinedAt: "" },
              ],
            };
          }
          return m;
        }),
      });

      usePublicMatchStore.getState().kickParticipant("pm-test-open", "user-to-kick");

      const match = usePublicMatchStore
        .getState()
        .publicMatches.find((m) => m.id === "pm-test-open");
      expect(match?.participants.length).toBe(1);
      expect(match?.participants.some((p) => p.userId === "user-to-kick")).toBe(false);
      expect(toast.success).toHaveBeenCalled();
    });

    it("debe prevenir expulsar si el usuario no es el creador", () => {
      usePublicMatchStore.getState().kickParticipant("pm-test-open", "mock-creator-1");
      expect(toast.error).toHaveBeenCalledWith("Solo el creador puede expulsar participantes.");
    });

    it("debe prevenir que el creador se expulse a sí mismo", () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: { id: "mock-creator-1", name: "Carlos" },
      } as any);

      usePublicMatchStore.getState().kickParticipant("pm-test-open", "mock-creator-1");
      expect(toast.error).toHaveBeenCalledWith("No puedes expulsarte a ti mismo.");
    });
  });

  describe("cancelMatch", () => {
    it("debe permitir al creador cancelar el partido", () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: { id: "mock-creator-1" },
      } as any);

      usePublicMatchStore.getState().cancelMatch("pm-test-open");

      const match = usePublicMatchStore
        .getState()
        .publicMatches.find((m) => m.id === "pm-test-open");
      expect(match?.status).toBe("Cancelled");
      expect(toast.success).toHaveBeenCalledWith("Partido cancelado.");
    });
  });

  describe("Valoraciones (reviews)", () => {
    it("debe registrar valoraciones y calcular promedios numéricos correctos", () => {
      const reviewData = {
        targetUserId: "player-target",
        rating: 4,
        comment: "Buen partido",
        matchId: "pm-test-open",
      };

      usePublicMatchStore.getState().submitReview(reviewData);

      expect(usePublicMatchStore.getState().reviews.length).toBe(1);
      expect(usePublicMatchStore.getState().getAverageRating("player-target")).toBe(4);

      // Agregar segunda valoración con 5 estrellas
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: { id: "user-test-2", name: "Otro Revisor" },
      } as any);

      usePublicMatchStore.getState().submitReview({
        ...reviewData,
        rating: 5,
      });

      expect(usePublicMatchStore.getState().reviews.length).toBe(2);
      expect(usePublicMatchStore.getState().getAverageRating("player-target")).toBe(4.5);
    });

    it("debe prevenir valoraciones duplicadas al mismo jugador por el mismo revisor", () => {
      const reviewData = {
        targetUserId: "player-target",
        rating: 4,
        comment: "Buen partido",
      };

      usePublicMatchStore.getState().submitReview(reviewData);
      vi.clearAllMocks();

      usePublicMatchStore.getState().submitReview(reviewData);

      expect(toast.info).toHaveBeenCalledWith("Ya valoraste a este jugador.");
    });

    it("debe devolver 0 si no hay valoraciones para el usuario", () => {
      expect(usePublicMatchStore.getState().getAverageRating("unknown-user")).toBe(0);
    });
  });

  describe("Reportes y moderación", () => {
    it("debe registrar un reporte y notificar a los administradores", () => {
      const reportData = {
        reportedUserId: "user-bad",
        reportedUserName: "User Bad",
        reason: "Spam" as any,
        evidence: "Envió publicidad repetitiva",
      };

      usePublicMatchStore.getState().submitReport(reportData);

      expect(usePublicMatchStore.getState().reports.length).toBe(1);
      expect(usePublicMatchStore.getState().reports[0].status).toBe("PENDING");
      expect(toast.success).toHaveBeenCalled();

      const notificationStoreMock = useNotificationStore.getState() as any;
      expect(notificationStoreMock.addNotification).toHaveBeenCalled();
    });

    it("debe permitir ignorar un reporte pendiente", () => {
      usePublicMatchStore.setState({
        reports: [
          {
            id: "rpt-test-1",
            reporterId: "u1",
            reporterName: "Reporter",
            reportedUserId: "u2",
            reportedUserName: "Reported",
            reason: "Abuso",
            evidence: "Detalles",
            status: "PENDING",
            createdAt: new Date().toISOString(),
          },
        ],
      });

      usePublicMatchStore.getState().ignoreReport("rpt-test-1");

      expect(usePublicMatchStore.getState().reports[0].status).toBe("IGNORED");
      expect(toast.success).toHaveBeenCalledWith("Reporte ignorado.");
    });

    it("debe permitir aplicar una sanción al usuario reportado", () => {
      usePublicMatchStore.setState({
        reports: [
          {
            id: "rpt-test-1",
            reporterId: "u1",
            reporterName: "Reporter",
            reportedUserId: "u2",
            reportedUserName: "Reported",
            reason: "Abuso",
            evidence: "Detalles",
            status: "PENDING",
            createdAt: new Date().toISOString(),
          },
        ],
      });

      usePublicMatchStore.getState().sanctionUser("rpt-test-1");

      expect(usePublicMatchStore.getState().reports[0].status).toBe("SANCTIONED");
      expect(toast.success).toHaveBeenCalledWith("Sanción aplicada al usuario reportado. 🔒");
    });
  });
});
