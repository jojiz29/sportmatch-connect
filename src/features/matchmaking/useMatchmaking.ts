import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import { supabase } from "@/shared/api/supabase";
import { User } from "@/entities/types";
import { useEffect } from "react";
import { toast } from "sonner";
import { secureRandom } from "@/shared/lib/crypto";

export function useMatchmaking(initialData?: User[], onMatch?: (user: User) => void) {
  const queryClient = useQueryClient();

  const {
    data: stack = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matchmaking", "stack"],
    queryFn: () => apiClient.users.getMatches(),
    initialData,
    // Evita refetch inmediato al volver a Matchmaking si ya tenemos candidatos recientes.
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Real-time subscription to new players
  useEffect(() => {
    const channel = supabase
      .channel("public:profiles")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
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
    onSuccess: (data, variables, context) => {
      if (data.action === "like") {
        const isMatch = secureRandom() > 0.4;
        if (isMatch && onMatch && context?.previousStack) {
          const matchedUser = context.previousStack.find((u) => u.id === data.userId);
          if (matchedUser) {
            onMatch(matchedUser);
            return;
          }
        }
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
