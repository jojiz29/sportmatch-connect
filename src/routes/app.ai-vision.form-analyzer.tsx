import { createFileRoute } from "@tanstack/react-router";
import { FormAnalyzer } from "@/features/ai-vision/ui/FormAnalyzer";

export const Route = createFileRoute("/app/ai-vision/form-analyzer")({
  head: () => ({
    meta: [
      { title: "Form Analyzer — SportMatch" },
      { name: "description", content: "Analiza tu técnica deportiva con inteligencia artificial" },
    ],
  }),
  component: FormAnalyzerPage,
});

function FormAnalyzerPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <FormAnalyzer />
    </div>
  );
}
