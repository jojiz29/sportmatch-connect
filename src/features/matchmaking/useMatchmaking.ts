import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import { supabase } from "@/shared/api/supabase";
import { backendApi } from "@/shared/api/backendApi";
import { User } from "@/entities/types";
import { useEffect } from "react";
import { toast } from "sonner";

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
  });

  useEffect(() => {
    const channel = supabase
      .channel("public:profiles")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        toast("Nuevo jugador en tu zona!", { description: "Un usuario acaba de unirse." });
        queryClient.invalidateQueries({ queryKey: ["matchmaking", "stack"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const swipeMutation = useMutation({
    mutationFn: async ({
      userId,
      action,
      sport,
    }: {
      userId: string;
      action: "like" | "pass";
      sport: string;
    }) => {
      const res = await backendApi.matchmaking.swipe(
        userId,
        action === "like" ? "LIKE" : "PASS",
        sport,
      );
      return { userId, action, data: res.data };
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
    onSuccess: (result) => {
      if (result.action === "like") {
        const { mutual_like } = result.data ?? {};

        if (mutual_like && onMatch) {
          const stack = queryClient.getQueryData<User[]>(["matchmaking", "stack"]);
          const matchedUser = stack?.find((u) => u.id === result.userId);
          if (matchedUser) {
            onMatch(matchedUser);
            return;
          }
        }
        toast.success("Like enviado!", { description: "Te avisaremos si hay Match." });
      }
    },
    onError: (_err, _newSwipe, context) => {
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
    swipe: (userId: string, action: "like" | "pass", sport: string) =>
      swipeMutation.mutate({ userId, action, sport }),
  };
}
