import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Zap, Mail, Lock, Fingerprint } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Ingresar — SportMatch" },
      { name: "description", content: "Iniciá sesión en SportMatch para jugar." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const enter = () => {
    setLoading(true);
    setTimeout(() => nav({ to: "/app" }), 600);
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-hero grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">SportMatch</span>
        </Link>
        <div>
          <h2 className="text-5xl font-extrabold leading-tight">
            Encontrá tu <span className="text-gradient">próximo rival</span> en segundos.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            Más de 12.000 jugadores compitiendo, entrenando y desbloqueando logros cada semana.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 SportMatch</div>
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-gradient-primary opacity-30 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gradient-card border border-border rounded-3xl p-8 shadow-card">
          <h1 className="text-3xl font-bold">Bienvenido de vuelta</h1>
          <p className="text-sm text-muted-foreground mt-1">Iniciá sesión para seguir jugando</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={enter} className="px-4 py-3 rounded-xl glass hover:bg-accent text-sm font-semibold flex items-center justify-center gap-2">
              <span className="text-lg">G</span> Google
            </button>
            <button onClick={enter} className="px-4 py-3 rounded-xl glass hover:bg-accent text-sm font-semibold flex items-center justify-center gap-2">
              <span className="text-lg"></span> Apple
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> o con email <div className="h-px flex-1 bg-border" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enter();
            }}
            className="space-y-3"
          >
            <label className="block">
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-input border border-border focus-within:ring-glow">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input className="bg-transparent outline-none text-sm flex-1" defaultValue="alex@sportmatch.app" />
              </div>
            </label>
            <label className="block">
              <div className="text-xs text-muted-foreground mb-1">Contraseña</div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-input border border-border focus-within:ring-glow">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input type="password" className="bg-transparent outline-none text-sm flex-1" defaultValue="demo1234" />
              </div>
            </label>

            <button
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <button
            onClick={enter}
            className="mt-3 w-full py-3 rounded-xl glass text-sm font-semibold flex items-center justify-center gap-2 hover:bg-accent"
          >
            <Fingerprint className="h-4 w-4 text-neon" /> Ingresar con biometría
          </button>

          <p className="text-xs text-center text-muted-foreground mt-6">
            ¿No tenés cuenta? <span className="text-neon">Crear cuenta</span>
          </p>
        </div>
      </div>
    </div>
  );
}
