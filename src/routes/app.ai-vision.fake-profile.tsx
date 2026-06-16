import { createFileRoute } from "@tanstack/react-router";
import { FakeProfileDetector } from "@/features/ai-vision/ui/FakeProfileDetector";

export const Route = createFileRoute("/app/ai-vision/fake-profile")({
  head: () => ({
    meta: [
      { title: "Fake Profile Detector — SportMatch" },
      { name: "description", content: "Detecta si una foto de perfil fue generada por IA" },
    ],
  }),
  component: FakeProfilePage,
});

function FakeProfilePage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
      <FakeProfileDetector />
    </div>
  );
}
