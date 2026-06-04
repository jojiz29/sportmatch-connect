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

        // 2. DEFENSIVE MAPPING FOR LEGACY ACCOUNTS
        const cleanSportsMatrix = updated.sport_preferences?.sports_matrix || {};
        const cleanUserSports = Array.isArray(updated.user_sports) ? updated.user_sports : [];
        const cleanBehavioralIntent = updated.sport_preferences?.behavioral_intent || {
          weekly_hours: 6,
          intent: "Recreativo" as const,
        };

        const normalizedPayload = {
          ...updated,
          user_sports: cleanUserSports,
          sport_preferences: {
            sports_matrix: cleanSportsMatrix,
            behavioral_intent: cleanBehavioralIntent,
          },
        };

        // Optimistic update to local stores immediately
        useAuthStore.setState({ user: normalizedPayload });

        set((state) => ({
          profile: state.profile ? { ...state.profile, ...normalizedPayload } : normalizedPayload,
        }));

        if (useAuthStore.getState().isDemoMode) {
          return;
        }

        // Filter payload to only include columns that exist in the database schema.
        // This prevents PGRST204 errors when using a database without local migration columns.
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

        const supabasePayload = Object.keys(normalizedPayload)
          .filter((key) => VALID_PROFILE_COLUMNS.includes(key))
          .reduce(
            (obj, key) => {
              obj[key] = normalizedPayload[key as keyof User];
              return obj;
            },
            {} as Record<string, unknown>,
          );

        // Self-healing update retry loop:
        // If a column does not exist in the database (e.g., legacy/unmigrated schema),
        // we dynamically strip it from the payload and retry the update.
        const currentPayload = { ...supabasePayload };
        let retries = 10;
        let success = false;
        let lastError: unknown = null;

        while (retries > 0 && !success) {
          const updateRequest = supabase
            .from("profiles")
            .update(currentPayload)
            .eq("id", currentUser.id);

          const timeoutPromise = new Promise<unknown>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "La actualización tardó demasiado. Verifica tu conexión e inténtalo de nuevo.",
                  ),
                ),
              12000,
            ),
          );

          const res = await Promise.race([updateRequest, timeoutPromise]);
          const error =
            res && typeof res === "object" && "error" in res
              ? (res as { error: unknown }).error
              : null;

          if (!error) {
            success = true;
          } else {
            lastError = error;
            const pgError = error as { code?: string; message?: string };
            // Handle PostgreSQL undefined_column (42703) and PostgREST schema cache missing column (PGRST204)
            if (pgError.code === "42703" || pgError.code === "PGRST204") {
              const errMsg = pgError.message || "";
              // 1. PostgREST cache missing: "Could not find the 'column_name' column of 'profiles' in the schema cache"
              let columnMatch = errMsg.match(/Could not find the '([a-zA-Z0-9_]+)' column/);

              // 2. PostgreSQL: "column \"column_name\" of relation \"profiles\" does not exist"
              if (!columnMatch) {
                columnMatch = errMsg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+of\s+relation/);
              }

              // 3. PostgreSQL: "column profiles.column_name does not exist"
              if (!columnMatch) {
                columnMatch = errMsg.match(
                  /column\s+profiles\.([a-zA-Z0-9_]+)\s+does\s+not\s+exist/,
                );
              }

              if (columnMatch && columnMatch[1]) {
                const missingColumn = columnMatch[1];
                console.warn(
                  `Column "${missingColumn}" does not exist in profiles table. Removing from payload and retrying...`,
                );
                delete currentPayload[missingColumn];
                retries--;
                continue;
              }
            }
            // If it's a different database error, throw it immediately
            throw error;
          }
        }

        if (!success && lastError) {
          if (import.meta.env.DEV)
            console.error("Error updating profile in Supabase after retries:", lastError);
          throw lastError;
        }
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
