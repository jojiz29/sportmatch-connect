import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Box,
  ChevronDown,
  Crown,
  IdCard,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/ai-vision/")({
  component: AiVisionOverview,
});

const tools = [
  {
    to: "/app/ai-vision/form-analyzer",
    title: "Form Analyzer",
    description:
      "Analiza tecnica deportiva desde video con score, recomendaciones y nivel estimado.",
    icon: Video,
    color: "from-blue-500 to-cyan-500",
    label: "Video",
  },
  {
    to: "/app/ai-vision/fake-profile",
    title: "Fake Profile Detector",
    description: "Evalua si una foto de perfil parece real o generada por IA.",
    icon: ShieldCheck,
    color: "from-purple-500 to-pink-500",
    label: "Perfil",
  },
  {
    to: "/app/ai-vision/dni-verify",
    title: "Verificacion DNI 2.0",
    description: "Compara selfie y documento con matching biometrico asistido por IA.",
    icon: IdCard,
    color: "from-amber-500 to-orange-500",
    label: "Identidad",
  },
  {
    to: "/app/map",
    title: "AR Court Preview",
    description: "Abre la vista 3D de canchas deportivas desde el mapa comercial.",
    icon: Box,
    color: "from-emerald-500 to-teal-500",
    label: "AR",
  },
];

function AiVisionOverview() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
              <ScanEye className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Computer Vision</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  <Crown className="h-3 w-3" />
                  Pro
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Analisis visual avanzado con Vertex AI Gemini
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="group w-full rounded-2xl border border-border/50 bg-gradient-card p-5 text-left shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-glow active:scale-[0.99]"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-primary shadow-glow transition-transform duration-300 group-hover:scale-105">
                <ScanEye className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-foreground">Modulo Computer Vision</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-neon/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-neon">
                    <Sparkles className="h-3 w-3" />
                    Pro
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Form Analyzer, Fake Profile Detector, verificacion DNI y AR Court Preview en un
                  solo modulo.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm font-bold text-foreground md:justify-center">
              <span>{expanded ? "Ocultar herramientas" : "Ver herramientas"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  expanded ? "rotate-180 text-primary" : ""
                }`}
              />
            </div>
          </div>
        </button>

        <div
          className={`grid gap-4 transition-all duration-300 md:grid-cols-2 ${
            expanded
              ? "max-h-[900px] opacity-100"
              : "pointer-events-none max-h-0 overflow-hidden opacity-0"
          }`}
        >
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              params={undefined}
              className="group block rounded-2xl border border-border/50 bg-card/80 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-glow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tool.color} shadow-lg transition-transform group-hover:scale-105`}
                >
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                      {tool.title}
                    </h3>
                    <span className="rounded-full border border-border/50 bg-background/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {tool.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary transition-all group-hover:gap-2">
                    Abrir <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-border/50 bg-accent/30 p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Pro:</strong> Las herramientas usan el backend
            NestJS y Vertex AI para procesar archivos, imagenes y video.
          </p>
        </div>
      </div>
    </div>
  );
}
