import React, { createContext, useEffect, useRef, useState } from "react";
// VITE_API_URL configured: https://sportmatch-connect.onrender.com
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { useThemeStore } from "@/features/theme/store";
import { I18nextProvider } from "react-i18next";
import { MOCK_USERS } from "@/shared/api/apiClient";
import i18n from "@/shared/i18n";

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
    const isDemo = useAuthStore.getState().isDemoMode;
    if (isDemo) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const timeoutRef = { current: null as NodeJS.Timeout | null };

async function initAuth() {
      try {
        // Only apply timeout if there's no hash in the URL (not during OAuth callback)
        const isOAuthCallback = typeof window !== "undefined" && window.location.hash.includes("access_token");
        const timeoutMs = isOAuthCallback ? 10000 : 3000; // Give more time during OAuth callback

        if (!isOAuthCallback) {
          timeoutRef.current = setTimeout(() => {
            if (mounted) {
              console.warn("Auth synchronization timed out. Falling back to demo mode.");
              useAuthStore.getState().setDemoMode(true);
              const fallbackUser = useAuthStore.getState().user || MOCK_USERS[0];
              useAuthStore.getState().login(fallbackUser);
              setIsLoading(false);
            }
          }, timeoutMs);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          let profile = null;
          const { data: existingProfile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (existingProfile && !error) {
            profile = existingProfile;
          } else {
            // New Google/OAuth user profile auto-creation
            const userMeta = session.user.user_metadata || {};
            const name = userMeta.full_name || userMeta.name || "Jugador Google";
            const avatarUrl =
              userMeta.avatar_url ||
              userMeta.picture ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`;
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                name,
                avatar_url: avatarUrl,
                user_role: "PLAYER",
                trust_score: 90,
                fitcoins_balance: 100,
                level: "Intermedio",
                preferred_sports: ["Pádel"],
              })
              .select()
              .single();

            if (!insertError && newProfile) {
              profile = newProfile;
            } else {
              console.error("Error creating profile for Google login:", insertError);
              // Fallback: Retry fetching the profile in case the trigger inserted it concurrently
              const { data: retriedProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();
              if (retriedProfile) {
                profile = retriedProfile;
              }
            }
          }

          if (profile) {
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
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
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
      console.log("onAuthStateChange fired:", event, session?.user?.email);
      if (!mounted) return;

      // Only skip INITIAL_SESSION if already initialized (already handled by initAuth)
      // But ALWAYS process SIGNED_IN — it comes from OAuth callback and needs to be handled
      if (event === "INITIAL_SESSION" && initializedRef.current) {
        return;
      }

      // If not initialized yet and event is SIGNED_IN, process it (OAuth callback)
      // If not initialized yet and event is anything else, skip
      if (!initializedRef.current && event !== "SIGNED_IN") {
        console.log("Skipping because not initialized yet, event:", event);
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        let profile = null;
        const { data: existingProfile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (existingProfile && !error) {
          profile = existingProfile;
        } else {
          // New Google/OAuth user profile auto-creation
          const userMeta = session.user.user_metadata || {};
          const name = userMeta.full_name || userMeta.name || "Jugador Google";
          const avatarUrl =
            userMeta.avatar_url ||
            userMeta.picture ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`;
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              name,
              avatar_url: avatarUrl,
              user_role: "PLAYER",
              trust_score: 90,
              fitcoins_balance: 100,
              level: "Intermedio",
              preferred_sports: ["Pádel"],
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            profile = newProfile;
          } else {
            console.error(
              "Error creating profile for Google login during auth change:",
              insertError,
            );
            // Fallback: Retry fetching the profile in case the trigger inserted it concurrently
            const { data: retriedProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            if (retriedProfile) {
              profile = retriedProfile;
            }
          }
        }

        if (profile && mounted) {
          loginRef.current(profile);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            console.log("Cleared auth timeout after SIGNED_IN");
          }
          initializedRef.current = true;
          setIsLoading(false);
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

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "dark-footballer", "world-cup");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return <>{children}</>;

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer>
          <AuthProvider>{children}</AuthProvider>
        </ThemeInitializer>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
