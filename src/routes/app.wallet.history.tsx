import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp, Trophy } from "lucide-react";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export const Route = createFileRoute("/app/wallet/history")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Historial de FitCoins — SportMatch" }] }),
  component: WalletHistory,
});

function WalletHistory() {
  const { t } = useTranslation();
  const { balance, transactions, initWallet } = useWalletStore();

  useEffect(() => {
    initWallet();
  }, [initWallet]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <Link
        to="/app/wallet"
        search={{ buyItem: undefined }}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> {t("wallet.back")}
      </Link>

      <PageHeader title={t("wallet.history_title")} subtitle={t("wallet.history_subtitle")} />

      <div className="bg-gradient-primary rounded-3xl p-6 shadow-glow relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon opacity-20 blur-3xl" />
        <div className="relative">
          <div className="text-sm text-white/80">{t("wallet.balance")}</div>
          <div className="text-4xl font-extrabold text-white flex items-center gap-2 mt-1">
            {balance}
            <Trophy className="h-6 w-6 text-neon" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-border bg-card/50 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-neon" /> {t("wallet.recent_movements")}
            </div>
            <div className="divide-y divide-border">
              {transactions.map((tItem) => {
                const isEarn = tItem.type === "EARN";
                const isPenalty = tItem.type === "PENALTY";

                let badgeStyle = "bg-electric/10 text-electric border-electric/20";
                let typeLabel = t("wallet.spend");
                let icon = <ArrowDownRight className="h-5 w-5" />;

                if (isEarn) {
                  badgeStyle = "bg-neon/10 text-neon border-neon/20";
                  typeLabel = t("wallet.earn");
                  icon = <ArrowUpRight className="h-5 w-5" />;
                } else if (isPenalty) {
                  badgeStyle = "bg-red-500/10 text-red-500 border-red-500/20";
                  typeLabel = t("wallet.penalty");
                  icon = <ArrowDownRight className="h-5 w-5 text-red-500" />;
                }

                return (
                  <div
                    key={tItem.id}
                    className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full grid place-items-center ${
                          isEarn
                            ? "bg-neon/10 text-neon"
                            : isPenalty
                              ? "bg-red-500/10 text-red-500"
                              : "bg-electric/10 text-electric"
                        }`}
                      >
                        {icon}
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex flex-wrap items-center gap-2">
                          <span>{tItem.description}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${badgeStyle}`}
                          >
                            {typeLabel}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(tItem.created_at).toLocaleDateString("es-AR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold ${isEarn ? "text-neon" : "text-foreground"}`}>
                      {isEarn ? "+" : ""}
                      {tItem.amount} FC
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card sticky top-8">
            <h3 className="font-semibold mb-4">{t("wallet.monthly_summary")}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl glass border border-neon/30">
                <span className="text-sm text-muted-foreground">{t("wallet.income")}</span>
                <span className="text-neon font-bold">+400 FC</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl glass border border-destructive/30">
                <span className="text-sm text-muted-foreground">{t("wallet.expenses")}</span>
                <span className="text-foreground font-bold">-500 FC</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-accent">
                <span className="text-sm font-semibold">{t("wallet.net_balance")}</span>
                <span className="font-bold text-destructive">-100 FC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
