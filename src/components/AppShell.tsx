import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Users,
  Map,
  MessageSquare,
  Trophy,
  Activity,
  LayoutDashboard,
  User,
  Zap,
  Store,
  LogOut,
  Rss,
  Shield,
} from "lucide-react";
import { useAuth, useAuthStore } from "@/entities/user/useAuth";
import { NotificationBell } from "@/features/notifications/ui/NotificationBell";
import { WorldCupBackground } from "@/components/WorldCupBackground";
import { useTranslation } from "react-i18next";

const GROUPS = [
  {
    titleKey: "nav.groups.action",
    items: [
      { to: "/app", labelKey: "nav.inicio", icon: Home, end: true },
      { to: "/app/match", labelKey: "nav.matchmaking", icon: Users },
      { to: "/app/map", labelKey: "nav.map_and_courts", icon: Map },
    ],
  },
  {
    titleKey: "nav.groups.social",
    items: [
      { to: "/app/feed", labelKey: "nav.comunidad", icon: Rss },
      { to: "/app/squads", labelKey: "nav.squads", icon: Shield },
      { to: "/app/chat", labelKey: "nav.mensajes", icon: MessageSquare },
    ],
  },
  {
    titleKey: "nav.groups.analytics",
    items: [
      { to: "/app/iot", labelKey: "nav.telemetria", icon: Activity },
      { to: "/app/wallet", labelKey: "nav.wallet", icon: Trophy },
    ],
  },
];

const ACCOUNT_ITEMS = [
  { to: "/app/profile", labelKey: "nav.perfil", icon: User },
  { to: "/app/business", labelKey: "nav.business", icon: Store },
  { to: "/app/admin", labelKey: "nav.admin", icon: LayoutDashboard },
];

const MOBILE_NAV = [
  { to: "/app", labelKey: "nav.inicio", icon: Home, end: true },
  { to: "/app/match", labelKey: "nav.matchmaking", icon: Users },
  { to: "/app/map", labelKey: "nav.map_and_courts", icon: Map },
  { to: "/app/feed", labelKey: "nav.comunidad", icon: Rss },
  { to: "/app/chat", labelKey: "nav.mensajes", icon: MessageSquare },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
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
      <div className="min-h-screen bg-background relative flex flex-col overflow-hidden">
        <WorldCupBackground />
        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Filter accounts list dynamically based on permissions
  const filteredAccountItems = ACCOUNT_ITEMS.filter((item) => {
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <WorldCupBackground />
      <div className="relative z-10">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col glass border-r border-border z-30">
          <div className="px-6 py-6 flex items-center justify-between">
            <Link to="/app" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow hover:scale-105 active:scale-95 transition-transform">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-gradient">SportMatch</span>
            </Link>
            <NotificationBell />
          </div>
          <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
            {GROUPS.map((group) => (
              <div key={group.titleKey} className="space-y-1 animate-fade-in">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1.5">
                  {t(group.titleKey)}
                </div>
                {group.items.map((item) => {
                  const active = item.end ? path === item.to : path.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            ))}

            {filteredAccountItems.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border/20">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1.5">
                  {t("nav.groups.account")}
                </div>
                {filteredAccountItems.map((item) => {
                  const active = path.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
          <div className="p-4 m-3 rounded-2xl bg-gradient-card border border-border shadow-card hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="h-10 w-10 rounded-full bg-muted object-cover border border-border/40"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-xs text-neon flex items-center gap-1 mt-0.5 font-medium">
                  <Trophy className="h-3 w-3" /> {currentUser.fitcoins_balance} FC
                </div>
              </div>
              <button
                onClick={handleLogout}
                title={t("nav.logout")}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
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
              <span className="font-bold text-sm tracking-tight text-gradient">SportMatch</span>
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
            {MOBILE_NAV.map((item) => {
              const active = item.end ? path === item.to : path.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
                    active ? "text-neon" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="lg:pl-64 pt-14 lg:pt-0 pb-24 lg:pb-10 min-h-screen flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
