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
    // Lógica real de Supabase
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (newUser: User) => {
    if (USE_MOCKS) {
      // Registro simulado, persistido en el store
      store.register(newUser);
      return;
    }
    // Lógica real de Supabase
    // await supabase.auth.signUp(...)
  };

  const register = async (newUser: User) => {
    await signUp(newUser);
  };

  const signOut = async () => {
    if (USE_MOCKS) {
      store.logout();
      return;
    }
    await supabase.auth.signOut();
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
