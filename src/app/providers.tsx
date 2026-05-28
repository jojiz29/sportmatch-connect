import React, { createContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

const AuthContext = createContext<{ isLoading: boolean }>({ isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile && !error) {
            login(profile);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        console.error("Error in AuthProvider initAuth:", err);
        logout();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          login(profile);
        }
      } else if (event === "SIGNED_OUT") {
        logout();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [login, logout]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-muted" />
            <div className="absolute h-12 w-12 rounded-full border-4 border-t-primary animate-spin" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-foreground/80 animate-pulse">
            Sincronizando sesión deportiva...
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={{ isLoading }}>{children}</AuthContext.Provider>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
