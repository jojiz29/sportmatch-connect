// ============================================================
// app.ai-vision.tsx — Ruta de navegación para el AI Vision Hub
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { AiVisionDashboard } from "@/features/ai-vision/components/AiVisionDashboard";

export const Route = createFileRoute("/app/ai-vision")({
  head: () => ({ meta: [{ title: "AI Vision Hub — SportMatch" }] }),
  component: AiVisionPage,
});

function AiVisionPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
      <AiVisionDashboard />
    </div>
  );
}
