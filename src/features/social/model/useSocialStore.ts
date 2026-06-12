// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

// === BLOQUE: RELACIÓN DE SEGUIDORES ===
// Representa que un usuario (followerId) sigue a otro (followingId).
export interface FollowRelationship {
  followerId: string;
  followingId: string;
}

// === BLOQUE: INTERFAZ DEL ESTADO ===
interface SocialState {
  relationships: FollowRelationship[];
  follow: (followerId: string, followingId: string) => void;
  unfollow: (followerId: string, followingId: string) => void;
  isFollowing: (followerId: string, followingId: string) => boolean;
  getFollowStats: (userId: string) => { followersCount: number; followingCount: number };
}

// === BLOQUE: STORE SOCIAL ===
// Gestiona las relaciones de seguimiento entre usuarios (follow/unfollow).
// Persistido en localStorage bajo "sportmatch-social".
export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      relationships: [],

      // Sigue a otro usuario: valida que no sea auto-seguimiento y evita duplicados
      follow: (followerId, followingId) => {
        if (followerId === followingId) {
          throw new Error("Self-following is not allowed.");
        }
        const current = get().relationships;
        const exists = current.some(
          (r) => r.followerId === followerId && r.followingId === followingId,
        );
        if (!exists) {
          set({
            relationships: [...current, { followerId, followingId }],
          });
        }
      },

      // Deja de seguir a un usuario
      unfollow: (followerId, followingId) => {
        const current = get().relationships;
        set({
          relationships: current.filter(
            (r) => !(r.followerId === followerId && r.followingId === followingId),
          ),
        });
      },

      // Consulta si un usuario sigue a otro
      isFollowing: (followerId, followingId) => {
        return get().relationships.some(
          (r) => r.followerId === followerId && r.followingId === followingId,
        );
      },

      // Obtiene las estadísticas de seguidores de un usuario
      getFollowStats: (userId) => {
        const current = get().relationships;
        const followersCount = current.filter((r) => r.followingId === userId).length;
        const followingCount = current.filter((r) => r.followerId === userId).length;
        return { followersCount, followingCount };
      },
    }),
    {
      name: "sportmatch-social",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);
