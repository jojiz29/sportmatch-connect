// === BLOQUE: Ruta /app/match — Layout anidado para sub-rutas de matchmaking ===
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/match")({
  component: () => <Outlet />,
});
