import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/entities/user/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Lock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

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
];

const ALLOWED_TLDS = [".com", ".pe", ".edu", ".org", ".net"];

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
