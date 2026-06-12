// shadcn/ui — Límite de Error (captura errores en el árbol de componentes)
import React from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary atrapó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-destructive/10 border border-destructive/30 rounded-3xl backdrop-blur-md flex flex-col sm:flex-row items-start gap-4 shadow-card animate-scale-in">
          <div className="p-3 bg-destructive/20 rounded-2xl shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-base">Ocurrió un error inesperado.</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
              {this.state.error?.message ||
                "Hubo un problema procesando este componente de la aplicación."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-gradient-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-glow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              Recargar Módulo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
