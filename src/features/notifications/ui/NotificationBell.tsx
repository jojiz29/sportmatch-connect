// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingBag,
  UserPlus,
  Megaphone,
  Coins,
  X,
  Trophy,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/shared/api/supabase";
import type { AppNotification } from "@/entities/types";

// === BLOQUE: CONTADOR DE REFERENCIAS PARA SUSCRIPCIÓN REALTIME COMPARTIDA ===
// Como pueden montarse múltiples instancias de NotificationBell simultáneamente
// (escritorio y móvil), comparten un mismo canal Realtime para evitar colisiones
// y el error "cannot add postgres_changes callbacks after subscribe()".
let activeChannel: ReturnType<typeof supabase.channel> | null = null;
let activeChannelUserId: string | null = null;
let activeCount = 0;

// === BLOQUE: SONIDO DE SILBATO ===
// Reproduce un doble pitido (1200Hz + 1500Hz) usando la Web Audio API al recibir
// una nueva notificación, simulando el silbato de un árbitro.
function playRefWhistle() {
  try {
    const AudioCtx = window.AudioContext ?? (window.webkitAudioContext as typeof AudioContext);
    const audioCtx = new AudioCtx();
    // Primer pitido: 1200Hz, 0.15s
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.15);
    // Segundo pitido: 1500Hz, 0.25s
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1500, audioCtx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.15);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.warn("Failed to play notification whistle sound:", e);
  }
}

// === BLOQUE: MAPA DE ICONOS POR TIPO DE NOTIFICACIÓN ===
// Asigna un icono de Lucide con color a cada tipo de notificación.
const ICON_MAP: Record<AppNotification["type"], React.ReactNode> = {
  FOLLOW: <UserPlus className="h-4 w-4 text-electric" />,
  SQUAD_INVITE: <ShoppingBag className="h-4 w-4 text-violet-foreground" />,
  TRANSACTION_SUCCESS: <Coins className="h-4 w-4 text-neon" />,
  AD_IMPRESSION: <Megaphone className="h-4 w-4 text-warning" />,
  MATCH_ALERT: <Trophy className="h-4 w-4 text-neon" />,
  SQUAD_MESSAGE: <MessageSquare className="h-4 w-4 text-primary" />,
};

// Colores de fondo/borde para cada tipo de notificación.
const TYPE_COLORS: Record<AppNotification["type"], string> = {
  FOLLOW: "bg-electric/10 border-electric/20",
  SQUAD_INVITE: "bg-violet/10 border-violet/30",
  TRANSACTION_SUCCESS: "bg-neon/10 border-neon/20",
  AD_IMPRESSION: "bg-warning/10 border-warning/20",
  MATCH_ALERT: "bg-neon/10 border-neon/20",
  SQUAD_MESSAGE: "bg-primary/10 border-primary/20",
};

// Calcula el tiempo transcurrido desde una fecha ISO hasta ahora.
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

// ─── Definición de pestañas ────────────────────────────────────────────────────
type TabKey = "TODAS" | "INVITE" | "RESERVE" | "ALERT";
const INVITE_TYPES: AppNotification["type"][] = ["FOLLOW", "SQUAD_INVITE"];
const RESERVE_TYPES: AppNotification["type"][] = ["TRANSACTION_SUCCESS"];
const ALERT_TYPES: AppNotification["type"][] = ["AD_IMPRESSION", "MATCH_ALERT", "SQUAD_MESSAGE"];

const TABS: { key: TabKey; label: string }[] = [
  { key: "TODAS", label: "Todas" },
  { key: "INVITE", label: "Invitaciones" },
  { key: "RESERVE", label: "Reservas" },
  { key: "ALERT", label: "Alertas" },
] as const satisfies { key: TabKey; label: string }[];

function filterByTab(notifs: AppNotification[], tab: TabKey): AppNotification[] {
  switch (tab) {
    case "INVITE":
      return notifs.filter((n) => (INVITE_TYPES as string[]).includes(n.type));
    case "RESERVE":
      return notifs.filter((n) => (RESERVE_TYPES as string[]).includes(n.type));
    case "ALERT":
      return notifs.filter((n) => (ALERT_TYPES as string[]).includes(n.type));
    default:
      return notifs;
  }
}

// ─── Componente principal ──────────────────────────────────────────────────────

