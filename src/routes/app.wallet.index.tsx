import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { LEADERBOARD } from "@/lib/mock";
import { Trophy, Gift, Zap, Crown, X } from "lucide-react";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/useAuth";

export const Route = createFileRoute("/app/wallet/")({
  head: () => ({ meta: [{ title: "FitCoins — SportMatch" }] }),
  component: Wallet,
});

const REWARDS = [
  { id: "r1", name: "Hora gratis de pádel", cost: 500, emoji: "🏓" },
  { id: "r2", name: "Camiseta SportMatch", cost: 1200, emoji: "👕" },
  { id: "r3", name: "Sesión con entrenador", cost: 2000, emoji: "🏋️" },
  { id: "r4", name: "Pelota oficial", cost: 800, emoji: "⚽" },
];

const CHALLENGES = [
  { id: "ch1", name: "Jugá 3 partidos esta semana", progress: 2, total: 3, reward: 150 },
  { id: "ch2", name: "Mantené Trust Score > 90", progress: 93, total: 100, reward: 200 },
  { id: "ch3", name: "Invitá a 2 amigos", progress: 1, total: 2, reward: 300 },
];

function Wallet() {
  const { t } = useTranslation();
  const { balance, redeem, initWallet } = useWalletStore();
  const [selectedReward, setSelectedReward] = useState<(typeof REWARDS)[0] | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    initWallet();
  }, [initWallet]);

  const handleRedeem = (reward: (typeof REWARDS)[0]) => {
    const success = redeem(reward.cost, `Canje: ${reward.name}`);
    if (success) {
      toast.success(t("wallet.success"), {
        description: t("wallet.success_desc", { reward: reward.name }),
      });
      setSelectedReward(null);
    } else {
      toast.error(t("wallet.error"), { description: t("wallet.error_desc") });
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title={t("wallet.title")} subtitle={t("wallet.subtitle")} />

      <div className="bg-gradient-primary rounded-3xl p-8 shadow-glow relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-neon opacity-20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-sm text-white/80">{t("wallet.balance")}</div>
            <div className="text-6xl font-extrabold text-white flex items-center gap-3">
              {balance}
              <Trophy className="h-10 w-10 text-neon" />
            </div>
            <div className="text-sm text-white/80 mt-2">+185 esta semana ↗</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                document.getElementById("rewards-section")?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-sm hover:scale-105 transition-transform"
            >
              {t("wallet.redeem")}
            </button>
            <Link
              to="/app/wallet/history"
              className="px-4 py-2 rounded-xl glass text-sm inline-block hover:scale-105 transition-transform"
            >
              {t("wallet.history")}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-neon" /> {t("wallet.challenges")}
            </h3>
            <div className="space-y-3">
              {CHALLENGES.map((c) => (
                <div
                  key={c.id}
                  className="bg-gradient-card border border-border rounded-2xl p-4 hover:ring-glow transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-neon flex items-center gap-1">
                      <Trophy className="h-3 w-3" /> +{c.reward}
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-neon"
                      style={{ width: `${(c.progress / c.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {c.progress} / {c.total}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="rewards-section">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4 text-electric" /> {t("wallet.rewards")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {REWARDS.map((r) => (
                <div
                  key={r.id}
                  className="bg-gradient-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:ring-glow transition-all"
                >
                  <div className="text-4xl">{r.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-neon">{r.cost} FC</div>
                  </div>
                  <button
                    onClick={() => setSelectedReward(r)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold hover:scale-105 transition-transform"
                  >
                    {t("wallet.redeem")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-warning" /> {t("wallet.ranking")}
          </h3>
          <div className="bg-gradient-card border border-border rounded-2xl p-3 space-y-1">
            {LEADERBOARD.map((u) => {
              const me = u.name === user?.name;
              return (
                <div
                  key={u.rank}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-all ${me ? "bg-gradient-primary/20 ring-1 ring-primary/40" : "hover:bg-accent/50"}`}
                >
                  <div
                    className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold ${
                      u.rank === 1
                        ? "bg-warning text-black shadow-glow"
                        : u.rank === 2
                          ? "bg-muted-foreground text-black"
                          : u.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-muted"
                    }`}
                  >
                    {u.rank}
                  </div>
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="h-8 w-8 rounded-full bg-muted object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{u.name}</div>
                  </div>
                  <div className="text-xs text-neon">{me ? balance : u.coins}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      <AnimatePresence>
        {selectedReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedReward(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-card p-6 text-center"
            >
              <button
                onClick={() => setSelectedReward(null)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted grid place-items-center hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-6xl mb-4">{selectedReward.emoji}</div>
              <h2 className="text-xl font-bold mb-2">
                {t("wallet.confirm_title", { reward: selectedReward.name })}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("wallet.confirm_desc", { cost: selectedReward.cost })}
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleRedeem(selectedReward)}
                  className="w-full py-3 rounded-xl bg-gradient-neon text-neon-foreground font-semibold hover:shadow-neon transition-shadow"
                >
                  {t("wallet.confirm_btn")}
                </button>
                <button
                  onClick={() => setSelectedReward(null)}
                  className="w-full py-3 rounded-xl glass border border-border font-semibold hover:bg-accent transition-colors"
                >
                  {t("wallet.cancel_btn")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
