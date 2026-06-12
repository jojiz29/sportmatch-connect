// === BLOQUE: IMPORTS — Dependencias del shell de la aplicación ===
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuthStore } from "@/entities/user/useAuth";

// === BLOQUE: Ruta /app — createFileRoute con guard de autenticación y redirección por rol ===
// Protege todas las rutas hijas bajo /app:
//   - Permite /app/register sin autenticación.
//   - Redirige a /login si no hay sesión activa.
//   - BUSINESS → redirige a /app/business (y bloquea /app si no es ruta business).
//   - PLAYER → redirige a /onboarding/sports si no completó onboarding.
export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    // La ruta de registro no requiere autenticación.
    if (location.pathname === "/app/register") {
      return;
    }
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    const user = useAuthStore.getState().user;

    // Guard por rol: BUSINESS solo puede acceder a /app/business.
    if (user && user.user_role === "BUSINESS") {
      if (!location.pathname.startsWith("/app/business")) {
        throw redirect({ to: "/app/business" });
      }
    }
    // PLAYER no puede acceder a rutas de BUSINESS.
    if (user && user.user_role === "PLAYER") {
      if (location.pathname.startsWith("/app/business")) {
        throw redirect({ to: "/app" });
      }
    }

    // Redirige al onboarding deportivo si el perfil está incompleto.
    if (
      user &&
      user.user_role === "PLAYER" &&
      (user.onboarding_completed === false || !user.user_sports || user.user_sports.length === 0) &&
      (!user.preferred_sports || user.preferred_sports.length === 0)
    ) {
      throw redirect({ to: "/onboarding/sports" });
    }
  },
  component: () => (
    <AppShell>
      <div className="flex-1 h-full min-h-[500px] w-full flex flex-col">
        <Outlet />
      </div>
    </AppShell>
  ),
});
