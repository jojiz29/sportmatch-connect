// ============================================================
// AccountSection.tsx — Sección Cuenta
// Vista resumida del perfil + enlaces a editar/wallet/perfil
// público
// ============================================================

import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Edit3, ExternalLink, Mail, CheckCircle2, Wallet, Globe } from "lucide-react";
import { useAuthStore } from "@/entities/user/useAuth";
import { SectionCard, SettingRow } from "./SectionCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

export function AccountSection() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionCard
        title={t("settings.account.title", "Cuenta")}
        description={t("settings.account.subtitle", "Información básica de tu perfil")}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-background/40 border border-border/40">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={user.avatar_url || ""} alt={user.name || ""} />
            <AvatarFallback className="text-base font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base sm:text-lg truncate">
              {user.name || t("settings.account.no_name", "Sin nombre")}
            </div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            {user.user_role && (
              <div className="text-xs text-primary mt-1 inline-flex items-center gap-1">
                {user.user_role === "BUSINESS" ? "🏢 Negocio" : "🏆 Jugador"}
              </div>
            )}
          </div>
          <Link
            to="/app/profile"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors min-h-[44px]"
          >
            <Edit3 className="h-4 w-4" />
            {t("settings.common.edit", "Editar")}
          </Link>
        </div>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {t("settings.account.email", "Correo electrónico")}
            </span>
          }
          description={t("settings.account.email_help", "Tu email no es público")}
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="truncate max-w-[200px]">{user.email}</span>
            <CheckCircle2
              className="h-4 w-4 text-green-500 shrink-0"
              aria-label={t("settings.account.email_verified", "Verificado")}
            />
          </div>
        </SettingRow>

        <SettingRow
          label={t("settings.account.bio", "Biografía")}
          description={t("settings.account.bio_help", "Cuéntale a otros jugadores sobre ti")}
        >
          <span className="text-sm text-muted-foreground max-w-[200px] sm:max-w-xs text-right truncate">
            {user.bio || t("settings.account.no_bio", "Sin biografía")}
          </span>
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              {t("settings.account.city", "Ciudad")}
            </span>
          }
          description={t("settings.account.city_help", "Para partidos cerca de ti")}
        >
          <span className="text-sm text-muted-foreground">
            {user.city || t("settings.account.no_city", "Sin ciudad")}
          </span>
        </SettingRow>
      </SectionCard>

      <SectionCard
        title={t("settings.account.quick_links", "Enlaces rápidos")}
        description={t("settings.account.quick_links_help", "Gestiona más opciones de tu cuenta")}
      >
        <Link
          to="/app/profile/$userId"
          params={{ userId: user.id }}
          className="flex items-center justify-between gap-2 p-3 min-h-[48px] rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors group"
        >
          <span className="text-sm font-medium">
            {t("settings.account.view_public_profile", "Ver mi perfil público")}
          </span>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </Link>
        <Link
          to="/app/wallet"
          search={{ buyItem: undefined }}
          className="flex items-center justify-between gap-2 p-3 min-h-[48px] rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors group"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            {t("settings.account.view_wallet", "Ver mi monedero de FitCoins")}
          </span>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </Link>
      </SectionCard>
    </div>
  );
}
