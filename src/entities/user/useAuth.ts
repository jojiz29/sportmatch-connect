import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";
import { ME, MOCK_USERS } from "@/lib/mock";
import { User } from "@/entities/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
}

// Estado local de sesión (principalmente para el Mock Mode)
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
    },
  ),
);

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export function useAuth() {
  const store = useAuthStore();

  const signIn = async (email?: string, password?: string) => {
    if (USE_MOCKS) {
      if (email && password) {
        const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
        if (found) {
          store.login(found);
          return;
        }
        throw new Error("Credenciales incorrectas");
      }
      // Login simulado como guest (Edwin por defecto)
      store.login(ME);
      return;
    }

    // Lógica real de Supabase - Query directo a tabla users
    if (email && password) {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("email", email);

        if (error) {
          console.error("Error en Supabase:", error);
          throw new Error(`Supabase error: ${error.message}`);
        }

        if (!data || data.length === 0) {
          throw new Error("Usuario no encontrado");
        }

        // Comparar password (en producción usa bcrypt)
        if (data[0].password !== password) {
          throw new Error("Contraseña incorrecta");
        }

        store.login(data[0] as User);
      } catch (err: unknown) {
        console.error("Error durante signIn:", err);
        throw err;
      }
      return;
    }

    // Login de demo (sin credenciales)
    try {
      // Obtener el primer usuario disponible (no usar .single() si la tabla está vacía)
      const { data, error } = await supabase.from("users").select("*").limit(1);

      if (error) {
        console.error("Error demo login:", error);
        throw new Error(`Error al obtener usuario demo: ${error.message}`);
      }

      if (data && data.length > 0) {
        store.login(data[0] as User);
      } else {
        throw new Error(
          "No hay usuarios disponibles en la base de datos. Por favor, contacta al administrador.",
        );
      }
    } catch (err: unknown) {
      console.error("Error en demo login:", err);
      throw err;
    }
  };

  const signUp = async (newUser: User) => {
    if (USE_MOCKS) {
      // Registro simulado, persistido en el store
      store.register(newUser);
      return;
    }

    // Lógica real de Supabase - Insertar nuevo usuario
    try {
      console.log("Intentando registrar usuario:", newUser);
      const { data, error } = await supabase.from("users").insert([newUser]).select().single();

      if (error) {
        console.error("Error en signUp:", error);
        throw new Error(`Error al registrar: ${error.message}`);
      }

      if (data) {
        console.log("Usuario registrado exitosamente:", data);
        store.register(data as User);
      }
    } catch (err: unknown) {
      console.error("Error durante registro:", err);
      throw err;
    }
  };

  const register = async (newUser: User) => {
    await signUp(newUser);
  };

  const signOut = async () => {
    if (USE_MOCKS) {
      store.logout();
      return;
    }
    store.logout();
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
