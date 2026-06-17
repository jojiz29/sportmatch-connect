import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanEye, Video, ShieldCheck, IdCard, Box, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/ai-vision/")({
  component: AiVisionOverview,
});

const tools = [
  {
    to: "/app/ai-vision/form-analyzer",
    title: "Form Analyzer",
    description:
      "Analiza tu técnica deportiva desde video. Sube un clip de 30s y recibe score, recomendaciones y nivel.",
    icon: Video,
    color: "from-blue-500 to-cyan-500",
  },
  {
    to: "/app/ai-vision/fake-profile",
    title: "Fake Profile Detector",
    description:
      "Detecta si una foto de perfil fue generada por IA. Sube la imagen y obtén un score de autenticidad.",
    icon: ShieldCheck,
    color: "from-purple-500 to-pink-500",
  },
  {
    to: "/app/ai-vision/dni-verify",
    title: "Verificación DNI 2.0",
    description: "Compara tu selfie con la foto de tu DNI usando face matching biométrico con IA.",
    icon: IdCard,
    color: "from-amber-500 to-orange-500",
  },
  {
    to: "/app/map",
    title: "AR Court Preview",
    description:
      "Vista previa 3D de canchas deportivas. Ve al mapa y haz clic en el ícono de cubo en cualquier cancha.",
    icon: Box,
    color: "from-emerald-500 to-teal-500",
  },
];

function AiVisionOverview() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
          <ScanEye className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visión por Computadora</h1>
          <p className="text-sm text-muted-foreground">
            Herramientas de análisis visual impulsadas por Vertex AI Gemini
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            params={undefined}
            className="group block bg-gradient-card border border-border/50 rounded-3xl p-6 hover:border-primary/30 hover:shadow-glow transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div
                className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${tool.color} grid place-items-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <tool.icon className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {tool.description}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                  Abrir <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-accent/30 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Nota:</strong> Todas las herramientas requieren
          conexión al backend NestJS con Vertex AI configurado. Los análisis se procesan con Gemini
          2.5 Flash.
        </p>
      </div>
    </div>
  );
}
