import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";
import { User } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      register: (user) => set({ user, isAuthenticated: true }),
    }),
    {
      name: "sportmatch-auth",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

/**
 * Purges all persisted Zustand stores and clears localStorage keys.
 * Called during sign-out to ensure a clean session state.
 */
export function purgeAllStores() {
  // Clear all known localStorage keys for this app
  const STORE_KEYS = [
    "sportmatch-auth",
    "sportmatch-profile",
    "sportmatch-wallet",
    "sportmatch-chat",
    "sportmatch-notifications",
  ];
  try {
    STORE_KEYS.forEach((key) => {
      try {
        safeLocalStorage.removeItem(key);
      } catch {
        // Ignore individual key failures
      }
    });
  } catch {
    // Ignore storage access errors
  }

  // Reset Zustand auth store state
  useAuthStore.setState({ user: null, isAuthenticated: false });
}

export function useAuth() {
  const store = useAuthStore();

  const signIn = async (email?: string, password?: string) => {
    if (email && password) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Error en Supabase Auth signIn:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Usuario no encontrado");
      }

      // Fetch user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        throw profileError;
      }

      store.login(profile as User);
      return;
    }

    // Demo/Guest login fallback using first available profile
    try {
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (pError) {
        console.error("Error demo login:", pError);
        throw pError;
      }

      if (profiles && profiles.length > 0) {
        store.login(profiles[0] as User);
      } else {
        throw new Error("No hay perfiles disponibles en la base de datos.");
      }
    } catch (err) {
      console.error("Error en demo login:", err);
      throw err;
    }
  };

  const signUp = async (newUser: User) => {
    if (!newUser.email || !newUser.password) {
      throw new Error("Email y contraseña son obligatorios");
    }

    try {
      console.log("Intentando registrar usuario en Supabase Auth:", newUser.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            user_role: newUser.user_role || "PLAYER",
          },
        },
      });

      if (authError) {
        console.error("Error en Supabase Auth signUp:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("El registro en Supabase Auth falló.");
      }

      // Supabase trigger handle_new_user should automatically create the public.profiles record.
      // We attempt to fetch this record with a retry mechanism.
      let profile = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();
        if (data) {
          profile = data;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // If the trigger hasn't run or is missing, manually insert the profile row.
      if (!profile) {
        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            name: newUser.name,
            avatar_url: newUser.avatar_url,
            user_role: newUser.user_role || "PLAYER",
            trust_score: newUser.trust_score ?? 50,
            fitcoins_balance: newUser.fitcoins_balance ?? 0,
            level: newUser.level ?? "Intermedio",
            preferred_sports: newUser.preferred_sports ?? [],
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error manually inserting profile:", insertError);
          throw insertError;
        }
        profile = inserted;
      } else {
        // Enforce extra metadata fields that the automatic trigger might not have updated
        const { data: updated } = await supabase
          .from("profiles")
          .update({
            age: newUser.age,
            city: newUser.city,
            bio: newUser.bio,
            trust_score: newUser.trust_score ?? 50,
            fitcoins_balance: newUser.fitcoins_balance ?? 0,
            level: newUser.level ?? "Intermedio",
            preferred_sports: newUser.preferred_sports ?? [],
          })
          .eq("id", authData.user.id)
          .select()
          .single();
        if (updated) {
          profile = updated;
        }
      }

      store.register(profile as User);
    } catch (err) {
      console.error("Error durante registro:", err);
      throw err;
    }
  };

  const register = async (newUser: User) => {
    await signUp(newUser);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase Auth signOut warning:", e);
    }
    // Purge all Zustand stores and localStorage keys for a clean session exit
    purgeAllStores();
  };

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    signIn,
    signUp,
    register,
    signOut,
  };
}
