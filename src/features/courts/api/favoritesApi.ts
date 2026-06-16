import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";

export const favoritesApi = {
  async toggle(courtId: string): Promise<boolean> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return false;

    const { data, error } = await supabase.rpc("toggle_favorite_court", {
      p_court_id: courtId,
    });

    if (error) {
      console.error("Error toggling favorite:", error);
      return false;
    }

    return data?.favorite ?? false;
  },

  async getIds(): Promise<string[]> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return [];

    const { data, error } = await supabase.rpc("get_favorite_court_ids");

    if (error) {
      console.error("Error fetching favorite IDs:", error);
      return [];
    }

    return (data || []).map((r: { court_id: string }) => r.court_id);
  },

  async isFavorite(courtId: string): Promise<boolean> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return false;

    const { data, error } = await supabase
      .from("favorite_courts")
      .select("court_id")
      .eq("user_id", userId)
      .eq("court_id", courtId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },
};
