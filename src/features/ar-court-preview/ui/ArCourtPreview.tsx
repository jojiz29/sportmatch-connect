import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  RotateCcw,
  Tag,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { fetchCourtModelData } from "../api/arCourtApi";
import { useArCourtPreviewStore } from "../model/useArCourtPreview";
import { Court3DScene } from "./Court3DScene";

interface ArCourtPreviewProps {
  courtId: string;
}

export function ArCourtPreview({ courtId }: ArCourtPreviewProps) {
  const navigate = useNavigate();
  const store = useArCourtPreviewStore();

  useEffect(() => {
    store.reset();
    store.setLoading(true);
    fetchCourtModelData(courtId)
      .then((data) => store.setData(data))
      .catch((err) =>
        store.setError(err instanceof Error ? err.message : "Error al cargar datos 3D"),
      );
  }, [courtId, store]);

  const { loading, data, error, isFullscreen, showLabels, autoRotate } = store;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando modelo 3D de la cancha...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Error al cargar</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => navigate({ to: "/app/map" })}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Volver al mapa
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const courtInfo = `${data.courtDimensions.length.toFixed(1)} × ${data.courtDimensions.width.toFixed(1)} ${data.courtDimensions.unit}`;

  return (
    <div
      className={`${isFullscreen ? "fixed inset-0 z-50" : "container mx-auto px-4 lg:px-8 py-8"}`}
    >
      {/* Header */}
      <div className={`${isFullscreen ? "absolute top-0 left-0 right-0 z-10" : "mb-6"}`}>
        <div
          className={`flex items-center justify-between ${isFullscreen ? "p-4 bg-gradient-to-b from-black/60 to-transparent" : ""}`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/app/map" })}
              className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{data.courtName}</h1>
              <p className="text-xs text-muted-foreground">
                {data.sport} · {courtInfo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => store.toggleAutoRotate()}
              className={`h-10 w-10 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                autoRotate
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background/80 backdrop-blur-sm border-border hover:bg-accent"
              }`}
              title={autoRotate ? "Desactivar rotación" : "Activar rotación"}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => store.toggleLabels()}
              className={`h-10 w-10 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                showLabels
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background/80 backdrop-blur-sm border-border hover:bg-accent"
              }`}
              title={showLabels ? "Ocultar etiquetas" : "Mostrar etiquetas"}
            >
              <Tag className="h-4 w-4" />
            </button>
            <button
              onClick={() => store.toggleFullscreen()}
              className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3D Scene */}
      <div
        className={`${isFullscreen ? "h-screen w-screen" : "h-[70vh] rounded-3xl overflow-hidden border border-border shadow-card"}`}
      >
        <Court3DScene data={data} autoRotate={autoRotate} showLabels={showLabels} />
      </div>

      {/* Footer info */}
      {!isFullscreen && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Deporte</p>
            <p className="text-sm font-semibold mt-1">{data.sport}</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Dimensiones</p>
            <p className="text-sm font-semibold mt-1">{courtInfo}</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Red / Canasta</p>
            <p className="text-sm font-semibold mt-1">
              {data.hasNet ? "Sí" : "No"}
              {data.hasHoops ? " · Canasta" : ""}
              {data.hasGoals ? " · Arco" : ""}
            </p>
          </div>
          <div className="bg-gradient-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Modelo 3D</p>
            <p className="text-sm font-semibold mt-1">
              {data.arModelUrl ? "Personalizado" : "Generado"}
            </p>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-background/80 backdrop-blur-sm border border-border rounded-2xl px-6 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              Arrastra para rotar · Desplázate para hacer zoom · Rueda para orbitar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
