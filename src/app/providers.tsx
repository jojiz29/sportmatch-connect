import React, { createContext, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const AuthContext = createContext<{ isLoading: boolean }>({ isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  // Capture store actions in refs — stable Zustand actions that never change
  // identity. Using them directly in useEffect deps causes an infinite loop
  // because the selector re-subscribes on every render.
  const loginRef = useRef(useAuthStore.getState().login);
  const logoutRef = useRef(useAuthStore.getState().logout);

  // Prevents onAuthStateChange from double-processing the INITIAL_SESSION
  // event that fires immediately after the subscription is created, which
  // would duplicate the profile fetch already done in initAuth().
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const isDemo = useAuthStore.getState().isDemoMode;
        if (isDemo && useAuthStore.getState().isAuthenticated) {
          // In demo mode, bypass supabase auth check
          return;
        }

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
            loginRef.current(profile);
          } else {
            logoutRef.current();
          }
        } else {
          logoutRef.current();
        }
      } catch (err) {
        console.error("AuthProvider initAuth error:", err);
        logoutRef.current();
      } finally {
        if (mounted) {
          initializedRef.current = true;
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      // Skip INITIAL_SESSION — already handled synchronously by initAuth()
      if (!initializedRef.current) return;

      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile && mounted) {
          loginRef.current(profile);
        }
      } else if (event === "SIGNED_OUT") {
        logoutRef.current();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // Empty deps array — intentional. loginRef and logoutRef are stable refs,
    // not reactive values. Adding them would re-run on every render.
  }, []);

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
