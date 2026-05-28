import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Filter } from "lucide-react";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { apiClient } from "@/shared/api/apiClient";
import { MatchmakingFeature } from "@/features/matchmaking/MatchmakingFeature";

export const Route = createFileRoute("/app/match/")({
  head: () => ({
    meta: [
      { title: "Matchmaking IA — SportMatch" },
      {
        name: "description",
        content: "Encuentra a tu rival ideal usando nuestro algoritmo de IA.",
      },
      { property: "og:title", content: "SportMatch - IA Matchmaking" },
      {
        property: "og:description",
        content: "Haz Swipe y encuentra compañeros de deporte de tu mismo nivel.",
      },
      { property: "og:image", content: "https://sportmatch.app/og-match.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => apiClient.users.getMatches(),
  pendingComponent: MatchPendingComponent,
  component: Match,
});

function MatchPendingComponent() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="h-10 w-48 bg-muted animate-pulse rounded-lg mb-2" />
      <div className="h-5 w-72 bg-muted animate-pulse rounded-lg mb-8" />

      <div className="max-w-md mx-auto aspect-[3/4] rounded-3xl bg-gradient-card border border-border p-6 flex flex-col justify-between animate-pulse">
        <div className="w-full h-3/4 bg-muted rounded-2xl mb-4" />
        <div className="space-y-3">
          <div className="h-6 w-3/4 bg-muted rounded-lg" />
          <div className="h-4 w-1/2 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function Match() {
  const initialStack = Route.useLoaderData();

  if (!initialStack) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader
        title="Matchmaking IA"
        subtitle="Deslizá para encontrar tu próximo rival ideal"
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        }
      />

      <ErrorBoundary>
        <MatchmakingFeature initialStack={initialStack} />
      </ErrorBoundary>
    </div>
  );
}
