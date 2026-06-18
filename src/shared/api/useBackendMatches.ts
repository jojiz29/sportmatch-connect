/**
 * ===================================================================
 * ARCHIVO: src/shared/api/useBackendMatches.ts
 * PROPÓSITO: Hooks de TanStack Query para operaciones CRUD de partidos
 *            contra el backend NestJS.
 * INCLUYE: useBackendMatches() - hook principal con consulta, creación,
 *          unión y abandono de partidos.
 *          useMatchOperations() - hook secundario para actualizar/eliminar.
 * ===================================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/shared/api/backendApi";
import { useAuthStore } from "@/entities/user/useAuth";
import { Match } from "@/entities/types";
import { toast } from "sonner";

/**
 * useBackendMatches(): Hook principal de gestión de partidos
 * ------------------------------------------------------------------
 * Provee:
 *   - matches:      Lista de partidos
 *   - createMatch:  Crear nuevo partido
 *   - joinMatch:    Unirse a un partido existente
 *   - leaveMatch:   Abandonar un partido
 * Todas las mutaciones invalidan "backendMatches" al completarse.
 */
export function useBackendMatches() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const token = user?.id;

  const matchesQuery = useQuery({
    queryKey: ["backendMatches"],
    queryFn: async () => {
      const { data, error } = await backendApi.matches.getAll();
      if (error) throw new Error(error);
      return data as Match[];
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: async (match: {
      title: string;
      sport: string;
      court_id?: string;
      date: string;
      time: string;
      max_players: number;
      required_level: string;
    }) => {
      if (!token) throw new Error("No authenticated");
      const { data, error } = await backendApi.matches.create(token, match);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendMatches"] });
      toast.success("Partido creado", { description: "Tu partido está disponible." });
    },
    onError: (err: Error) => {
      toast.error("Error al crear partido", { description: err.message });
    },
  });

  const joinMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      if (!token) throw new Error("No authenticated");
      const { data, error } = await backendApi.matches.join(token, matchId);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendMatches"] });
      toast.success("Te uniste al partido", { description: "¡Nos vemos en la cancha!" });
    },
    onError: (err: Error) => {
      toast.error("Error al unirse", { description: err.message });
    },
  });

  const leaveMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      if (!token) throw new Error("No authenticated");
      const { data, error } = await backendApi.matches.leave(token, matchId);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendMatches"] });
      toast.info("Abandonaste el partido");
    },
    onError: (err: Error) => {
      toast.error("Error al abandonar", { description: err.message });
    },
  });

  return {
    matches: matchesQuery.data ?? [],
    isLoading: matchesQuery.isLoading,
    error: matchesQuery.error,
    createMatch: createMatchMutation.mutate,
    joinMatch: joinMatchMutation.mutate,
    leaveMatch: leaveMatchMutation.mutate,
    isCreating: createMatchMutation.isPending,
    isJoining: joinMatchMutation.isPending,
    isLeaving: leaveMatchMutation.isPending,
  };
}

/**
 * useMatchOperations(): Hook para operaciones de actualización/eliminación
 */
export function useMatchOperations() {
  const queryClient = useQueryClient();

  const updateMatchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Match> }) => {
      const { data: result, error } = await backendApi.matches.update("", id, data);
      if (error) throw new Error(error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendMatches"] });
    },
  });

  const deleteMatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await backendApi.matches.delete("", id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendMatches"] });
      toast.success("Partido eliminado");
    },
  });

  return {
    updateMatch: updateMatchMutation.mutate,
    deleteMatch: deleteMatchMutation.mutate,
    isUpdating: updateMatchMutation.isPending,
    isDeleting: deleteMatchMutation.isPending,
  };
}
