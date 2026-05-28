import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Post } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

interface FeedState {
  posts: Post[];
  addPost: (post: Post) => void;
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      posts: [
        {
          id: "post-puka-power-sponsor",
          user_id: "user-puka-power",
          user_name: "Puka Power",
          user_avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=PukaPower",
          content: "¡Llegó la hora de la recarga! Con Puka Power, saca tu máximo potencial. Consigue tu Botella Puka Power en la sección de FitCoins. ⚡🔋",
          type: "TEXT",
          created_at: new Date(Date.now() - 3600 * 1000 * 0.5).toISOString(),
          sport: "Pádel",
          media_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
        },
        {
          id: "post-1",
          user_id: "user-fabiola",
          user_name: "Fabiola",
          user_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fabiola",
          content: "¡Listo para el partido de Tenis de mañana en San Borja! ¿Quién se suma a entrenar hoy?",
          type: "TEXT",
          created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
          sport: "Tenis",
        },
        {
          id: "post-2",
          user_id: "user-fabiola",
          user_name: "Fabiola",
          user_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fabiola",
          content: "Completamos el partido de Pádel. ¡Gran juego y excelente nivel!",
          type: "MATCH_RESULT",
          created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), // 1 day ago
          sport: "Pádel",
        }
      ],
      addPost: (post) => {
        set({ posts: [post, ...get().posts] });
      },
    }),
    {
      name: "sportmatch-feed",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