// Campana de notificaciones con panel desplegable, pestañas y suscripción Realtime.
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("TODAS");
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  // Carga inicial de notificaciones al montar o cambiar de usuario.
  useEffect(() => {
    if (user) fetchNotifications(user.id);
  }, [user, fetchNotifications]);

  // Suscripción Realtime para notificaciones en vivo (con contador de referencias).
  useEffect(() => {
    if (!user) return;
    const isDemo = useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";
    if (isDemo) return;

    if (activeChannel && activeChannelUserId !== user.id) {
      supabase.removeChannel(activeChannel);
      activeChannel = null;
      activeChannelUserId = null;
      activeCount = 0;
    }

    activeCount++;

    if (!activeChannel) {
      const channelName = `user-notifications-${user.id}`;
      try {
        const existing = supabase
          .getChannels()
          .find((c) => c.topic === `realtime:${channelName}` || c.topic === channelName);
        if (existing) supabase.removeChannel(existing);
      } catch (err) {
        console.warn("Failed to clean up existing notification channel:", err);
      }

      activeChannelUserId = user.id;
      activeChannel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as AppNotification;
            useNotificationStore.setState((state) => {
              if (state.notifications.some((n) => n.id === newNotif.id)) return state;
              return { notifications: [newNotif, ...state.notifications] };
            });
            playRefWhistle();
          },
        )
        .subscribe();
    }

    return () => {
      activeCount--;
      if (activeCount <= 0 && activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
        activeChannelUserId = null;
      }
    };
  }, [user]);

  const userNotifs = user
    ? notifications
        .filter((n) => n.user_id === user.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const unreadCount = userNotifs.filter((n) => !n.is_read).length;

  const unreadByTab: Record<TabKey, number> = {
    TODAS: unreadCount,
    INVITE: userNotifs.filter((n) => !n.is_read && (INVITE_TYPES as string[]).includes(n.type))
      .length,
    RESERVE: userNotifs.filter((n) => !n.is_read && (RESERVE_TYPES as string[]).includes(n.type))
      .length,
    ALERT: userNotifs.filter((n) => !n.is_read && (ALERT_TYPES as string[]).includes(n.type))
      .length,
  };

  const visibleNotifs = filterByTab(userNotifs, activeTab).slice(0, 30);

  // Cierra el panel al hacer clic fuera de él.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleNotifClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.link) {
      setOpen(false);
      navigate({ to: notif.link });
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón de la campana */}
      <button
        onClick={() => setOpen(!open)}
        className="relative h-10 w-10 rounded-xl glass border border-border grid place-items-center hover:bg-accent transition-colors cursor-pointer"
        id="notification-bell-btn"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5 text-foreground" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg"
              id="notification-badge"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panel de notificaciones */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 left-auto top-14 w-[290px] min-[375px]:w-[340px] sm:w-[360px] max-h-[520px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col origin-top-right lg:left-0 lg:right-auto lg:origin-top-left"
            id="notification-panel"
          >
            {/* Cabecera */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
              <h3 className="font-bold text-sm text-foreground">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    id="mark-all-read-btn"
                  >
                    <CheckCheck className="h-3 w-3" /> Leer todas
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-6 w-6 rounded-lg hover:bg-accent grid place-items-center transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Barra de pestañas */}
            <div className="flex border-b border-border/50 px-2 gap-1" role="tablist">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const badgeCount = unreadByTab[tab.key];
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-1 px-2 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "border-b-2 border-primary text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                    }`}
                  >
                    {tab.label}
                    {badgeCount > 0 && (
                      <motion.span
                        key={`tab-badge-${tab.key}-${badgeCount}`}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold leading-none ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-muted-foreground"
                        }`}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto overscroll-contain" id="notification-list">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {visibleNotifs.length > 0 ? (
                    visibleNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left px-4 py-3 flex gap-3 items-start border-b border-border/30 transition-colors cursor-pointer ${
                          notif.is_read ? "hover:bg-accent/30" : "bg-primary/5 hover:bg-primary/10"
                        }`}
                        id={`notif-item-${notif.id}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNotifClick(notif);
                          }
                        }}
                      >
                        <div
                          className={`shrink-0 h-9 w-9 rounded-xl border grid place-items-center mt-0.5 ${TYPE_COLORS[notif.type]}`}
                        >
                          {ICON_MAP[notif.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-semibold truncate ${notif.is_read ? "text-muted-foreground" : "text-foreground"}`}
                            >
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {timeAgo(notif.created_at)}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] mt-0.5 line-clamp-2 ${notif.is_read ? "text-muted-foreground/70" : "text-muted-foreground"}`}
                          >
                            {notif.content}
                          </p>
                          {!notif.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              className="mt-1 text-[10px] text-primary/80 hover:text-primary flex items-center gap-0.5 cursor-pointer"
                            >
                              <Check className="h-3 w-3" /> Marcar leída
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 px-4">
                      <Bell className="h-8 w-8 opacity-30" />
                      <span className="text-xs text-center">
                        {activeTab === "TODAS"
                          ? "No tienes notificaciones aún."
                          : "No hay notificaciones en esta categoría."}
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
