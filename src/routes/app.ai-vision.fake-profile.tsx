import { createFileRoute } from "@tanstack/react-router";
import { FakeProfileDetector } from "@/features/ai-vision/ui/FakeProfileDetector";

export const Route = createFileRoute("/app/ai-vision/fake-profile")({
  head: () => ({
    meta: [
      { title: "Veracidad de persona — SportMatch" },
      { name: "description", content: "Verifica si una foto muestra una persona real" },
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
