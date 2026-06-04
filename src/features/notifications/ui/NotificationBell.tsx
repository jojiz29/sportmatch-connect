import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, ShoppingBag, UserPlus, Megaphone, Coins, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { useNavigate } from "@tanstack/react-router";
import type { AppNotification } from "@/entities/types";

const ICON_MAP: Record<AppNotification["type"], React.ReactNode> = {
  FOLLOW: <UserPlus className="h-4 w-4 text-electric" />,
  SQUAD_INVITE: <ShoppingBag className="h-4 w-4 text-violet-foreground" />,
  TRANSACTION_SUCCESS: <Coins className="h-4 w-4 text-neon" />,
  AD_IMPRESSION: <Megaphone className="h-4 w-4 text-warning" />,
};

const TYPE_COLORS: Record<AppNotification["type"], string> = {
  FOLLOW: "bg-electric/10 border-electric/20",
  SQUAD_INVITE: "bg-violet/10 border-violet/30",
  TRANSACTION_SUCCESS: "bg-neon/10 border-neon/20",
  AD_IMPRESSION: "bg-warning/10 border-warning/20",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  const userNotifs = user
    ? notifications
        .filter((n) => n.user_id === user.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const unreadCount = userNotifs.filter((n) => !n.is_read).length;

  // Close panel on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
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
      {/* Bell Button */}
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

      {/* Notification Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-14 w-[360px] max-h-[480px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            id="notification-panel"
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
              <h3 className="font-bold text-sm">Notificaciones</h3>
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

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto overscroll-contain" id="notification-list">
              {userNotifs.length > 0 ? (
                userNotifs.slice(0, 30).map((notif) => (
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
                      className={`shrink-0 h-9 w-9 rounded-xl border grid place-items-center mt-0.5 ${
                        TYPE_COLORS[notif.type]
                      }`}
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
                  <span className="text-xs text-center">No tienes notificaciones aún.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
