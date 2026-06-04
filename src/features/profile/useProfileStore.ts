import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "@/shared/api/supabase";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { getFollowStats } from "@/shared/api/socialService";

interface ProfileState {
  profile: User | null;
  initProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      initProfile: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        // Expose immediately, then enrich with follow stats
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
      updateProfile: async (data) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          throw new Error("No hay una sesión activa. Por favor inicia sesión de nuevo.");
        }

        const updated = { ...currentUser, ...data };

        // 1. Prepare and Normalize Payload
        const normalizedPayload = {
          ...updated,
          user_sports: Array.isArray(updated.user_sports) ? updated.user_sports : [],
          sport_preferences: {
            sports_matrix: updated.sport_preferences?.sports_matrix || {},
            behavioral_intent: updated.sport_preferences?.behavioral_intent || {
              weekly_hours: 6,
              intent: "Recreativo" as const,
            },
          },
        };

        // Optimistic update
        useAuthStore.setState({ user: normalizedPayload });
        set({ profile: normalizedPayload });

        if (useAuthStore.getState().isDemoMode) return;

        // 2. Define schema whitelist
        const VALID_PROFILE_COLUMNS = [
          "id",
          "name",
          "age",
          "city",
          "avatar_url",
          "bio",
          "trust_score",
          "fitcoins_balance",
          "level",
          "preferred_sports",
          "matches_played",
          "last_location_lat",
          "last_location_lng",
          "user_role",
          "company_name",
          "business_category",
          "is_sponsored",
          "is_admin",
          "gender",
          "user_sports",
          "sport_preferences",
          "onboarding_completed",
        ];

        const currentPayload = Object.keys(normalizedPayload)
          .filter((key) => VALID_PROFILE_COLUMNS.includes(key))
          .reduce(
            (obj, key) => {
              obj[key] = normalizedPayload[key as keyof User] as unknown;
              return obj;
            },
            {} as Record<string, unknown>,
          );

        // 3. Self-healing retry loop for missing schema columns (PGRST204 / 42703)
        // Each iteration strips one unknown column and retries.
        // MAX_RETRIES is generous enough to handle all possible new columns.
        const MAX_RETRIES = 10;
        let retries = MAX_RETRIES;
        while (retries > 0) {
          const { error } = await supabase
            .from("profiles")
            .update(currentPayload)
            .eq("id", currentUser.id);

          // ✅ Update succeeded
          if (!error) return;

          const pgError = error as { code?: string; message?: string };
          const msg = pgError.message ?? "";

          // ── Missing column: strip & retry ──────────────────────────────
          // PostgREST PGRST204: "Could not find the 'col' column of 'profiles' in the schema cache"
          // Postgres    42703:  "column \"col\" of relation \"profiles\" does not exist"
          if (pgError.code === "PGRST204" || pgError.code === "42703") {
            let missingColumn: string | undefined;

            // Pattern 1 — PostgREST cache miss
            missingColumn = msg.match(/Could not find the '([a-zA-Z0-9_]+)' column/)?.[1];

            // Pattern 2 — Postgres quoted column
            if (!missingColumn)
              missingColumn = msg.match(/column\s+"([a-zA-Z0-9_]+)"\s+of\s+relation/)?.[1];

            // Pattern 3 — Postgres unquoted column
            if (!missingColumn)
              missingColumn = msg.match(
                /column\s+profiles\.([a-zA-Z0-9_]+)\s+does\s+not\s+exist/,
              )?.[1];

            if (missingColumn && currentPayload[missingColumn] !== undefined) {
              console.warn(
                `[ProfileStore] Column "${missingColumn}" missing in DB. Stripping & retrying (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
              );
              delete currentPayload[missingColumn];
              retries--;
              continue;
            }
            // If we can't identify the column, break to avoid infinite loop
            console.error("[ProfileStore] PGRST204 but could not extract column from:", msg);
          }

          // ── RLS / permission error ──────────────────────────────────────
          if (pgError.code === "42501") {
            throw new Error(
              "No tienes permiso para actualizar este perfil. Verifica las políticas de seguridad (RLS) en Supabase.",
            );
          }

          // ── Any other error: throw immediately ─────────────────────────
          throw error;
        }

        // Exhausted retries without success — throw the last error context
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

// Subscribe to useAuthStore to keep profile in sync.
// Only triggers initProfile when the user ID actually changes (login/logout),
// preventing redundant follow stats database reloads on updates.
let _prevProfileUserId: string | null = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const userId = state.user?.id ?? null;
  if (userId !== _prevProfileUserId) {
    _prevProfileUserId = userId;
    useProfileStore.getState().initProfile();
  }
});
