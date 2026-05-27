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
  },
  component: () => (
    <AppShell>
      <div className="flex-1 h-full min-h-[500px] w-full flex flex-col">
        <Outlet />
      </div>
    </AppShell>
  ),
});
