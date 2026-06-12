// === BLOQUE: IMPORTS — Dependencias de la página de Squads ===
import { createFileRoute } from "@tanstack/react-router";
import { SquadExplorer } from "@/features/squads/ui/SquadExplorer";

// === BLOQUE: Ruta /app/squads — createFileRoute ===
export const Route = createFileRoute("/app/squads")({
  head: () => ({ meta: [{ title: "Squads — SportMatch" }] }),
  component: SquadsPage,
});

// === BLOQUE: SquadsPage — Página de exploración de squads ===
function SquadsPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
      <SquadExplorer />
    </div>
  );
}
