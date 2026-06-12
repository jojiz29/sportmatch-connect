// === BLOQUE: IMPORTS — Dependencias del matchmaking ===
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Filter, Zap, Globe } from "lucide-react";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { apiClient } from "@/shared/api/apiClient";
import { MatchmakingFeature } from "@/features/matchmaking/MatchmakingFeature";
import { PublicMatchBoard } from "@/features/matchmaking/ui/PublicMatchBoard";
import { useAuthStore } from "@/entities/user/useAuth";
import { useTranslation } from "react-i18next";
import { useState } from "react";

// === BLOQUE: Ruta /app/match/ — createFileRoute con loader y meta tags ===
// Carga el stack de perfiles inicial excluyendo al usuario autenticado.
// pendingComponent: esqueleto de carga con animación pulse.
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
  loader: () => {
    // Excluye al usuario autenticado del stack de swipe.
    // useAuthStore.getState() es seguro aquí — los loaders corren fuera del renderizado React.
    const currentUserId = useAuthStore.getState().user?.id;
    return apiClient.users.getMatches(currentUserId);
  },
  pendingComponent: MatchPendingComponent,
  component: Match,
});

// === BLOQUE: MatchPendingComponent — Esqueleto de carga ===
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

type TabKey = "ia" | "public";

// === BLOQUE: Match — Componente principal de matchmaking ===
// Dos pestañas:
//   - "ia": MatchmakingFeature (swipe de perfiles con algoritmo IA).
//   - "public": PublicMatchBoard (partidos abiertos).
// El loader inicial provee el stack de perfiles para MatchmakingFeature.
function Match() {
  const { t } = useTranslation();
  const initialStack = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<TabKey>("ia");

  if (!initialStack) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader
        title={activeTab === "ia" ? t("matchmaking.title") : "Partidos Públicos"}
        subtitle={
          activeTab === "ia"
            ? t("matchmaking.subtitle")
            : "Únete o crea partidos abiertos cerca de ti"
        }
        action={
          activeTab === "ia" ? (
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm cursor-pointer">
              <Filter className="h-4 w-4" /> {t("matchmaking.filters")}
            </button>
          ) : undefined
        }
      />

      {/* Selector de pestañas (IA / Públicos) */}
      <div className="flex gap-1 p-1 bg-muted/60 border border-border rounded-2xl w-fit mb-6">
        <button
          onClick={() => setActiveTab("ia")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "ia"
              ? "bg-gradient-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:text-foreground"
          }`}
          id="tab-ia-matchmaking"
        >
          <Zap className="h-4 w-4" />
          Matchmaking IA
        </button>
        <button
          onClick={() => setActiveTab("public")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "public"
              ? "bg-gradient-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:text-foreground"
          }`}
          id="tab-public-matches"
        >
          <Globe className="h-4 w-4" />
          Partidos Públicos
        </button>
      </div>

      <ErrorBoundary>
        {activeTab === "ia" ? (
          <MatchmakingFeature initialStack={initialStack} />
        ) : (
          <PublicMatchBoard />
        )}
      </ErrorBoundary>
    </div>
  );
}
