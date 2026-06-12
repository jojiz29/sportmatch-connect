// === BLOQUE: Ruta de Torneos Relámpago ===
// Página que renderiza el componente TournamentHub envuelto en
// un ErrorBoundary para manejo de errores.
import { createFileRoute } from "@tanstack/react-router";
import { TournamentHub } from "@/components/TournamentHub";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

export const Route = createFileRoute("/app/tournaments")({
  head: () => ({ meta: [{ title: "Torneos Relámpago — SportMatch" }] }),
  component: TournamentsPage,
});

function TournamentsPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
      <ErrorBoundary>
        <TournamentHub />
      </ErrorBoundary>
    </div>
  );
}

export default TournamentsPage;
