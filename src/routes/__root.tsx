// === BLOQUE: IMPORTS — Dependencias del ruta raíz ===
import type { QueryClient } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";

// === BLOQUE: NotFoundComponent — Página 404 personalizada ===
// Se muestra cuando ninguna ruta coincide con la URL solicitada.
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

// === BLOQUE: ErrorComponent — Fallback de errores en tiempo de ejecución ===
// Captura excepciones no controladas durante el renderizado de rutas hijas.
// Ofrece "Reintentar" (invalida el router y resetea el error) o "Volver al inicio".
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// === BLOQUE: RootComponent — Layout principal con animaciones de transición ===
// Envuelve todas las rutas hijas con:
//   - AnimatePresence para animar la salida de la ruta anterior.
//   - motion.div con fade + slide horizontal (20px) en 200ms easeOut.
//   - Toaster (sonner) para notificaciones toast globales.
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/shared/ui/sonner";

function RootComponent() {
  const router = useRouter();
  const match = router.state.matches[router.state.matches.length - 1];

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={match?.id || "root"}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="min-h-screen bg-background"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <Toaster />
    </>
  );
}

// === BLOQUE: Ruta raíz — createRootRouteWithContext ===
// Expone queryClient en el contexto del router para que las rutas hijas
// puedan usar TanStack Query sin necesidad de importar el cliente manualmente.
// notFoundComponent: página 404 cuando ninguna ruta coincide.
// errorComponent: fallback genérico de errores de renderizado.
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
