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
        <div className="p-6 m-4 bg-destructive/10 border border-destructive rounded-xl flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
          <div>
            <h3 className="font-semibold text-destructive">Algo salió mal en esta sección.</h3>
            <p className="text-sm text-destructive/80 mt-1">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
