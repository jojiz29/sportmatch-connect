// ============================================================
// OfflineBanner.tsx — Banner que aparece cuando no hay conexion
// SCRUM-411
// ============================================================

import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  readonly className?: string;
  /** Si true, el banner se muestra sticky en la parte superior */
  readonly sticky?: boolean;
}

export function OfflineBanner({ className, sticky = false }: OfflineBannerProps) {
  const { t } = useTranslation();
  const status = useOnlineStatus();
  const isOffline = status === "offline";

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className={cn(
            "z-50 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium",
            "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-b border-amber-500/30",
            sticky && "sticky top-0",
            className,
          )}
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("offline.banner", "Sin conexion. Mostrando los ultimos datos guardados.")}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
