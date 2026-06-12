// === BLOQUE: IMPORTS — Dependencias de la página de demostración ===
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth, useAuthStore } from "@/entities/user/useAuth";
import { User as UserIcon, Store, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// === BLOQUE: Ruta /demo — createFileRoute ===
export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

// === BLOQUE: DemoPage — Página de selección de rol para modo demo ===
// Permite al usuario elegir entre dos roles predefinidos:
//   - PLAYER: explora matchmaking, mapa, feeds y squads.
//   - BUSINESS: gestiona anuncios, perfil comercial y analíticas.
// Activa isDemoMode=true en el store antes de autenticar con la cuenta mock.
function DemoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // === BLOQUE: handleDemoLogin — Autenticación mock según rol ===
  const handleDemoLogin = async (role: "PLAYER" | "BUSINESS") => {
    try {
      // Habilita el modo demo para que el resto de la app sepa que
      // las operaciones son simuladas (sin sesión real de Supabase).
      useAuthStore.setState({ isDemoMode: true });

      // Selecciona la cuenta mock según el rol elegido.
      const targetEmail =
        role === "BUSINESS" ? "megatlon@sportmatch.app" : "ejuniorfloress@gmail.com";
      await signIn(targetEmail);
      toast.success(t("login.success_toast"));

      const user = useAuthStore.getState().user;
      if (user && user.user_role === "BUSINESS") {
        navigate({ to: "/app/business" });
      } else {
        navigate({ to: "/app" });
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Error en demo login:", err);
      const errorMessage = err instanceof Error ? err.message : t("login.error_toast");
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // === BLOQUE: Renderizado — UI de la página de demo ===
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden text-foreground">
      {/* Luces ambientales decorativas */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 rounded-full bg-primary/5 blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 rounded-full bg-secondary/8 blur-[100px] animate-float-reverse" />

      <div className="relative w-full max-w-2xl animate-scale-in">
        {/* Divisor decorativo neón */}
        <div className="neon-divider mb-8 w-24 mx-auto" />

        <div className="bg-gradient-card border border-border/60 rounded-3xl p-8 md:p-10 shadow-card backdrop-blur-md">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl tracking-wide text-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" /> Modo Demostración
            </h1>
            <p className="text-muted-foreground mt-3 text-base">
              Selecciona el tipo de cuenta que deseas simular para explorar la plataforma:
            </p>
          </div>

          {/* === BLOQUE: Grid de selección de rol === */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Opción: Jugador Deportivo */}
            <button
              type="button"
              onClick={() => handleDemoLogin("PLAYER")}
              className="flex flex-col items-center p-6 rounded-2xl border border-border/40 bg-card hover:bg-accent/30 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] group text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-primary grid place-items-center mb-4 shadow-glow group-hover:scale-110 transition-transform">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                Jugador Deportivo
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Busca partidos, interactúa con squads, chatea con otros deportistas y explora el
                mapa de comercios.
              </p>
            </button>

            {/* Opción: Empresa / Comercio */}
            <button
              type="button"
              onClick={() => handleDemoLogin("BUSINESS")}
              className="flex flex-col items-center p-6 rounded-2xl border border-border/40 bg-card hover:bg-accent/30 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] group text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-neon grid place-items-center mb-4 shadow-glow-neon group-hover:scale-110 transition-transform">
                <Store className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold text-lg text-foreground group-hover:text-neon transition-colors">
                Empresa / Comercio
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Publica anuncios promocionales en el ecosistema, gestiona tu perfil comercial y
                consulta analíticas/métricas.
              </p>
            </button>
          </div>

          {/* === BLOQUE: Enlace de regreso al inicio === */}
          <div className="mt-10 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium border-b border-muted-foreground/30 hover:border-foreground pb-0.5"
            >
              Volver al inicio
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-6 tracking-wider uppercase font-semibold">
          SportMatch &mdash; Juega más, esperá menos
        </p>
      </div>
    </div>
  );
}
