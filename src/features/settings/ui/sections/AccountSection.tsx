// ============================================================
// AccountSection.tsx — Sección Cuenta
// Edición de nombre, email (display), bio, ciudad
// La edición real del perfil vive en /app/profile, esta es solo
// una vista de configuración con resumen + link a editar
// ============================================================

import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/entities/user/useAuth";
import { SectionCard, SettingRow } from "./SectionCard";
import { Edit3, ExternalLink, Mail, CheckCircle2 } from "lucide-react";

export function AccountSection() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("settings.account.title", "Cuenta")}
        description={t("settings.account.subtitle", "Información básica de tu perfil")}
      >
        <div className="flex items-center gap-4 p-4 rounded-xl bg-background/40 border border-border/40">
          <img
            src={user.avatar_url || ""}
            alt={user.name || ""}
            className="h-16 w-16 rounded-full bg-muted object-cover border-2 border-border"
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg truncate">
              {user.name || t("settings.account.no_name", "Sin nombre")}
            </div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            {user.user_role && (
              <div className="text-xs text-primary mt-1">
                {user.user_role === "BUSINESS" ? "🏢 Negocio" : "🏆 Jugador"}
              </div>
            )}
          </div>
          <Link
            to="/app/profile"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            {t("settings.common.edit", "Editar")}
          </Link>
        </div>

        <SettingRow
          label={t("settings.account.email", "Correo electrónico")}
          description={t("settings.account.email_help", "Tu email no es público")}
        >
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        </SettingRow>

        <SettingRow
          label={t("settings.account.bio", "Biografía")}
          description={t("settings.account.bio_help", "Cuéntale a otros jugadores sobre ti")}
        >
          <span className="text-sm text-muted-foreground max-w-xs text-right truncate">
            {user.bio || t("settings.account.no_bio", "Sin biografía")}
          </span>
        </SettingRow>

        <SettingRow
          label={t("settings.account.city", "Ciudad")}
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
          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
        >
          <div className="text-sm font-medium">
            {t("settings.account.view_public_profile", "Ver mi perfil público")}
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </Link>
        <Link
          to="/app/wallet"
          search={{ buyItem: undefined }}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
        >
          <div className="text-sm font-medium">
            {t("settings.account.view_wallet", "Ver mi monedero de FitCoins")}
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </Link>
      </SectionCard>
    </div>
  );
}
