import { createFileRoute } from "@tanstack/react-router";
import { MealPlanner } from "@/features/ai-vision/ui/MealPlanner";

export const Route = createFileRoute("/app/ai-vision/meal-planner")({
  head: () => ({
    meta: [
      { title: "Plan Alimenticio — SportMatch" },
      { name: "description", content: "Genera un plan de alimentación personalizado por IA" },
    ],
  }),
  component: MealPlannerPage,
});

function MealPlannerPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-3xl">
      <MealPlanner />
    </div>
  );
}
