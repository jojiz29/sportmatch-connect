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
  if (typeof window === "undefined") return MOCK_USERS;
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
  if (typeof window !== "undefined") {
    localStorage.setItem("sportmatch_demo_users", JSON.stringify(users));
  }
};

// === BLOQUE: HOOK PRINCIPAL DE AUTENTICACIÓN ===
// Expone las funciones signIn, signUp, register y signOut.
// En modo demo o mock todo el flujo opera contra localStorage;
// en modo real usa Supabase Auth + backend NestJS.
export function useAuth() {
  const store = useAuthStore();

  // === INICIO DE SESIÓN ===
  // Soporta tres modos:
  //   1. Mock/Demo — login con email sin contraseña contra usuarios locales
  //   2. Supabase Auth + backend NestJS — login real con credenciales
  //   3. Invitado — login anónimo con usuario demo genérico
  const signIn = async (email?: string, password?: string) => {
    // E2E / Mock login bypass
    const isMockAttempt = !!(email && !password);
    if (store.isDemoMode || import.meta.env.VITE_USE_MOCKS === "true" || isMockAttempt) {
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

      // Sincroniza el saldo del usuario con los balances persistidos en demo
      const storedBalances = localStorage.getItem("sportmatch_demo_balances");
      const balances = storedBalances ? JSON.parse(storedBalances) : {};
      const actualBalance =
        balances[mockUser.id] !== undefined ? balances[mockUser.id] : mockUser.fitcoins_balance;
      mockUser = { ...mockUser, fitcoins_balance: actualBalance };

      store.login(mockUser);
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

      const token = authData.session?.access_token;
      let profile = null;

      // Intenta obtener el perfil desde el backend NestJS primero
      if (token && import.meta.env.VITE_API_URL) {
        try {
          const response = await backendApi.auth.getProfile(token);
          if (response.data) {
            profile = response.data;
          }
        } catch (backendError) {
          if (import.meta.env.DEV)
            console.warn("Backend profile fetch failed, falling back to Supabase:", backendError);
        }
      }

      // Fallback: obtiene el perfil directamente desde Supabase
      if (!profile) {
        const { data: supabaseProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          if (import.meta.env.DEV) console.error("Error loading profile:", profileError);
          throw profileError;
        }
        profile = supabaseProfile;
      }

      store.setDemoMode(false);
      store.login(profile as User);
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
  // En modo demo crea un usuario mock local; en modo real registra en Supabase Auth,
  // espera el trigger handle_new_user y hace hasta 5 reintentos para obtener el perfil.
  // Si el trigger no se ejecutó, inserta manualmente la fila en public.profiles.
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

      // El trigger handle_new_user de Supabase debería crear public.profiles automáticamente.
      // Reintentamos hasta 5 veces con 500ms de espera entre cada intento.
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

      // Si el trigger no se ha ejecutado, insertamos la fila manualmente
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
          .eq("id", authData.user.id)
          .select()
          .single();
        if (updated) {
          profile = updated;
        }
      }

      // Establece la sesión en Supabase para que el usuario quede autenticado
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

  // Alias público de signUp para compatibilidad con la interfaz AuthState
  const register = async (newUser: User) => {
    return await signUp(newUser);
  };

  // === CIERRE DE SESIÓN ===
  // Cierra sesión en Supabase Auth (ignorando errores) y purga todas las stores.
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Supabase Auth signOut warning:", e);
    }
    // Purga todas las stores Zustand y claves de localStorage
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
