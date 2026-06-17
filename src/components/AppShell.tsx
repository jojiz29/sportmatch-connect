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
  Moon,
  Sun,
  Megaphone,
  TrendingUp,
  Settings,
  Package,
  MapPin,
  Globe,
  ScanEye,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, useAuthStore } from "@/entities/user/useAuth";
import { useThemeStore } from "@/features/theme/store";
import { NotificationBell } from "@/features/notifications/ui/NotificationBell";
import { WorldCupBackground } from "@/components/WorldCupBackground";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { JuryTour } from "@/components/JuryTour";
import { useTourStore } from "@/shared/hooks/useTourStore";
import { AIAvatarButton } from "@/features/ai-assistant/ui/AIAvatarButton";
import { LevelUpModal } from "@/features/profile/components/LevelUpModal";

const ACCOUNT_ITEMS = [
  { to: "/app/profile", labelKey: "nav.perfil", icon: User },
  { to: "/app/settings", labelKey: "nav.settings", icon: Settings },
  { to: "/app/business", labelKey: "nav.business", icon: Store },
  { to: "/app/admin", labelKey: "nav.admin", icon: LayoutDashboard },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "world-cup" ? "Cambiar a Neón Urbano" : "Cambiar a Copa del Mundo"}
      className="h-8 w-8 rounded-full border border-border/40 bg-background/50 hover:bg-accent/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-primary shrink-0"
    >
      {theme === "world-cup" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
    </button>
  );
}

