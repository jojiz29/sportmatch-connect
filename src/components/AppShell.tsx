import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Users,
  Map,
  MessageSquare,
  Trophy,
  LayoutDashboard,
  User,
  Zap,
  Store,
  LogOut,
  Rss,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, useAuthStore } from "@/entities/user/useAuth";
import { useThemeStore } from "@/features/theme/store";
import { NotificationBell } from "@/features/notifications/ui/NotificationBell";
import { WorldCupBackground } from "@/components/WorldCupBackground";
import { useTranslation } from "react-i18next";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { JuryTour } from "@/components/JuryTour";
import { useTourStore } from "@/shared/hooks/useTourStore";

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
      { to: "/app/wallet", labelKey: "nav.wallet", icon: Trophy },
      { to: "/app/tournaments", labelKey: "nav.torneos", icon: Trophy },
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
  { to: "/app/tournaments", labelKey: "nav.torneos", icon: Trophy },
  { to: "/app/chat", labelKey: "nav.mensajes", icon: MessageSquare },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  const getThemeDetails = () => {
    switch (theme) {
      case "light":
        return {
          title: "Modo Futbolista Oscuro",
          icon: <Sun className="h-5 w-5 text-amber-500 hover:scale-110 transition-transform" />,
        };
      case "dark-footballer":
        return {
          title: "Modo Copa del Mundo",
          icon: <Moon className="h-5 w-5 text-[#39FF14] hover:scale-110 transition-transform" />,
        };
      case "world-cup":
        return {
          title: "Modo Claro",
          icon: (
            <Trophy className="h-5 w-5 text-[#D4AF37] hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]" />
          ),
        };
      default:
        return {
          title: "Cambiar Tema",
          icon: <Moon className="h-5 w-5" />,
        };
    }
  };

  const { title, icon } = getThemeDetails();

  return (
    <button
      onClick={toggleTheme}
      title={title}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all active:scale-90 flex items-center justify-center cursor-pointer"
    >
      {icon}
    </button>
  );
}

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
        <div className="relative z-10 flex-1 flex flex-col">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
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
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col glass border-r border-border/40 z-30">
          <div className="px-5 py-5 flex items-center justify-between border-b border-border/10">
            <Link to="/app" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-110 active:scale-95 transition-all duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="font-heading text-xl tracking-wide text-white">SportMatch</span>
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {GROUPS.map((group) => (
              <div key={group.titleKey} className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 px-3 mb-2">
                  {t(group.titleKey)}
                </div>
                {group.items.map((item) => {
                  const active = item.end ? path === item.to : path.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      id={item.to === "/app/tournaments" ? "tournaments-nav-tour" : undefined}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground/80 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {t(item.labelKey)}
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-glow-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}

            {filteredAccountItems.length > 0 && (
              <div className="space-y-1 pt-4 border-t border-border/10">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 px-3 mb-2">
                  {t("nav.groups.account")}
                </div>
                {filteredAccountItems.map((item) => {
                  const active = path.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground/80 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {t(item.labelKey)}
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-glow-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
          <div className="p-3 m-3 rounded-2xl bg-gradient-card border border-border/40 shadow-card hover:border-primary/20 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="h-10 w-10 rounded-full bg-muted object-cover border border-border/40 group-hover:border-neon/30 transition-colors"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-neon border-2 border-background" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate leading-tight text-foreground/90">
                  {currentUser.name}
                </div>
                <div className="text-xs text-neon/80 flex items-center gap-1 mt-0.5 font-medium">
                  <Trophy className="h-3 w-3" /> {currentUser.fitcoins_balance} FC
                </div>
              </div>
              <button
                onClick={handleLogout}
                title={t("nav.logout")}
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
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
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border/40">
          <div className="grid grid-cols-5 px-1 py-1">
            {MOBILE_NAV.map((item) => {
              const active = item.end ? path === item.to : path.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  id={item.to === "/app/tournaments" ? "tournaments-nav-mobile-tour" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-all duration-200 active:scale-90 rounded-xl ${
                    active
                      ? "text-neon bg-neon/5"
                      : "text-muted-foreground/60 hover:text-foreground"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-all duration-200 ${active ? "bg-neon/10" : ""}`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-neon" : ""}`} />
                  </div>
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="lg:pl-72 pt-14 lg:pt-0 pb-24 lg:pb-10 min-h-screen flex flex-col">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <JuryTour />
      <TourTriggerButton />
    </div>
  );
}

function TourTriggerButton() {
  const { startTour, run } = useTourStore();
  const [showTrigger, setShowTrigger] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "true") {
      setShowTrigger(true);
    }
  }, []);

  if (!showTrigger) return null;

  return (
    <button
      onClick={() => startTour()}
      className="fixed bottom-20 lg:bottom-6 right-4 z-[49] px-4 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(255,87,34,0.6)] border border-orange-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
    >
      <Zap className="h-4 w-4 animate-pulse" />
      <span>{run ? "Tour Activo 🛡️" : "Iniciar Tour Jurado"}</span>
    </button>
  );
}
