import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/entities/user/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Lock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { signInWithGoogle } from "@/services/authService";

export const Route = createFileRoute("/login")({
  component: Login,
});

const ALLOWED_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.com",
  "icloud.com",
  "protonmail.com",
  "sportmatch.app",
  "puka.com",
];

const ALLOWED_TLDS = [".com", ".pe", ".edu", ".org", ".net", ".app"];

function getEmailValidationError(email: string, t: (key: string) => string): string | null {
  if (!email) return null;

  const rfcRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!rfcRegex.test(email)) {
    return t("auth.email_invalid_format");
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return t("auth.email_invalid_format");
  }

  const domain = parts[1].toLowerCase();

  const hasAllowedTld = ALLOWED_TLDS.some((tld) => domain.endsWith(tld));
  if (!hasAllowedTld) {
    return t("auth.email_invalid_tld");
  }

  const isWhitelisted = ALLOWED_DOMAINS.some((allowed) => {
    return domain === allowed || domain.endsWith("." + allowed);
  });

  if (!isWhitelisted) {
    return t("auth.email_invalid_domain");
  }

  return null;
}

function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const emailError = email ? getEmailValidationError(email, t) : null;
  const passwordError = password && password.length < 8 ? t("auth.password_min_length") : null;

  const isFormValid =
    email.length > 0 && password.length >= 8 && emailError === null && passwordError === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error(t("login.error_toast"));
      return;
    }

    try {
      await signIn(email, password);
      toast.success(t("login.success_toast"));
      navigate({ to: "/app" });
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Error en login:", err);
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
      if (import.meta.env.DEV) console.error("Error en demo login:", err);
      const errorMessage = err instanceof Error ? err.message : t("login.error_toast");
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Error en Google login:", err);
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
                className={`w-full pl-10 pr-4 py-2 bg-background border rounded-xl focus:ring-2 focus:ring-primary outline-none ${
                  emailError ? "border-red-500/50" : "border-border"
                }`}
                placeholder={t("login.email_placeholder", { defaultValue: "tu@email.com" })}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-red-500 mt-1 ml-1 animate-fade-in">{emailError}</p>
            )}
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
                className={`w-full pl-10 pr-4 py-2 bg-background border rounded-xl focus:ring-2 focus:ring-primary outline-none ${
                  passwordError ? "border-red-500/50" : "border-border"
                }`}
                placeholder="••••••••"
              />
            </div>
            {passwordError && (
              <p className="text-[11px] text-red-500 mt-1 ml-1 animate-fade-in">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-3 mt-2 bg-gradient-primary disabled:opacity-50 disabled:pointer-events-none text-primary-foreground font-bold rounded-xl shadow-glow cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            {t("login.btn_signin")}
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-3 mt-2 glass text-white font-bold rounded-xl cursor-pointer hover:bg-white/10 active:scale-[0.98] transition-transform"
          >
            {t("login.btn_demo")}
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-border/60" />
            <span className="relative bg-background px-3 text-xs text-muted-foreground uppercase font-semibold">
              {t("auth.or_continue_with", "O continúa con")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white text-black border-2 border-[#39FF14]/50 font-bold rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:border-[#FF6B35] transition-all duration-300 shadow-sm hover:scale-[1.01]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.9-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>{t("auth.continue_with_google", "Continuar con Google")}</span>
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
