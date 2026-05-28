import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Squad, SquadMember } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

interface SquadState {
  squads: Squad[];
  memberships: SquadMember[];
  createSquad: (squad: Squad) => void;
  joinSquad: (squadId: string, userId: string) => void;
  leaveSquad: (squadId: string, userId: string) => void;
  isMember: (squadId: string, userId: string) => boolean;
  getMembersCount: (squadId: string) => number;
}

export const useSquadStore = create<SquadState>()(
  persist(
    (set, get) => ({
      squads: [
        {
          id: "squad-1",
          name: "Club de Tenis Lima",
          description: "Grupo oficial de entusiastas del tenis en Lima. Organizamos torneos y partidos semanales.",
          created_at: new Date(Date.now() - 3600 * 1000 * 24 * 30).toISOString(),
          creator_id: "user-fabiola",
          avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=TennisLima",
        },
        {
          id: "squad-2",
          name: "Pádel Lovers Surco",
          description: "Comunidad enfocada en pádel. Todos los niveles son bienvenidos. ¡Sumate!",
          created_at: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
          creator_id: "user-fabiola",
          avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=PadelSurco",
        }
      ],
      memberships: [
        { squad_id: "squad-1", user_id: "user-fabiola", joined_at: new Date().toISOString() },
        { squad_id: "squad-2", user_id: "user-fabiola", joined_at: new Date().toISOString() },
      ],
      createSquad: (squad) => {
        set({
          squads: [...get().squads, squad],
          memberships: [
            ...get().memberships,
            { squad_id: squad.id, user_id: squad.creator_id, joined_at: new Date().toISOString() }
          ]
        });
      },
      joinSquad: (squadId, userId) => {
        const current = get().memberships;
        const exists = current.some(m => m.squad_id === squadId && m.user_id === userId);
        if (!exists) {
          set({
            memberships: [...current, { squad_id: squadId, user_id: userId, joined_at: new Date().toISOString() }]
          });
        }
      },
      leaveSquad: (squadId, userId) => {
        set({
          memberships: get().memberships.filter(m => !(m.squad_id === squadId && m.user_id === userId))
        });
      },
      isMember: (squadId, userId) => {
        return get().memberships.some(m => m.squad_id === squadId && m.user_id === userId);
      },
      getMembersCount: (squadId) => {
        return get().memberships.filter(m => m.squad_id === squadId).length;
      },
    }),
    {
      name: "sportmatch-squads",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
