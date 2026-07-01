import { createFileRoute } from "@tanstack/react-router";
import { Nutrition360 } from "@/features/ai-vision/ui/Nutrition360";

export const Route = createFileRoute("/app/ai-vision/nutrition-360")({
  head: () => ({
    meta: [
      { title: "Nutrición 360 — SportMatch" },
      { name: "description", content: "Analiza el valor nutricional de tus comidas por foto" },
    ],
  }),
  component: Nutrition360Page,
});

function Nutrition360Page() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
      <Nutrition360 />
    </div>
  );
}
