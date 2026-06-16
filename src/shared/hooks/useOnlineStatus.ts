// ============================================================
// useOnlineStatus.ts — Hook para detectar conexion a internet
// SCRUM-411: PWA offline
// ============================================================

import { useEffect, useState } from "react";

export type OnlineStatus = "online" | "offline" | "unknown";

export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>(() => {
    if (typeof navigator === "undefined") return "unknown";
    return navigator.onLine ? "online" : "offline";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial state
    setStatus(navigator.onLine ? "online" : "offline");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return status;
}

/** Hook booleano simple */
export function useIsOnline(): boolean {
  return useOnlineStatus() === "online";
}
