// === BLOQUE: IMPORTS — Dependencias de la página de comunidad ===
import { createFileRoute } from "@tanstack/react-router";
import { NewsFeed } from "@/features/feed/ui/NewsFeed";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

// === BLOQUE: Ruta /app/feed — createFileRoute ===
export const Route = createFileRoute("/app/feed")({
  head: () => ({ meta: [{ title: "Comunidad — SportMatch" }] }),
  component: FeedPage,
});

// === BLOQUE: FeedPage — Página de comunidad ===
// Renderiza el feed de publicaciones deportivas (NewsFeed) envuelto en
// un ErrorBoundary para capturar errores de renderizado sin colapsar la app.
function FeedPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
      <ErrorBoundary>
        <NewsFeed />
      </ErrorBoundary>
    </div>
  );
}
