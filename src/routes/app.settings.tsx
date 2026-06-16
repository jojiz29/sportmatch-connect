// === BLOQUE: Ruta /app/settings — Configuración del usuario ===
import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/features/settings/ui/SettingsPage";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});
