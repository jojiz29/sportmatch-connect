// ============================================================
// SettingsPage.tsx — Página principal de Configuración
// Layout responsive: sidebar desktop (>=lg) / accordion mobile
// Cmd/Ctrl+K para saltar a sección, save indicator global,
// aria-live para feedback de screen reader
// ============================================================

import { useCallback, useEffect, useState } from "react";
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
  Search,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
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

interface SectionMeta {
  key: SectionKey;
  icon: typeof User;
  titleKey: string;
  subtitleKey: string;
  searchKey: string;
}

const SECTIONS: SectionMeta[] = [
  {
    key: "account",
    icon: User,
    titleKey: "settings.tabs.account",
    subtitleKey: "settings.account_subtitle",
    searchKey: "settings.search.account",
  },
  {
    key: "privacy",
    icon: Lock,
    titleKey: "settings.tabs.privacy",
    subtitleKey: "settings.privacy_subtitle",
    searchKey: "settings.search.privacy",
  },
  {
    key: "notifications",
    icon: Bell,
    titleKey: "settings.tabs.notifications",
    subtitleKey: "settings.notifications_subtitle",
    searchKey: "settings.search.notifications",
  },
  {
    key: "appearance",
    icon: Palette,
    titleKey: "settings.tabs.appearance",
    subtitleKey: "settings.appearance_subtitle",
    searchKey: "settings.search.appearance",
  },
  {
    key: "squads",
    icon: Users,
    titleKey: "settings.tabs.squads",
    subtitleKey: "settings.squads_subtitle",
    searchKey: "settings.search.squads",
  },
  {
    key: "security",
    icon: Shield,
    titleKey: "settings.tabs.security",
    subtitleKey: "settings.security_subtitle",
    searchKey: "settings.search.security",
  },
  {
    key: "blocked",
    icon: UserX,
    titleKey: "settings.tabs.blocked",
    subtitleKey: "settings.blocked_subtitle",
    searchKey: "settings.search.blocked",
  },
  {
    key: "data",
    icon: Database,
    titleKey: "settings.tabs.data",
    subtitleKey: "settings.data_subtitle",
    searchKey: "settings.search.data",
  },
];

function renderSectionByKey(key: SectionKey) {
  switch (key) {
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
}

function SettingsPage() {
  const { t } = useTranslation();
  const { preferences, loading, saving, error, activeSection, setActiveSection, loadPreferences } =
    useSettingsStore();

  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback(
    (key: SectionKey) => {
      setActiveSection(key);
      setPaletteOpen(false);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setActiveSection],
  );

  // Estado de carga / error global
  const showFullPageLoader = loading && !preferences;
  const showFullPageError = !showFullPageLoader && error && !preferences;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 animate-fade-in max-w-7xl">
      <PageHeader
        title={t("settings.title", "Configuración")}
        subtitle={t("settings.subtitle", "Gestiona tu cuenta, privacidad y preferencias")}
      />

      {/* Buscador móvil (botón para abrir palette) */}
      <div className="lg:hidden mt-4">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card/60 backdrop-blur border border-border/40 text-sm text-muted-foreground min-h-[44px]"
          aria-label={t("settings.search.open", "Buscar en configuración")}
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">
            {t("settings.search.placeholder", "Buscar en configuración...")}
          </span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Region live para screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {saving ? t("settings.common.saving", "Guardando...") : ""}
      </div>

      {showFullPageLoader && (
        <div className="flex items-center justify-center h-64 mt-8" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {showFullPageError && (
        <div className="mt-6 p-4 sm:p-6 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{error}</p>
            <button
              type="button"
              onClick={() => loadPreferences()}
              className="mt-2 text-xs underline hover:no-underline"
            >
              {t("settings.common.retry", "Reintentar")}
            </button>
          </div>
        </div>
      )}

      {!showFullPageLoader && !showFullPageError && preferences && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* === Sidebar (desktop) === */}
          <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
            <nav
              aria-label={t("settings.nav_aria", "Secciones de configuración")}
              className="flex flex-col gap-1 p-2 rounded-2xl bg-card/50 backdrop-blur border border-border/40"
            >
              {SECTIONS.map((s) => (
                <SectionNavButton
                  key={s.key}
                  section={s}
                  isActive={activeSection === s.key}
                  onSelect={handleSelect}
                />
              ))}
            </nav>
          </aside>

          {/* === Mobile: Accordion con contenido inline === */}
          <div className="lg:hidden">
            <Accordion
              type="single"
              collapsible
              value={activeSection}
              onValueChange={(v) => v && handleSelect(v as SectionKey)}
              className="rounded-2xl bg-card/60 backdrop-blur border border-border/40 overflow-hidden"
            >
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <AccordionItem
                    key={s.key}
                    value={s.key}
                    className="border-b border-border/30 last:border-b-0 px-1"
                  >
                    <AccordionTrigger className="min-h-[48px] py-3 px-2 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          {t(s.titleKey, s.key)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 px-2">
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        {renderSectionByKey(s.key)}
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* === Desktop: contenido del section activo === */}
          <main className="hidden lg:block min-h-[60vh]">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {renderSectionByKey(activeSection)}
            </motion.div>
          </main>
        </div>
      )}

      {/* Save indicator flotante (top en mobile, top right en desktop) */}
      {saving && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-4 z-40 flex items-center gap-2 px-3 py-2 sm:px-4 rounded-full bg-card/95 backdrop-blur border border-border/40 shadow-lg"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">{t("settings.common.saving", "Guardando...")}</span>
        </div>
      )}

      {/* Command palette (Cmd+K) */}
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput
          placeholder={t("settings.search.placeholder", "Buscar en configuración...")}
        />
        <CommandList>
          <CommandEmpty>{t("settings.search.empty", "Sin resultados")}</CommandEmpty>
          <CommandGroup heading={t("settings.search.heading", "Secciones")}>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <CommandItem
                  key={s.key}
                  value={`${s.key} ${t(s.titleKey, s.key)} ${t(s.searchKey, "")}`}
                  onSelect={() => handleSelect(s.key)}
                  className="py-3"
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(s.titleKey, s.key)}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

interface SectionNavButtonProps {
  section: SectionMeta;
  isActive: boolean;
  onSelect: (key: SectionKey) => void;
}

function SectionNavButton({ section, isActive, onSelect }: SectionNavButtonProps) {
  const { t } = useTranslation();
  const Icon = section.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(section.key)}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap text-left ${
        isActive
          ? "bg-gradient-primary text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{t(section.titleKey, section.key)}</span>
    </button>
  );
}

export default SettingsPage;
