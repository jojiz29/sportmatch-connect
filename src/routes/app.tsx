import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuthStore } from "@/entities/user/useAuth";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/app/register") {
      return;
    }
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    const user = useAuthStore.getState().user;
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
