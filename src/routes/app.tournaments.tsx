import { createFileRoute } from "@tanstack/react-router";
import { TournamentHub } from "@/components/TournamentHub";

export const Route = createFileRoute("/app/tournaments")({
  head: () => ({ meta: [{ title: "Torneos Relámpago — SportMatch" }] }),
  component: TournamentsPage,
});

function TournamentsPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
      <TournamentHub />
    </div>
  );
}
export default TournamentsPage;
