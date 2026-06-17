// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "@/shared/api/supabase";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { getFollowStats } from "@/shared/api/socialService";

// === BLOQUE: HELPER FUNCTIONS FOR PROFILE UPDATE ===
// Se excluyen columnas de solo lectura o protegidas por triggers (trust_score, fitcoins_balance, user_role, is_admin)
// para evitar que el payload de UPDATE cause excepciones de integridad o RLS en Supabase.
// Se excluye "level" porque ahora es una columna INTEGER en la BD que maneja el XP.
// Mapeamos el string "level" del cliente a "level_label" en la BD.
const VALID_PROFILE_COLUMNS = new Set([
  "id",
  "name",
  "age",
  "city",
  "avatar_url",
  "bio",
  "level_label",
  "preferred_sports",
  "matches_played",
  "last_location_lat",
  "last_location_lng",
  "company_name",
  "business_category",
  "is_sponsored",
  "gender",
  "user_sports",
  "sport_preferences",
  "onboarding_completed",
]);

const buildProfilePayload = (updated: User): Record<string, unknown> => {
  const normalizedPayload = {
    ...updated,
    level_label: updated.level, // Mapeo de string "level" a "level_label"
    user_sports: Array.isArray(updated.user_sports) ? updated.user_sports : [],
    sport_preferences: {
      sports_matrix: updated.sport_preferences?.sports_matrix || {},
      behavioral_intent: updated.sport_preferences?.behavioral_intent || {
        weekly_hours: 6,
        intent: "Recreativo" as const,
      },
    },
  };

  return Object.keys(normalizedPayload)
    .filter((key) => VALID_PROFILE_COLUMNS.has(key))
    .reduce(
      (obj, key) => {
        obj[key] = normalizedPayload[key as keyof User] as unknown;
        return obj;
      },
      {} as Record<string, unknown>,
    );
};

const extractMissingColumn = (msg: string): string | undefined => {
  let match = /Could not find the '(\w+)' column/.exec(msg);
  if (match) return match[1];

  match = /column\s+"(\w+)"\s+of\s+relation/.exec(msg);
  if (match) return match[1];

  match = /column\s+profiles\.(\w+)\s+does\s+not\s+exist/.exec(msg);
  if (match) return match[1];

  return undefined;
};

// === BLOQUE: INTERFAZ DEL ESTADO ===
interface ProfileState {
  profile: User | null;
  initProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// === BLOQUE: STORE DE PERFIL ===
// Gestiona la carga y actualización del perfil del usuario.
// Persistido en localStorage bajo "sportmatch-profile".
// Escucha cambios en useAuthStore para mantener el perfil sincronizado.
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,

      // === INICIALIZAR PERFIL ===
      // Expone el usuario actual de inmediato y luego enriquece con estadísticas
      // de seguidores obtenidas desde el servicio social.
      initProfile: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        set({ profile: currentUser });

        try {
          const stats = await getFollowStats(currentUser.id);
          set((state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  followers_count: stats.followersCount,
                  following_count: stats.followingCount,
                }
              : null,
          }));
        } catch (error) {
          console.error("Error loading follow stats:", error);
        }
      },

      // === ACTUALIZAR PERFIL ===
      // Aplica una actualización optimista en el estado local y luego persiste
      // en Supabase. Incluye un bucle de auto-reparación (self-healing) que
      // detecta columnas faltantes (PGRST204 / 42703), las elimina del payload
      // y reintenta hasta 10 veces.
      updateProfile: async (data) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          throw new Error("No hay una sesión activa. Por favor inicia sesión de nuevo.");
        }

        const updated = { ...currentUser, ...data };
        const currentPayload = buildProfilePayload(updated);

        // Actualización optimista: refleja los cambios en UI de inmediato
        useAuthStore.setState({ user: updated });
        set({ profile: updated });

        // En modo demo no persiste en backend
        if (useAuthStore.getState().isDemoMode) return;

        // Bucle de auto-reparación para columnas faltantes en el schema
        const MAX_RETRIES = 10;
        let retries = MAX_RETRIES;
        while (retries > 0) {
          const { error } = await supabase
            .from("profiles")
            .update(currentPayload)
            .eq("id", currentUser.id);

          // Actualización exitosa
          if (!error) return;

          const pgError = error as { code?: string; message?: string };
          const msg = pgError.message ?? "";

          // Columna faltante: elimina y reintenta
          if (pgError.code === "PGRST204" || pgError.code === "42703") {
            const missingColumn = extractMissingColumn(msg);

            if (missingColumn && currentPayload[missingColumn] !== undefined) {
              console.warn(
                `[ProfileStore] Column "${missingColumn}" missing in DB. Stripping & retrying (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
              );
              delete currentPayload[missingColumn];
              retries--;
              continue;
            }
            console.error("[ProfileStore] PGRST204 but could not extract column from:", msg);
          }

          // Error de permisos RLS
          if (pgError.code === "42501") {
            throw new Error(
              "No tienes permiso para actualizar este perfil. Verifica las políticas de seguridad (RLS) en Supabase.",
            );
          }

          throw error;
        }

        if (import.meta.env.DEV)
          console.error(
            "[ProfileStore] Profile update failed after all retries. Payload keys left:",
            Object.keys(currentPayload),
          );
        throw new Error(
          "No se pudo guardar el perfil después de varios intentos. Por favor ejecuta la migración SQL en Supabase.",
        );
      },
    }),
    {
      name: "sportmatch-profile",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

// === BLOQUE: SUSCRIPCIÓN A CAMBIOS DE AUTENTICACIÓN ===
// Inicializa el perfil solo cuando cambia el ID del usuario (login/logout),
// evitando recargas innecesarias de estadísticas de seguidores.
let _prevProfileUserId: string | null = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const userId = state.user?.id ?? null;
  if (userId !== _prevProfileUserId) {
    _prevProfileUserId = userId;
    useProfileStore.getState().initProfile();
  }
});
