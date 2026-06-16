import { createFileRoute } from "@tanstack/react-router";
import { DniVerification } from "@/features/ai-vision/ui/DniVerification";

export const Route = createFileRoute("/app/ai-vision/dni-verify")({
  head: () => ({
    meta: [
      { title: "Verificación DNI — SportMatch" },
      { name: "description", content: "Verifica tu identidad comparando selfie con foto del DNI" },
    ],
  }),
  component: DniVerifyPage,
});

function DniVerifyPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
      <DniVerification />
    </div>
  );
}
