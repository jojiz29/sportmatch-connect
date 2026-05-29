import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Users,
  Map,
  CalendarCheck,
  MessageSquare,
  Trophy,
  Activity,
  LayoutDashboard,
  User,
  Zap,
  Store,
  LogOut,
} from "lucide-react";
import { useAuth, useAuthStore } from "@/entities/user/useAuth";
import { NotificationBell } from "@/features/notifications/ui/NotificationBell";

const NAV = [
  { to: "/app", label: "Inicio", icon: Home, end: true },
  { to: "/app/match", label: "Matchmaking", icon: Users },
  { to: "/app/map", label: "Mapa", icon: Map },
  { to: "/app/courts", label: "Reservas", icon: CalendarCheck },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/wallet", label: "FitCoins", icon: Trophy },
  { to: "/app/iot", label: "Telemetría", icon: Activity },
  { to: "/app/profile", label: "Perfil", icon: User },
  { to: "/app/business", label: "Mi Negocio", icon: Store },
  { to: "/app/admin", label: "Admin", icon: LayoutDashboard },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isRegister = path === "/app/register";
  const currentUser = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (isRegister) {
    return (
      <div className="min-h-screen bg-background bg-gradient-hero flex flex-col">{children}</div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Filter NAV items dynamically based on user role
  const navItems = NAV.filter((item) => {
    if (item.to === "/app/business" && currentUser.user_role !== "BUSINESS") {
      return false;
    }
    if (item.to === "/app/admin") {
      return (
        currentUser.email === "ejuniorfloress@gmail.com" ||
        currentUser.name === "Edwin Flores" ||
        currentUser.is_admin
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background bg-gradient-hero">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col glass border-r border-border z-30">
        <div className="px-6 py-6 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">SportMatch</span>
          </Link>
          <NotificationBell />
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = item.end ? path === item.to : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 m-3 rounded-2xl bg-gradient-card border border-border">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.name}
              className="h-10 w-10 rounded-full bg-muted object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{currentUser.name}</div>
              <div className="text-xs text-neon flex items-center gap-1">
                <Trophy className="h-3 w-3" /> {currentUser.fitcoins_balance} FC
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top header with notification bell */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/app" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">SportMatch</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neon font-semibold flex items-center gap-1">
              <Trophy className="h-3 w-3" /> {currentUser.fitcoins_balance} FC
            </span>
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border">
        <div className="grid grid-cols-5 px-2 py-2">
          {NAV.slice(0, 5).map((item) => {
            const active = item.end ? path === item.to : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-1 text-[10px] ${
                  active ? "text-neon" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="lg:pl-64 pt-14 lg:pt-0 pb-24 lg:pb-10 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
