import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";
import { User } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { MOCK_USERS } from "@/shared/api/apiClient";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /**
   * SEC-02: isDemoMode is intentionally NOT persisted to localStorage.
   * Keeping it ephemeral (in-memory only) prevents attackers from setting
   * isDemoMode=true via DevTools to bypass all Supabase queries.
   */
  isDemoMode: boolean;
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
  setDemoMode: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isDemoMode: import.meta.env.VITE_USE_MOCKS === "true",
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, isDemoMode: false }),
      register: (user) => set({ user, isAuthenticated: true }),
      setDemoMode: (status) => set({ isDemoMode: status }),
    }),
    {
      name: "sportmatch-auth",
      storage: createJSONStorage(() => safeLocalStorage),
      // SEC-02: Explicitly exclude isDemoMode from persisted state.
      // It will always reset to false on a page refresh, preventing localStorage manipulation.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
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

const getDemoUsers = (): User[] => {
  if (typeof window === "undefined") return MOCK_USERS;
  const stored = localStorage.getItem("sportmatch_demo_users");
  if (!stored) {
    localStorage.setItem("sportmatch_demo_users", JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
  return JSON.parse(stored);
};

const saveDemoUsers = (users: User[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("sportmatch_demo_users", JSON.stringify(users));
  }
};

export function useAuth() {
  const store = useAuthStore();

  const signIn = async (email?: string, password?: string) => {
    // E2E / Mock login bypass
    if (store.isDemoMode || import.meta.env.VITE_USE_MOCKS === "true") {
      store.setDemoMode(true);
      const users = getDemoUsers();
      let mockUser: User = users[0];

      if (email) {
        const found = users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase() || u.id === email,
        );
        if (found) {
          mockUser = found;
        } else if (email === "ejuniorfloress@gmail.com") {
          mockUser = users.find((u) => u.id === "user-edwin-master") || users[0];
        } else if (email === "fabiola@sportmatch.app") {
          mockUser = users.find((u) => u.id === "user-fabiola") || users[0];
        } else if (email === "puka@puka.com") {
          mockUser = users.find((u) => u.id === "user-puka-power") || users[0];
        }
      }

      // Sync user balance from persisted demo balances
      const storedBalances = localStorage.getItem("sportmatch_demo_balances");
      const balances = storedBalances ? JSON.parse(storedBalances) : {};
      const actualBalance =
        balances[mockUser.id] !== undefined ? balances[mockUser.id] : mockUser.fitcoins_balance;
      mockUser = { ...mockUser, fitcoins_balance: actualBalance };

      store.login(mockUser);
      return;
    }

    if (email && password) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (import.meta.env.DEV) console.error("Error en Supabase Auth signIn:", authError);
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
        if (import.meta.env.DEV) console.error("Error loading profile:", profileError);
        throw profileError;
      }

      store.setDemoMode(false);
      store.login(profile as User);
      return;
    }

    // Guest login sets demo mode and bypasses Supabase queries entirely
    store.setDemoMode(true);
    const demoUser: User = {
      id: "demo-user-id",
      created_at: new Date().toISOString(),
      name: "Edwin (Demo)",
      age: 26,
      city: "Surco, Lima",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=EdwinDemo",
      bio: "Jugador de Pádel nivel intermedio en modo demostración.",
      trust_score: 95,
      fitcoins_balance: 1500,
      level: "Intermedio",
      preferred_sports: ["Pádel", "Tenis"],
      matches_played: 12,
      last_location_lat: -12.14,
      last_location_lng: -76.995,
      onboarding_completed: true,
      user_sports: [
        { sport_id: "Pádel", level: 2 },
        { sport_id: "Tenis", level: 1 },
      ],
    };
    store.login(demoUser);
  };

  const signUp = async (newUser: User) => {
    if (!newUser.email || !newUser.password) {
      throw new Error("Email y contraseña son obligatorios");
    }

    if (store.isDemoMode || import.meta.env.VITE_USE_MOCKS === "true") {
      store.setDemoMode(true);
      const mockRegisteredUser: User = {
        ...newUser,
        id: `mock-user-${Date.now()}`,
        created_at: new Date().toISOString(),
        fitcoins_balance: newUser.fitcoins_balance ?? 0,
        trust_score: newUser.trust_score ?? 50,
        level: newUser.level ?? "Intermedio",
        preferred_sports: newUser.preferred_sports ?? [],
        matches_played: 0,
      };
      const users = getDemoUsers();
      users.push(mockRegisteredUser);
      saveDemoUsers(users);
      store.login(mockRegisteredUser);
      return;
    }

    try {
      if (import.meta.env.DEV)
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
        if (import.meta.env.DEV) console.error("Error en Supabase Auth signUp:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("El registro en Supabase Auth falló.");
      }

      if (!authData.session) {
        store.setDemoMode(false);
        return { requiresEmailConfirmation: true };
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
            sport_preferences: newUser.sport_preferences,
          })
          .select()
          .single();

        if (insertError) {
          if (import.meta.env.DEV) console.error("Error manually inserting profile:", insertError);
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
            sport_preferences: newUser.sport_preferences,
          })
          .eq("id", authData.user.id)
          .select()
          .single();
        if (updated) {
          profile = updated;
        }
      }

      if (authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });
      }

      store.register(profile as User);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error durante registro:", err);
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
      if (import.meta.env.DEV) console.warn("Supabase Auth signOut warning:", e);
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
