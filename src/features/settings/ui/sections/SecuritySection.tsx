// ============================================================
// SecuritySection.tsx — Seguridad: 2FA, sesiones, alertas, eliminar
// Usa Dialog de shadcn (focus trap, Esc, a11y) y AlertDialog
// para confirmaciones destructivas
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
  Info,
} from "lucide-react";
import { SectionCard, SettingRow, ToggleSwitch } from "./SectionCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { useSettingsStore } from "../../model/useSettingsStore";
import { useAuth } from "@/entities/user/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/shared/api/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SecuritySection() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const {
    preferences,
    sessions,
    updatePreferences,
    loadPreferences,
    loadSessions,
    deleteSession,
    deleteAllOtherSessions,
    deleteAccount,
  } = useSettingsStore();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showSessionsLoading, setShowSessionsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
    loadSessions().finally(() => setShowSessionsLoading(false));
  }, [loadPreferences, loadSessions]);

  if (!preferences) return null;

  const update = (key: keyof typeof preferences, value: unknown) => {
    updatePreferences("security", { [key]: value } as Record<string, unknown>);
  };

  const resetPwdForm = () => {
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setPwdError(null);
  };

  const handleChangePassword = async () => {
    setPwdError(null);
    if (newPwd !== confirmPwd) {
      const msg = t("settings.security.password_mismatch", "Las contraseñas no coinciden");
      setPwdError(msg);
      toast.error(msg);
      return;
    }
    if (newPwd.length < 8) {
      const msg = t(
        "settings.security.password_too_short",
        "La contraseña debe tener al menos 8 caracteres",
      );
      setPwdError(msg);
      toast.error(msg);
      return;
    }
    if (!/[A-Za-z]/.test(newPwd) || !/\d/.test(newPwd)) {
      const msg = t("settings.security.password_weak", "La contraseña debe tener letras y números");
      setPwdError(msg);
      toast.error(msg);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success(t("settings.security.password_updated", "Contraseña actualizada"));
      setShowChangePassword(false);
      resetPwdForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setPwdError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") return;
    if (!currentPwd) {
      toast.error(t("settings.security.password_required", "Ingresa tu password para confirmar"));
      return;
    }
    setSaving(true);
    try {
      await deleteAccount(currentPwd, deleteConfirmText);
      toast.success(
        t(
          "settings.security.delete_account_success",
          "Tu cuenta ha sido eliminada. Tus datos fueron anonimizados.",
        ),
      );
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
      setCurrentPwd("");
      // Cerrar sesion despues de un momento
      setTimeout(() => {
        signOut().then(() => navigate({ to: "/login" }));
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar cuenta";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionCard
        title={t("settings.security.title", "Seguridad")}
        description={t("settings.security.subtitle", "Protege tu cuenta")}
      >
        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {t("settings.security.password", "Contraseña")}
            </span>
          }
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showChangePassword) resetPwdForm();
              setShowChangePassword(!showChangePassword);
            }}
            className="min-h-[44px]"
          >
            {showChangePassword
              ? t("common.cancel", "Cancelar")
              : t("settings.security.change_password", "Cambiar")}
          </Button>
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              {t("settings.security.two_factor", "Verificación en dos pasos (2FA)")}
            </span>
          }
          description={t(
            "settings.security.two_factor_help",
            "Añade una capa extra con códigos TOTP",
          )}
        >
          <div className="flex items-center gap-2">
            <ToggleSwitch
              checked={preferences.two_factor_enabled}
              onChange={(v) => update("two_factor_enabled", v)}
              disabled
              label={t("settings.security.two_factor", "Verificación en dos pasos (2FA)")}
            />
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              title={t("settings.security.two_factor_coming_soon", "Próximamente disponible")}
            >
              <Info className="h-3 w-3" />
              {t("settings.security.soon", "Pronto")}
            </span>
          </div>
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              {t("settings.security.login_alerts", "Alertas de inicio de sesión")}
            </span>
          }
          description={t("settings.security.login_alerts_help", "Email cuando hay un login nuevo")}
        >
          <ToggleSwitch
            checked={preferences.login_alerts_enabled}
            onChange={(v) => update("login_alerts_enabled", v)}
            label={t("settings.security.login_alerts", "Alertas de inicio de sesión")}
          />
        </SettingRow>
      </SectionCard>

      {/* Dialog cambio de contraseña */}
      <Dialog
        open={showChangePassword}
        onOpenChange={(o) => {
          setShowChangePassword(o);
          if (!o) resetPwdForm();
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("settings.security.change_password_title", "Cambiar contraseña")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "settings.security.change_password_help",
                "Mínimo 8 caracteres, con letras y números",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder={t("settings.security.current_password", "Contraseña actual")}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-background border border-border/60 text-base sm:text-sm min-h-[44px]"
                aria-invalid={!!pwdError}
                aria-describedby={pwdError ? "pwd-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={
                  showCurrent
                    ? t("settings.security.hide_password", "Ocultar contraseña")
                    : t("settings.security.show_password", "Mostrar contraseña")
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                autoComplete="new-password"
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-background border border-border/60 text-base sm:text-sm min-h-[44px]"
                aria-invalid={!!pwdError}
                aria-describedby={pwdError ? "pwd-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                aria-label={
                  showNew
                    ? t("settings.security.hide_password", "Ocultar contraseña")
                    : t("settings.security.show_password", "Mostrar contraseña")
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <input
              type="password"
              placeholder={t("settings.security.confirm_password", "Confirmar nueva contraseña")}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/60 text-base sm:text-sm min-h-[44px]"
              aria-invalid={!!pwdError}
              aria-describedby={pwdError ? "pwd-error" : undefined}
            />
            {pwdError && (
              <p
                id="pwd-error"
                role="alert"
                className="flex items-center gap-1.5 text-sm text-destructive"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {pwdError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowChangePassword(false);
                resetPwdForm();
              }}
              className="min-h-[44px]"
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={saving || !currentPwd || !newPwd || newPwd !== confirmPwd}
              className="min-h-[44px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saving
                ? t("settings.common.saving", "Guardando...")
                : t("settings.common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionCard
        title={t("settings.security.active_sessions", "Sesiones activas")}
        description={t(
          "settings.security.active_sessions_subtitle",
          "Dispositivos donde tienes la cuenta abierta",
        )}
      >
        <div className="space-y-2">
          {showSessionsLoading ? (
            <div className="flex items-center justify-center p-6" role="status">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              {t("settings.security.no_sessions", "No hay sesiones activas registradas")}
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between gap-2 p-3 rounded-lg border",
                  s.is_current
                    ? "bg-primary/5 border-primary/30"
                    : "bg-background/40 border-border/40",
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                      <span className="truncate max-w-[180px]">
                        {s.device_label || (s.user_agent?.slice(0, 50) ?? "Dispositivo")}
                      </span>
                      {s.is_current && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500 font-bold whitespace-nowrap">
                          {t("settings.security.session_current", "ACTUAL")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                      {s.ip_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {s.ip_address}
                        </span>
                      )}
                      <span className="text-[11px]">
                        {new Date(s.last_active_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {!s.is_current && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSession(s.id)}
                    aria-label={t("settings.security.session_terminate", "Cerrar sesión")}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {sessions.length > 1 && (
          <Button
            variant="ghost"
            onClick={deleteAllOtherSessions}
            className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px]"
          >
            {t("settings.security.terminate_all_others", "Cerrar todas las demás sesiones")}
          </Button>
        )}
      </SectionCard>

      <SectionCard
        title={t("settings.security.danger_zone", "Zona peligrosa")}
        description={t("settings.security.danger_zone_subtitle", "Acciones irreversibles")}
        variant="danger"
      >
        <Button
          variant="outline"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive min-h-[44px]"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t("settings.security.delete_account", "Eliminar cuenta")}
        </Button>
      </SectionCard>

      {/* AlertDialog confirmación eliminar */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(o) => {
          setShowDeleteConfirm(o);
          if (!o) setDeleteConfirmText("");
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {t("settings.security.delete_confirm_title", "¿Eliminar tu cuenta?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "settings.security.delete_account_warning",
                "Esta acción es permanente. Se eliminarán todos tus datos. Escribe ELIMINAR para confirmar.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
            placeholder="ELIMINAR"
            aria-label={t(
              "settings.security.delete_confirm_placeholder",
              "Escribe ELIMINAR en mayúsculas",
            )}
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-destructive/30 text-sm font-mono min-h-[44px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">
              {t("common.cancel", "Cancelar")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "ELIMINAR"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
            >
              {t("settings.security.delete_account", "Eliminar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
