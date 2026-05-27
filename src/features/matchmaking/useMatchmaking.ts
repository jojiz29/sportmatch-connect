import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import { supabase } from "@/shared/api/supabase";
import { User } from "@/entities/types";
import { useEffect } from "react";
import { toast } from "sonner";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export function useMatchmaking(initialData?: User[]) {
  const queryClient = useQueryClient();

  const {
    data: stack = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matchmaking", "stack"],
    queryFn: () => apiClient.users.getMatches(),
    initialData,
  });

  // Suscripción Real-time
  useEffect(() => {
    if (USE_MOCKS) return; // En mock mode no activamos webSockets

    const channel = supabase
      .channel("public:users")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "users" }, () => {
        toast("¡Nuevo jugador en tu zona!", { description: "Un usuario acaba de unirse." });
        queryClient.invalidateQueries({ queryKey: ["matchmaking", "stack"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const swipeMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "like" | "pass" }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { userId, action };
    },
    onMutate: async (newSwipe) => {
      await queryClient.cancelQueries({ queryKey: ["matchmaking", "stack"] });
      const previousStack = queryClient.getQueryData<User[]>(["matchmaking", "stack"]);

      if (previousStack) {
        queryClient.setQueryData<User[]>(["matchmaking", "stack"], (old) =>
          old?.filter((u) => u.id !== newSwipe.userId),
        );
      }
      return { previousStack };
    },
    onSuccess: (data) => {
      if (data.action === "like") {
        toast.success("¡Like enviado!", { description: "Te avisaremos si hay Match." });
      }
    },
    onError: (err, newSwipe, context) => {
      toast.error("Error al registrar swipe. Intenta de nuevo.");
      if (context?.previousStack) {
        queryClient.setQueryData(["matchmaking", "stack"], context.previousStack);
      }
    },
  });

  return {
    stack,
    isLoading,
    error,
    swipe: (userId: string, action: "like" | "pass") => swipeMutation.mutate({ userId, action }),
  };
}
