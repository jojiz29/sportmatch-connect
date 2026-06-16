// ============================================================
// SettingsPage.tsx — Página principal de Configuración del usuario
// Tabs: Cuenta, Privacidad, Notificaciones, Apariencia,
//       Squads, Seguridad, Bloqueados, Mis datos
// ============================================================

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  Palette,
  Users,
  Shield,
  UserX,
  Database,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useSettingsStore } from "../model/useSettingsStore";
import { AccountSection } from "./sections/AccountSection";
import { PrivacySection } from "./sections/PrivacySection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { SquadsSection } from "./sections/SquadsSection";
import { SecuritySection } from "./sections/SecuritySection";
import { BlockedUsersSection } from "./sections/BlockedUsersSection";
import { DataExportSection } from "./sections/DataExportSection";
import { PageHeader } from "@/components/PageHeader";
import type { SettingsSection as SectionKey } from "../settings.types";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Configuración — SportMatch" }] }),
  component: SettingsPage,
});

const SECTIONS: {
  key: SectionKey;
  icon: typeof User;
  titleKey: string;
  subtitleKey: string;
}[] = [
  {
    key: "account",
    icon: User,
    titleKey: "settings.tabs.account",
    subtitleKey: "settings.account_subtitle",
  },
  {
    key: "privacy",
    icon: Lock,
    titleKey: "settings.tabs.privacy",
    subtitleKey: "settings.privacy_subtitle",
  },
  {
    key: "notifications",
    icon: Bell,
    titleKey: "settings.tabs.notifications",
    subtitleKey: "settings.notifications_subtitle",
  },
  {
    key: "appearance",
    icon: Palette,
    titleKey: "settings.tabs.appearance",
    subtitleKey: "settings.appearance_subtitle",
  },
  {
    key: "squads",
    icon: Users,
    titleKey: "settings.tabs.squads",
    subtitleKey: "settings.squads_subtitle",
  },
  {
    key: "security",
    icon: Shield,
    titleKey: "settings.tabs.security",
    subtitleKey: "settings.security_subtitle",
  },
  {
    key: "blocked",
    icon: UserX,
    titleKey: "settings.tabs.blocked",
    subtitleKey: "settings.blocked_subtitle",
  },
  {
    key: "data",
    icon: Database,
    titleKey: "settings.tabs.data",
    subtitleKey: "settings.data_subtitle",
  },
];

function SettingsPage() {
  const { t } = useTranslation();
  const { preferences, loading, saving, error, activeSection, setActiveSection, loadPreferences } =
    useSettingsStore();

  // Cargar prefs al montar
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Sección móvil activa (para responsive)
  const [mobileSection, setMobileSection] = useState<SectionKey | null>(null);
  const currentSection = mobileSection ?? activeSection;

  const renderSection = () => {
    if (loading && !preferences) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (error && !preferences) {
      return (
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertTriangle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      );
    }
    if (!preferences) return null;

    switch (currentSection) {
      case "account":
        return <AccountSection />;
      case "privacy":
        return <PrivacySection />;
      case "notifications":
        return <NotificationsSection />;
      case "appearance":
        return <AppearanceSection />;
      case "squads":
        return <SquadsSection />;
      case "security":
        return <SecuritySection />;
      case "blocked":
        return <BlockedUsersSection />;
      case "data":
        return <DataExportSection />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in max-w-7xl">
      <PageHeader
        title={t("settings.title", "Configuración")}
        subtitle={t("settings.subtitle", "Gestiona tu cuenta, privacidad y preferencias")}
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 mt-6">
        {/* Sidebar de tabs (desktop) / Accordion (móvil) */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <nav className="flex lg:flex-col gap-1 p-2 rounded-2xl bg-card/50 backdrop-blur border border-border/40 overflow-x-auto lg:overflow-x-visible">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = currentSection === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    setActiveSection(s.key);
                    setMobileSection(null);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{t(s.titleKey, s.key)}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Contenido de la sección activa */}
        <motion.main
          key={currentSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-[60vh]"
        >
          {saving && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 backdrop-blur border border-border/40 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">{t("settings.common.saving", "Guardando...")}</span>
            </div>
          )}

          {renderSection()}
        </motion.main>
      </div>
    </div>
  );
}

export default SettingsPage;
