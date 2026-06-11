import { createFileRoute } from "@tanstack/react-router";
import { NewsFeed } from "@/features/feed/ui/NewsFeed";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

export const Route = createFileRoute("/app/feed")({
  head: () => ({ meta: [{ title: "Comunidad — SportMatch" }] }),
  component: FeedPage,
});

function FeedPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
      <ErrorBoundary>
        <NewsFeed />
      </ErrorBoundary>
    </div>
  );
}
