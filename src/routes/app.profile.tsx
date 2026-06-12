// === BLOQUE: Ruta /app/profile — Layout anidado para sub-rutas de perfil ===
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/profile")({
  component: () => <Outlet />,
});
