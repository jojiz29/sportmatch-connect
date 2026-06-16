// ============================================================
// SecuritySection.tsx — Seguridad: 2FA, sesiones, alertas, eliminar
// ============================================================

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Shield,
  AlertTriangle,
  Monitor,
  MapPin,
  LogOut,
  Trash2,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { SectionCard, SettingRow, ToggleSwitch } from "./SectionCard";
import { useSettingsStore } from "../../model/useSettingsStore";
import { supabase } from "@/shared/api/supabase";
import { toast } from "sonner";

export function SecuritySection() {
  const { t } = useTranslation();
  const {
    preferences,
    sessions,
    updatePreferences,
    loadPreferences,
    loadSessions,
    deleteSession,
    deleteAllOtherSessions,
  } = useSettingsStore();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    loadPreferences();
    loadSessions();
  }, [loadPreferences, loadSessions]);

  if (!preferences) return null;

  const update = (key: keyof typeof preferences, value: unknown) => {
    updatePreferences("security", { [key]: value } as Record<string, unknown>);
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("Mínimo 8 caracteres");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success("Contraseña actualizada");
      setShowChangePassword(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") return;
    toast.error(
      "Para eliminar tu cuenta, contacta a soporte@sportmatch.com desde el email registrado.",
    );
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("settings.security.title", "Seguridad")}
        description={t("settings.security.subtitle", "Protege tu cuenta")}
      >
        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t("settings.security.password", "Contraseña")}
            </span>
          }
        >
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            {showChangePassword
              ? t("common.cancel", "Cancelar")
              : t("settings.security.change_password", "Cambiar")}
          </button>
        </SettingRow>

        {showChangePassword && (
          <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-3">
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder={t("settings.security.current_password", "Contraseña actual")}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg bg-background border border-border/60 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder={t("settings.security.new_password", "Nueva contraseña")}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg bg-background border border-border/60 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <input
              type="password"
              placeholder={t("settings.security.confirm_password", "Confirmar nueva contraseña")}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm"
            />
            <button
              onClick={handleChangePassword}
              disabled={saving || !currentPwd || !newPwd || newPwd !== confirmPwd}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-bold shadow-glow disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {t("settings.common.save", "Guardar")}
            </button>
          </div>
        )}

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("settings.security.two_factor", "Verificación en dos pasos (2FA)")}
            </span>
          }
          description={t(
            "settings.security.two_factor_help",
            "Añade una capa extra con códigos TOTP",
          )}
        >
          <ToggleSwitch
            checked={preferences.two_factor_enabled}
            onChange={(v) => update("two_factor_enabled", v)}
            disabled
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t("settings.security.login_alerts", "Alertas de inicio de sesión")}
            </span>
          }
          description={t("settings.security.login_alerts_help", "Email cuando hay un login nuevo")}
        >
          <ToggleSwitch
            checked={preferences.login_alerts_enabled}
            onChange={(v) => update("login_alerts_enabled", v)}
          />
        </SettingRow>
      </SectionCard>

      <SectionCard
        title={t("settings.security.active_sessions", "Sesiones activas")}
        description={t(
          "settings.security.active_sessions_subtitle",
          "Dispositivos donde tienes la cuenta abierta",
        )}
      >
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              {t("settings.security.no_sessions", "Cargando sesiones...")}
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/40"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span className="truncate">
                        {s.device_label || (s.user_agent?.slice(0, 50) ?? "Dispositivo")}
                      </span>
                      {s.is_current && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500 font-bold">
                          {t("settings.security.session_current", "ACTUAL")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      {s.ip_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {s.ip_address}
                        </span>
                      )}
                      <span>{new Date(s.last_active_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {!s.is_current && (
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title={t("settings.security.session_terminate", "Cerrar sesión")}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {sessions.length > 1 && (
          <button
            onClick={deleteAllOtherSessions}
            className="w-full mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            {t("settings.security.terminate_all_others", "Cerrar todas las demás sesiones")}
          </button>
        )}
      </SectionCard>

      <SectionCard
        title={t("settings.security.danger_zone", "Zona peligrosa")}
        description={t("settings.security.danger_zone_subtitle", "Acciones irreversibles")}
      >
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors font-semibold"
        >
          <Trash2 className="h-4 w-4" />
          {t("settings.security.delete_account", "Eliminar cuenta")}
        </button>
      </SectionCard>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-destructive/30 space-y-4">
            <h3 className="text-lg font-bold text-destructive">
              {t("settings.security.delete_confirm_title", "¿Eliminar tu cuenta?")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(
                "settings.security.delete_account_warning",
                "Esta acción es permanente. Se eliminarán todos tus datos. Escribe ELIMINAR para confirmar.",
              )}
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
              placeholder="ELIMINAR"
              className="w-full px-3 py-2 rounded-lg bg-background border border-destructive/30 text-sm font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-border/60 text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                {t("common.cancel", "Cancelar")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "ELIMINAR"}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold disabled:opacity-50"
              >
                {t("settings.security.delete_account", "Eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
