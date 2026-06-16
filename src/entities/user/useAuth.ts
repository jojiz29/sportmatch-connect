// === BLOQUE: DEPENDENCIAS ===
// Store de autenticación con Zustand + persistencia parcial.
// El modo demo se almacena solo en memoria para evitar manipulaciones vía DevTools.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";
import { backendApi } from "@/shared/api/backendApi";
import { User } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { MOCK_USERS } from "@/shared/api/apiClient";

// === BLOQUE: INTERFAZ DEL ESTADO ===
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

// === BLOQUE: STORE ZUSTAND PERSISTIDO ===
// Se persisten solo `user` e `isAuthenticated` en localStorage.
// `isDemoMode` se excluye explícitamente por seguridad (SEC-02).
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isDemoMode: import.meta.env.VITE_USE_MOCKS === "true",
      login: (user) => {
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, isDemoMode: false });
      },
      register: (user) => {
        set({ user, isAuthenticated: true });
      },
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

// === BLOQUE: LIMPIEZA DE SESIÓN ===
// Purga todas las stores Zustand persistidas y las claves de localStorage.
// Se invoca durante el cierre de sesión para garantizar un estado limpio.
export function purgeAllStores() {
  // Limpia todas las claves conocidas de localStorage para esta app
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
        // Ignora fallos individuales por clave
      }
    });
  } catch {
    // Ignora errores de acceso al storage
  }

  // Resetea el estado de la store de autenticación
  useAuthStore.setState({ user: null, isAuthenticated: false });
}

// === BLOQUE: GESTIÓN DE USUARIOS DE MOCK ===
// Carga los usuarios simulados desde localStorage o los inicializa
// con MOCK_USERS. Incluye una recarga forzada de caché si faltan
// los nuevos perfiles B2B de negocio.
const getDemoUsers = (): User[] => {
  if (typeof globalThis.window === "undefined") return MOCK_USERS;
  const stored = localStorage.getItem("sportmatch_demo_users");
  if (!stored) {
    localStorage.setItem("sportmatch_demo_users", JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
  try {
    const parsed = JSON.parse(stored);
    // Fuerza recarga de caché si faltan los nuevos perfiles B2B
    if (!parsed || !Array.isArray(parsed) || !parsed.some((u: User) => u.id === "business-gym-1")) {
      localStorage.setItem("sportmatch_demo_users", JSON.stringify(MOCK_USERS));
      return MOCK_USERS;
    }
    return parsed;
  } catch {
    localStorage.setItem("sportmatch_demo_users", JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
};

// Persiste los usuarios simulados en localStorage
const saveDemoUsers = (users: User[]) => {
  if (typeof globalThis.window !== "undefined") {
    localStorage.setItem("sportmatch_demo_users", JSON.stringify(users));
  }
};

// Helper: Realiza la búsqueda de usuario mock para login
const findMockUser = (email: string, users: User[]): User => {
  const emailLower = email.toLowerCase();
  const found = users.find(
    (u) => u.email?.toLowerCase() === emailLower || u.id === email,
  );
  if (found) return found;
  if (email === "ejuniorfloress@gmail.com") {
    return users.find((u) => u.id === "user-edwin-master") || users[0];
  }
  if (email === "fabiola@sportmatch.app") {
    return users.find((u) => u.id === "user-fabiola") || users[0];
  }
  if (email === "puka@puka.com") {
    return users.find((u) => u.id === "user-puka-power") || users[0];
  }
  return users[0];
};

// Helper: Ejecuta el login mock
const executeMockSignIn = (email: string | undefined, store: any) => {
  store.setDemoMode(true);
  const users = getDemoUsers();
  let mockUser: User = email ? findMockUser(email, users) : users[0];

  // Sincroniza el saldo del usuario con los balances persistidos en demo
  const storedBalances = localStorage.getItem("sportmatch_demo_balances");
  const balances = storedBalances ? JSON.parse(storedBalances) : {};
  const actualBalance =
    balances[mockUser.id] === undefined ? mockUser.fitcoins_balance : balances[mockUser.id];
  mockUser = { ...mockUser, fitcoins_balance: actualBalance };

  store.login(mockUser);
};

// Helper: Carga perfil desde NestJS o Supabase
const fetchProfile = async (userId: string, token?: string): Promise<User> => {
  let profile: User | null = null;
  if (token && import.meta.env.VITE_API_URL) {
    try {
      const response = await backendApi.auth.getProfile(token);
      if (response.data) {
        profile = response.data as User;
      }
    } catch (backendError) {
      if (import.meta.env.DEV)
        console.warn("Backend profile fetch failed, falling back to Supabase:", backendError);
    }
  }

  if (!profile) {
    const { data: supabaseProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      if (import.meta.env.DEV) console.error("Error loading profile:", profileError);
      throw profileError;
    }
    profile = supabaseProfile as User;
  }
  return profile;
};

// Helper: Inserta o actualiza perfil en Supabase
const upsertProfileInSupabase = async (newUser: User, authUserId: string): Promise<User> => {
  let profile: User | null = null;
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUserId)
      .single();
    if (data) {
      profile = data as User;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (profile) {
    // Actualiza campos extra que el trigger automático podría no haber incluido
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
      .eq("id", authUserId)
      .select()
      .single();
    if (updated) {
      profile = updated as User;
    }
  } else {
    // Si el trigger no se ha ejecutado, insertamos la fila manualmente
    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: authUserId,
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
    profile = inserted as User;
  }
  return profile;
};

// === BLOQUE: HOOK PRINCIPAL DE AUTENTICACIÓN ===
// Expone las funciones signIn, signUp, register y signOut.
// En modo demo o mock el flujo completo opera contra localStorage;
// en modo real usa Supabase Auth + backend NestJS.
export function useAuth() {
  const store = useAuthStore();

  // === INICIO DE SESIÓN ===
  const signIn = async (email?: string, password?: string) => {
    // E2E / Mock login bypass
    const isMockAttempt = !!(email && !password);
    if (store.isDemoMode || import.meta.env.VITE_USE_MOCKS === "true" || isMockAttempt) {
      executeMockSignIn(email, store);
      return;
    }

    // Flujo real: autenticación contra Supabase Auth
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

      const profile = await fetchProfile(authData.user.id, authData.session?.access_token);

      store.setDemoMode(false);
      store.login(profile);
      return;
    }

    // Login como invitado: activa modo demo y omite consultas a Supabase
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

  // === REGISTRO ===
  const signUp = async (newUser: User) => {
    if (!newUser.email || !newUser.password) {
      throw new Error("Email y contraseña son obligatorios");
    }

    // Modo simulado: registro contra localStorage
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

    // Modo real: registro contra Supabase Auth
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

      const profile = await upsertProfileInSupabase(newUser, authData.user.id);

      // Establece la sesión en Supabase para que el usuario quede autenticado
      if (authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });
      }

      store.register(profile);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error durante registro:", err);
      throw err;
    }
  };

  const register = async (newUser: User) => {
    return await signUp(newUser);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Supabase Auth signOut warning:", e);
    }
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
