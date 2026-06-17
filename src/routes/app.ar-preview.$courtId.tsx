import { createFileRoute } from "@tanstack/react-router";
import { ArCourtPreview } from "@/features/ar-court-preview/ui/ArCourtPreview";

export const Route = createFileRoute("/app/ar-preview/$courtId")({
  head: () => ({
    meta: [
      { title: "Vista 3D — SportMatch" },
      { name: "description", content: "Vista previa 3D de la cancha deportiva" },
    ],
  }),
  component: ArPreviewPage,
});

function ArPreviewPage() {
  const { courtId } = Route.useParams();
  return <ArCourtPreview courtId={courtId} />;
}
