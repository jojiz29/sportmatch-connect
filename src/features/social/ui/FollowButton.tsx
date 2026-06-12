// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
// React hooks para estado local y efectos secundarios.
import React, { useState, useEffect } from "react";
// Servicios de red social: seguir, dejar de seguir y consultar estado.
import { followUser, unfollowUser, isFollowing } from "@/shared/api/socialService";
// Store de autenticación para identificar al usuario actual.
import { useAuthStore } from "@/entities/user/useAuth";
// Store de perfil para actualizar el contador de seguidos en tiempo real.
import { useProfileStore } from "@/features/profile/useProfileStore";
// Notificaciones toast para feedback visual de éxito/error.
import { toast } from "sonner";
// Iconos de Lucide: UserPlus (seguir), UserMinus (dejar de seguir), Loader2 (cargando).
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
// Traducción i18n para textos dinámicos según el idioma.
import { useTranslation } from "react-i18next";

// === BLOQUE: INTERFAZ DE PROPS ===
// Propiedades que recibe el botón de seguir/dejar de seguir.
interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowingNow: boolean) => void;
}

// === BLOQUE: COMPONENTE PRINCIPAL ===
// Componente que muestra un botón para seguir o dejar de seguir a otro usuario.
// Implementa Optimistic UI: el estado visual cambia inmediatamente y se revierte
// en caso de error en la petición al servidor.
export function FollowButton({ targetUserId, onFollowChange }: FollowButtonProps) {
  // Instancia de traducción para textos internacionalizados.
  const { t } = useTranslation();
  // Usuario actualmente autenticado, obtenido del store de auth.
  const currentUser = useAuthStore((state) => state.user);
  // Perfil del usuario actual y función para actualizarlo (contador de seguidos).
  const { profile, updateProfile } = useProfileStore();
  // Estado optimista: indica si actualmente estamos siguiendo al usuario destino.
  const [following, setFollowing] = useState<boolean>(false);
  // Estado de carga mientras se consulta el estado inicial de seguimiento.
  const [loading, setLoading] = useState<boolean>(true);

  // === BLOQUE: EFECTO DE CARGA INICIAL ===
  // Al montar o cambiar el usuario/target, consulta si ya seguimos al usuario destino.
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Bandera para evitar actualizar estado si el componente se desmonta (race condition).
    let active = true;
    async function checkStatus() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const status = await isFollowing(currentUser.id, targetUserId);
        if (active) {
          setFollowing(status);
        }
      } catch (err) {
        console.error("Error checking follow status:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    checkStatus();
    return () => {
      active = false;
    };
  }, [currentUser, targetUserId]);

  // === BLOQUE: AUTO-VERIFICACIÓN ===
  // No renderiza nada si el usuario no está autenticado o si intenta seguirse a sí mismo.
  if (!currentUser || currentUser.id === targetUserId) {
    return null;
  }

  // === BLOQUE: MANEJADOR DE SEGUIR/DEJAR DE SEGUIR ===
  // Alterna el estado de seguimiento con actualización optimista y rollback en fallo.
  const handleToggleFollow = async () => {
    if (!currentUser) return;

    // Guarda el estado anterior por si hay que revertir (rollback).
    const previousState = following;

    // 1. Optimistic Updates
    // Cambia el estado local del botón inmediatamente (sin esperar al servidor).
    setFollowing(!previousState);

    // Notifica al componente padre del cambio optimista (ej. actualizar contadores).
    if (onFollowChange) {
      onFollowChange(!previousState);
    }

    // Actualiza el contador de "siguiendo" del perfil local de forma optimista.
    if (profile) {
      const currentFollowingCount = profile.following_count ?? 0;
      updateProfile({
        following_count: previousState
          ? Math.max(0, currentFollowingCount - 1)
          : currentFollowingCount + 1,
      });
    }

    // 2. Perform background request
    // Ejecuta la operación real en el servidor (seguir o dejar de seguir).
    try {
      if (previousState) {
        // Si ya seguía, ahora deja de seguir.
        await unfollowUser(currentUser.id, targetUserId);
        toast.success(
          t("profile.unfollow_success", { defaultValue: "Dejaste de seguir a este usuario." }),
        );
      } else {
        // Si no seguía, ahora empieza a seguir.
        await followUser(currentUser.id, targetUserId);
        toast.success(
          t("profile.follow_success", { defaultValue: "¡Ahora sigues a este usuario!" }),
        );
      }
    } catch (error) {
      // 3. Rollback on failure
      // Si la petición falla, restaura el estado anterior (deshace el cambio optimista).
      setFollowing(previousState);
      if (onFollowChange) {
        onFollowChange(previousState);
      }
      if (profile) {
        // Reversión del contador de seguidos.
        const currentFollowingCount = profile.following_count ?? 0;
        updateProfile({
          following_count: previousState
            ? currentFollowingCount + 1
            : Math.max(0, currentFollowingCount - 1),
        });
      }
      console.error("Follow operation failed:", error);
      toast.error(t("profile.follow_error", { defaultValue: "Error al procesar la solicitud." }), {
        description:
          error instanceof Error
            ? error.message
            : t("profile.try_again_later", { defaultValue: "Inténtalo de nuevo más tarde." }),
      });
    }
  };

  // === BLOQUE: RENDERIZADO EN ESTADO DE CARGA ===
  // Muestra un botón deshabilitado con spinner mientras se consulta el estado inicial.
  if (loading) {
    return (
      <button
        disabled
        className="w-full py-3 rounded-xl border border-border bg-card text-muted-foreground flex items-center justify-center gap-2 text-sm font-semibold transition-all"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("common.loading", { defaultValue: "Cargando..." })}
      </button>
    );
  }

  // === BLOQUE: RENDERIZADO PRINCIPAL ===
  // Botón que alterna entre "Siguiendo" (estilo acento) y "Seguir" (estilo primary).
  return (
    <button
      onClick={handleToggleFollow}
      className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
        following
          ? "bg-accent text-accent-foreground border border-border shadow-sm hover:bg-accent/80"
          : "bg-foreground text-background shadow-md hover:bg-foreground/90"
      }`}
    >
      {following ? (
        <>
          <UserMinus className="h-4 w-4" />{" "}
          {t("profile.following_status", { defaultValue: "Siguiendo" })}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> {t("profile.follow", { defaultValue: "Seguir" })}
        </>
      )}
    </button>
  );
}
export default FollowButton;
