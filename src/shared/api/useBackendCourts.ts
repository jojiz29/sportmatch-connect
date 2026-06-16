/**
 * ===================================================================
 * ARCHIVO: src/shared/api/useBackendCourts.ts
 * PROPÓSITO: Hooks de TanStack Query para operaciones CRUD de canchas
 *            contra el backend NestJS.
 * INCLUYE: Consulta de canchas, creación, actualización y reseñas.
 * ===================================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/shared/api/backendApi";
import { Court } from "@/entities/types";
import { toast } from "sonner";

/**
 * useGetCourtByIdQuery(): Hook para obtener una cancha por ID
 */
export function useGetCourtByIdQuery(id: string) {
  return useQuery({
    queryKey: ["backendCourt", id],
    queryFn: async () => {
      const { data, error } = await backendApi.courts.getById(id);
      if (error) throw new Error(error);
      return data as Court;
    },
  });
}

/**
 * useBackendCourts(): Hook principal de gestión de canchas
 * ------------------------------------------------------------------
 * Provee:
 *   - courts:      Lista de canchas (datos)
 *   - createCourt: Mutación para crear cancha
 *   - updateCourt: Mutación para actualizar cancha
 *   - addReview:   Mutación para agregar reseña
 * Cada mutación invalida la query "backendCourts" al completarse
 * para refrescar automáticamente la lista.
 */
export function useBackendCourts() {
  const queryClient = useQueryClient();

  const courtsQuery = useQuery({
    queryKey: ["backendCourts"],
    queryFn: async () => {
      const { data, error } = await backendApi.courts.getAll();
      if (error) throw new Error(error);
      return data as Court[];
    },
  });

  const createCourtMutation = useMutation({
    mutationFn: async (court: {
      name: string;
      sport: string;
      price_per_hour: number;
      lat: number;
      lng: number;
      address?: string;
      max_players?: number;
      operating_hours?: string[];
      amenities?: string[];
    }) => {
      const { data, error } = await backendApi.courts.create("", court);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendCourts"] });
      toast.success("Cancha creada", { description: "La cancha está disponible para reservas." });
    },
    onError: (err: Error) => {
      toast.error("Error al crear cancha", { description: err.message });
    },
  });

  const updateCourtMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Court> }) => {
      const { data: result, error } = await backendApi.courts.update(
        "",
        id,
        data as Parameters<typeof backendApi.courts.update>[2],
      );
      if (error) throw new Error(error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendCourts"] });
      toast.success("Cancha actualizada");
    },
    onError: (err: Error) => {
      toast.error("Error al actualizar", { description: err.message });
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: async ({
      courtId,
      review,
    }: {
      courtId: string;
      review: { rating: number; comment?: string };
    }) => {
      const { data, error } = await backendApi.courts.addReview("", courtId, review);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendCourts"] });
      toast.success("Reseña agregada", { description: "Gracias por tu opinión." });
    },
    onError: (err: Error) => {
      toast.error("Error al agregar reseña", { description: err.message });
    },
  });

  return {
    courts: courtsQuery.data ?? [],
    isLoading: courtsQuery.isLoading,
    error: courtsQuery.error,
    createCourt: createCourtMutation.mutate,
    updateCourt: updateCourtMutation.mutate,
    addReview: addReviewMutation.mutate,
    isCreating: createCourtMutation.isPending,
    isUpdating: updateCourtMutation.isPending,
    isAddingReview: addReviewMutation.isPending,
  };
}
