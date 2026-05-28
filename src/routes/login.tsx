import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/entities/user/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Lock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      toast.success(t("login.success_toast"));
      navigate({ to: "/app" });
    } catch (err: unknown) {
      console.error("Error en login:", err);
      const errorMessage = err instanceof Error ? err.message : t("login.error_toast");
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signIn();
      toast.success(t("login.success_toast"));
      navigate({ to: "/app" });
    } catch (err: unknown) {
      console.error("Error en demo login:", err);
      const errorMessage = err instanceof Error ? err.message : t("login.error_toast");
      toast.error(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-gradient-card border border-border rounded-3xl p-8 shadow-card backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow mb-4">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("login.title_signin")}</h1>
          <p className="text-muted-foreground mt-2">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("login.email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="tu@email.com"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("login.password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            {t("login.btn_signin")}
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-3 mt-2 glass text-white font-bold rounded-xl cursor-pointer hover:bg-white/10 active:scale-[0.98] transition-transform"
          >
            Probar Demo
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/app/register" className="text-sm text-primary hover:underline">
            {t("login.toggle_signup")}
          </Link>
        </div>
      </div>
    </div>
  );
}