// SCRUM-341 — Selector de idioma para i18next
function LanguageSelector() {
  const currentLng = i18n.language?.split("-")[0] ?? "es";
  const cycle = () => {
    const order: Array<"es" | "en" | "pt"> = ["es", "en", "pt"];
    const idx = order.indexOf(currentLng as "es" | "en" | "pt");
    const next = order[(idx + 1) % order.length];
    i18n.changeLanguage(next);
  };
  return (
    <button
      onClick={cycle}
      title={`Idioma: ${currentLng.toUpperCase()} (click para cambiar)`}
      className="h-8 px-2 rounded-full border border-border/40 bg-background/50 hover:bg-accent/40 active:scale-95 transition-all flex items-center gap-1 cursor-pointer text-primary shrink-0 text-[10px] font-bold"
    >
      <Globe className="h-3.5 w-3.5" />
      {currentLng.toUpperCase()}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const routerState = useRouterState();
  const path = routerState.location.pathname;
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

  const isBusiness = currentUser.user_role === "BUSINESS";

  interface NavItem {
    to: string;
    search?: Record<string, unknown>;
    labelKey: string;
    label?: string;
    icon: React.ComponentType<{ className?: string }>;
    end?: boolean;
  }

  interface NavGroup {
    titleKey: string;
    title?: string;
    items: NavItem[];
  }

  const dynamicGroups: NavGroup[] = isBusiness
    ? [
        {
          titleKey: "nav.groups.business",
          title: "Mi Negocio",
          items: [
            {
              to: "/app/business",
              search: { tab: "profile" },
              labelKey: "nav.business_profile",
              label: "Perfil Comercial",
              icon: Store,
            },
            {
              to: "/app/business",
              search: { tab: "venues" },
              labelKey: "nav.business_venues",
              label: "Mis Sedes",
              icon: MapPin,
            },
            {
              to: "/app/business",
              search: { tab: "ads" },
              labelKey: "nav.business_ads",
              label: "Gestión de Anuncios",
              icon: Megaphone,
            },
            {
              to: "/app/business",
              search: { tab: "catalog" },
              labelKey: "nav.business_catalog",
              label: "Catálogo",
              icon: Package,
            },
            {
              to: "/app/business",
              search: { tab: "analytics" },
              labelKey: "nav.business_analytics",
              label: "Métricas y Alcance",
              icon: TrendingUp,
            },
            {
              to: "/app/business",
              search: { tab: "intelligence" },
              labelKey: "nav.business_intelligence",
              label: "Inteligencia IA",
              icon: Sparkles,
            },
            {
              to: "/app/business",
              search: { tab: "settings" },
              labelKey: "nav.business_settings",
              label: "Configuración",
              icon: Settings,
            },
          ],
        },
      ]
    : [
        {
          titleKey: "nav.groups.action",
          items: [
            { to: "/app", labelKey: "nav.inicio", icon: Home, end: true },
            { to: "/app/match", labelKey: "nav.matchmaking", icon: Users },
            { to: "/app/map", labelKey: "nav.map_comercial", label: "Mapa Comercial", icon: Map },
          ],
        },
        {
          titleKey: "nav.groups.social",
          items: [
            { to: "/app/feed", labelKey: "nav.comunidad", icon: Rss },
            { to: "/app/squads", labelKey: "nav.squads", icon: Shield },
            { to: "/app/chat", labelKey: "nav.mensajes", icon: MessageSquare },
            { to: "/app/tournaments", labelKey: "nav.torneos", icon: Trophy },
          ],
        },
        {
          titleKey: "nav.groups.vision",
          title: "Visión por Computadora",
          items: [
            {
              to: "/app/ai-vision",
              labelKey: "nav.vision_overview",
              label: "Visión General",
              icon: ScanEye,
            },
            {
              to: "/app/ai-vision/form-analyzer",
              labelKey: "nav.vision_form",
              label: "Form Analyzer",
              icon: ScanEye,
            },
            {
              to: "/app/ai-vision/fake-profile",
              labelKey: "nav.vision_fake",
              label: "Fake Profile Detector",
              icon: ScanEye,
            },
            {
              to: "/app/ai-vision/dni-verify",
              labelKey: "nav.vision_dni",
              label: "Verificación DNI",
              icon: ScanEye,
            },
          ],
        },
      ];

  const dynamicMobileNav: NavItem[] = isBusiness
    ? [
        {
          to: "/app/business",
          search: { tab: "profile" },
          labelKey: "nav.business_profile",
          label: "Perfil",
          icon: Store,
        },
        {
          to: "/app/business",
          search: { tab: "venues" },
          labelKey: "nav.business_venues",
          label: "Sedes",
          icon: MapPin,
        },
        {
          to: "/app/business",
          search: { tab: "ads" },
          labelKey: "nav.business_ads",
          label: "Anuncios",
          icon: Megaphone,
        },
        {
          to: "/app/business",
          search: { tab: "analytics" },
          labelKey: "nav.business_analytics",
          label: "Métricas",
          icon: TrendingUp,
        },
        {
          to: "/app/business",
          search: { tab: "settings" },
          labelKey: "nav.business_settings",
          label: "Config",
          icon: Settings,
        },
      ]
    : [
        { to: "/app", labelKey: "nav.inicio", icon: Home, end: true },
        { to: "/app/match", labelKey: "nav.matchmaking", icon: Users },
        { to: "/app/map", labelKey: "nav.map_comercial", label: "Mapa", icon: Map },
        { to: "/app/feed", labelKey: "nav.comunidad", icon: Rss },
        { to: "/app/chat", labelKey: "nav.mensajes", icon: MessageSquare },
        {
          to: "/app/ai-vision",
          labelKey: "nav.vision_overview",
          label: "Visión IA",
          icon: ScanEye,
        },
      ];

  // Filter accounts list dynamically based on permissions
  const filteredAccountItems = ACCOUNT_ITEMS.filter((item) => {
    if (isBusiness) {
      if (item.to === "/app/profile") return false;
      if (item.to === "/app/business") return true;
      if (item.to === "/app/admin") {
        return (
          currentUser.email === "ejuniorfloress@gmail.com" ||
          currentUser.name === "Edwin Flores" ||
          currentUser.is_admin
        );
      }
      return false;
    }
    if (item.to === "/app/business") return false;
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
    <div className="min-h-screen bg-background bg-[url('/images/sports/fondo-sportmatch-app-final.webp')] bg-cover bg-center bg-fixed relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/40 to-background/55 backdrop-blur-md -z-10" />
      <WorldCupBackground />
      <div className="relative z-10">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-80 flex-col bg-background/80 backdrop-blur-xl border-r border-border/30 z-30 shadow-2xl">
          <div className="px-5 py-5 flex items-center justify-between border-b border-border/10">
            <Link
              to={isBusiness ? "/app/business" : "/app"}
              className="flex items-center gap-3 group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-110 active:scale-95 transition-all duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="font-heading text-xl tracking-wide text-foreground">SportMatch</span>
            </Link>
            <div className="flex items-center gap-1">
              <LanguageSelector />
              <ThemeToggle />
              <NotificationBell />
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {dynamicGroups.map((group) => (
              <div key={group.titleKey} className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 px-3 mb-2">
                  {group.title || t(group.titleKey)}
                </div>
                {group.items.map((item) => {
                  const currentSearchTab =
                    (routerState.location.search as { tab?: string })?.tab || "profile";
                  const itemSearchTab = item.search?.tab;
                  const isSamePath = item.end ? path === item.to : path.startsWith(item.to);
                  const active =
                    isSamePath && (!itemSearchTab || itemSearchTab === currentSearchTab);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${item.to}-${item.search?.tab || ""}`}
                      to={item.to}
                      id={
                        item.to === "/app/business" && item.search?.tab
                          ? `business-tab-${item.search.tab}`
                          : item.to === "/app/tournaments"
                            ? "tournaments-nav-tour"
                            : undefined
                      }
                      search={item.search}
                      className={`flex items-center gap-4 px-5 py-3 rounded-xl text-base font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground/80 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-6 w-6 shrink-0" />
                      {item.label || t(item.labelKey)}
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
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 px-3 mb-1.5">
                  {t("nav.groups.account")}
                </div>
                {filteredAccountItems.map((item) => {
                  const active = path.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      id={item.to === "/app/business" ? "sidebar-nav-business" : undefined}
                      className={`flex items-center gap-4 px-5 py-3 rounded-xl text-base font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground/80 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-6 w-6 shrink-0" />
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
                <div
                  id="sidebar-user-name"
                  className="text-sm font-semibold truncate leading-tight text-foreground/90"
                >
                  {currentUser.name}
                </div>
                <Link
                  to="/app/wallet"
                  search={{ buyItem: undefined }}
                  id="sidebar-user-balance"
                  className="text-xs text-neon text-neon/80 hover:text-neon hover:bg-muted/50 cursor-pointer transition-colors rounded px-1.5 py-0.5 -ml-1.5 w-fit flex items-center gap-1 mt-0.5 font-medium"
                >
                  <Trophy className="h-3 w-3" /> {currentUser.fitcoins_balance} FC
                </Link>
                <div className="text-xs text-neon/80 flex items-center gap-1 mt-0.5 font-medium">
                  {isBusiness ? (
                    <span>🏢 {currentUser.business_category}</span>
                  ) : (
                    <span>🏆 {currentUser.level}</span>
                  )}
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
            <Link to={isBusiness ? "/app/business" : "/app"} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight text-gradient">SportMatch</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/app/wallet"
                search={{ buyItem: undefined }}
                className="text-xs text-neon font-semibold flex items-center gap-1 hover:text-neon/80 transition-colors"
              >
                <Trophy className="h-3 w-3" /> {currentUser.fitcoins_balance} FC
              </Link>
              <span className="text-xs text-neon font-semibold flex items-center gap-1">
                {isBusiness ? (
                  <span>🏢 {currentUser.business_category}</span>
                ) : (
                  <span>🏆 {currentUser.level}</span>
                )}
              </span>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border/40">
          <div
            className="grid grid-cols-5 px-1 py-1"
            style={{ gridTemplateColumns: `repeat(${dynamicMobileNav.length}, minmax(0, 1fr))` }}
          >
            {dynamicMobileNav.map((item) => {
              const currentSearchTab =
                (routerState.location.search as { tab?: string })?.tab || "profile";
              const itemSearchTab = item.search?.tab;
              const isSamePath = item.end ? path === item.to : path.startsWith(item.to);
              const active = isSamePath && (!itemSearchTab || itemSearchTab === currentSearchTab);
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.to}-${item.search?.tab || ""}`}
                  to={item.to}
                  id={
                    item.to === "/app/business" && item.search?.tab
                      ? `business-tab-mobile-${item.search.tab}`
                      : item.to === "/app/tournaments"
                        ? "tournaments-nav-mobile-tour"
                        : undefined
                  }
                  search={item.search}
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
                  <span>{item.label || t(item.labelKey)}</span>
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
      <AIAvatarButton />
      <LevelUpModal />
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
      className="fixed bottom-20 lg:bottom-6 right-4 z-[49] px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground font-bold text-xs tracking-wider shadow-glow border border-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
    >
      <Zap className="h-4 w-4 animate-pulse" />
      <span>{run ? "Tour Activo 🛡️" : "Iniciar Tour Jurado"}</span>
    </button>
  );
}
