import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  Trophy,
  Gift,
  Zap,
  Crown,
  X,
  ShoppingBag,
  Loader2,
  Send,
  History,
  Award,
} from "lucide-react";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/useAuth";
import { getCatalogItems, purchaseCatalogItem } from "@/shared/api/businessService";
import { CatalogItem, User } from "@/entities/types";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { Reward } from "@/services/walletService";
import { TransferFitCoinsModal } from "@/features/wallet/ui/TransferFitCoinsModal";

export const Route = createFileRoute("/app/wallet/")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "FitCoins — SportMatch" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    buyItem: (search.buyItem as string) || undefined,
  }),
  component: Wallet,
});

function getRewardEmoji(category: string | null, title: string): string {
  const cat = (category || "").toLowerCase();
  const t = title.toLowerCase();
  if (cat.includes("cancha") || t.includes("padel") || t.includes("pádel")) return "🏓";
  if (cat.includes("bebida") || t.includes("drink") || t.includes("powerade")) return "🥤";
  if (cat.includes("equip") || t.includes("ball") || t.includes("pelota")) return "⚽";
  if (cat.includes("ropa") || cat.includes("shirt") || t.includes("camiseta")) return "👕";
  return "🎁";
}

function Wallet() {
  const { t } = useTranslation();
  const { balance, redeem, initWallet, challenges, progressChallenge, claimChallenge } =
    useWalletStore();

  const [transferOpen, setTransferOpen] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { buyItem } = Route.useSearch();
  const [leaderboardUsers, setLeaderboardUsers] = useState<User[]>([]);

  useEffect(() => {
    let active = true;

    // Try backend first for leaderboard, fallback to Supabase
    backendApi.users
      .getLeaderboard()
      .then((backendUsers) => {
        if (active) setLeaderboardUsers(backendUsers as User[]);
      })
      .catch(() => {
        apiClient.users
          .getLeaderboard()
          .then((users) => {
            if (active) setLeaderboardUsers(users);
          })
          .catch((err) => {
            if (import.meta.env.DEV) console.error("Error loading leaderboard users:", err);
          });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    initWallet();
  }, [initWallet]);

  useEffect(() => {
    async function loadRewards() {
      try {
        setLoadingRewards(true);
        const { getRewards } = await import("@/services/walletService");
        const list = await getRewards();
        setRewards(list);
      } catch (err) {
        console.error("Failed to load rewards from DB:", err);
        const fallbackRewards: Reward[] = [
          {
            id: "00000000-0000-0000-0000-000000000091",
            title: "Hora gratis de pádel",
            cost_fitcoins: 500,
            description: "Descuento para una hora de alquiler de cancha de pádel.",
            stock: 50,
            image_url: "",
            category: "Canchas",
          },
          {
            id: "00000000-0000-0000-0000-000000000092",
            title: "Powerade Sports Drink",
            cost_fitcoins: 50,
            description: "Bebida isotónica Powerade de 500ml.",
            stock: 100,
            image_url: "",
            category: "Bebidas",
          },
          {
            id: "00000000-0000-0000-0000-000000000093",
            title: "Pelota oficial",
            cost_fitcoins: 800,
            description: "Pelota oficial de tenis o fútbol.",
            stock: 25,
            image_url: "",
            category: "Equipamiento",
          },
          {
            id: "00000000-0000-0000-0000-000000000094",
            title: "Camiseta SportMatch",
            cost_fitcoins: 1200,
            description: "Camiseta oficial técnica transpirable.",
            stock: 30,
            image_url: "",
            category: "Ropa",
          },
        ];
        setRewards(fallbackRewards);
      } finally {
        setLoadingRewards(false);
      }
    }
    loadRewards();
  }, []);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await getCatalogItems();
        // Don't show current logged in business's own products to buy
        const filtered = user ? data.filter((i) => i.business_id !== user.id) : data;
        setCatalog(filtered);

        // Auto-open purchase modal if buyItem search param is present
        if (buyItem && filtered.length > 0) {
          const target = filtered.find((item) => item.id === buyItem);
          if (target) {
            setSelectedItem(target);
            // Scroll to marketplace section
            setTimeout(() => {
              document
                .getElementById("marketplace-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }, 300);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Failed to load catalog:", err);
      }
    }
    loadCatalog();
  }, [user, buyItem]);

  const handleRedeem = async (reward: Reward) => {
    const rewardName = t(`wallet.reward_${reward.id}_name`, { defaultValue: reward.title });
    const success = await redeem(reward.cost_fitcoins, `Canje: ${rewardName}`, reward.id);
    if (success) {
      toast.success(t("wallet.success"), {
        description: t("wallet.success_desc", { reward: rewardName }),
      });
      setSelectedReward(null);
      // Reload rewards to update stock
      try {
        const { getRewards } = await import("@/services/walletService");
        const list = await getRewards();
        setRewards(list);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handlePurchase = async (item: CatalogItem) => {
    if (!user) return;
    try {
      setPurchasing(true);
      const success = await purchaseCatalogItem(user.id, item.id);
      if (success) {
        toast.success(t("wallet.purchase_success"), {
          description: t("wallet.purchase_success_desc", { name: item.name }),
        });
        initWallet();
        setSelectedItem(null);
      } else {
        toast.error(t("wallet.purchase_error"), {
          description: t("wallet.purchase_error_desc"),
        });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error(t("wallet.purchase_failed"));
    } finally {
      setPurchasing(false);
    }
  };

  const leaderboard = useMemo(() => {
    const list = [...leaderboardUsers];
    if (user && !list.some((u) => u.id === user.id)) {
      list.push(user);
    }
    return list
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar_url,
        coins: u.id === user?.id ? balance : u.fitcoins_balance,
        isMe: u.id === user?.id,
      }))
      .sort((a, b) => b.coins - a.coins)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }, [leaderboardUsers, user, balance]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title={t("wallet.title")} subtitle={t("wallet.subtitle")} />

      {/* Balance Banner + Action Hub */}
      <div className="bg-gradient-primary rounded-3xl p-8 shadow-glow relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-neon opacity-20 blur-3xl" />
        <div className="absolute -left-6 -bottom-6 h-40 w-40 rounded-full bg-electric opacity-10 blur-2xl" />
        <div className="relative">
          {/* Balance display */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">
              {t("wallet.balance")}
            </div>
            <motion.div
              key={balance}
              initial={{ scale: 1.06, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="text-6xl font-extrabold text-white flex items-end gap-3 leading-none"
            >
              <span>{balance.toLocaleString()}</span>
              <span className="text-2xl font-bold text-neon mb-1">FC</span>
              <Trophy className="h-9 w-9 text-neon mb-0.5" />
            </motion.div>
            <div className="text-sm text-white/70 mt-2">
              {t("wallet.this_week_gain", { amount: 185 })}
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap gap-2">
            {/* Transferir */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTransferOpen(true)}
              id="wallet-transfer-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/30 transition-colors border border-white/20 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Transferir
            </motion.button>

            {/* Canjear */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                document.getElementById("rewards-section")?.scrollIntoView({ behavior: "smooth" })
              }
              id="wallet-redeem-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon text-neon-foreground text-sm font-semibold hover:shadow-neon transition-all border border-neon/30 cursor-pointer"
            >
              <Award className="h-4 w-4" />
              {t("wallet.redeem")}
            </motion.button>

            {/* Historial */}
            <Link
              to="/app/wallet/history"
              id="wallet-history-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-white text-sm font-semibold hover:bg-white/10 transition-colors border border-white/10"
            >
              <History className="h-4 w-4" />
              {t("wallet.history")}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Challenges */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-neon" /> {t("wallet.challenges")}
            </h3>
            <div className="space-y-3">
              {challenges?.map((c) => {
                const isCompleted = c.progress >= c.total;
                return (
                  <div
                    key={c.id}
                    className="bg-gradient-card border border-border rounded-2xl p-4 hover:ring-glow transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">{c.name}</div>
                        {c.claimed && (
                          <span className="text-[10px] text-neon bg-neon/10 border border-neon/20 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {t("wallet.claimed")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neon flex items-center gap-1 font-semibold">
                        <Trophy className="h-3 w-3" /> +{c.reward}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-neon"
                        style={{ width: `${(c.progress / c.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {c.progress} / {c.total}
                      </span>
                      {!c.claimed ? (
                        <div className="flex gap-2">
                          {c.progress < c.total && (
                            <button
                              onClick={() => progressChallenge(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-accent text-[11px] font-semibold hover:bg-accent/80 transition-colors cursor-pointer"
                            >
                              {t("wallet.advance")}
                            </button>
                          )}
                          {isCompleted && (
                            <button
                              onClick={() => claimChallenge(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-gradient-neon text-neon-foreground text-[11px] font-bold hover:shadow-neon transition-shadow cursor-pointer"
                            >
                              {t("wallet.claim")}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic font-semibold text-neon">
                          {t("wallet.completed")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official Rewards */}
          <div id="rewards-section">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4 text-electric" /> {t("wallet.rewards")}
              {loadingRewards && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {rewards.map((r) => {
                const rewardName = t(`wallet.reward_${r.id}_name`, { defaultValue: r.title });
                const emoji = getRewardEmoji(r.category, r.title);
                return (
                  <div
                    key={r.id}
                    className="bg-gradient-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:ring-glow transition-all"
                  >
                    <div className="text-4xl">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{rewardName}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                      <div className="text-xs text-neon mt-1 font-bold">
                        {r.cost_fitcoins} FC ·{" "}
                        <span className="text-muted-foreground">Stock: {r.stock}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReward(r)}
                      disabled={r.stock <= 0}
                      className="px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {r.stock > 0 ? t("wallet.redeem") : t("wallet.no_stock")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B2B Business Marketplace Catalog */}
          <div className="mt-8" id="marketplace-section">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-neon" /> {t("wallet.business_marketplace")}
            </h3>
            {catalog.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3 animate-fade-in">
                {catalog.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gradient-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:ring-glow transition-all"
                  >
                    <img
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1546429070-1fc422f1d77a"
                      }
                      alt={item.name}
                      className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon/10 text-neon border border-neon/20 font-semibold uppercase">
                        {item.type === "PRODUCT" ? t("wallet.product") : t("wallet.service")}
                      </span>
                      <div className="text-sm font-semibold truncate mt-1">{item.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                      <div className="text-xs font-bold text-neon mt-0.5">{item.price} FC</div>
                    </div>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-neon text-neon-foreground text-xs font-semibold hover:scale-105 transition-transform shrink-0 cursor-pointer"
                      id={`purchase-btn-${item.id}`}
                    >
                      {t("wallet.buy")}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground glass border border-border rounded-2xl text-xs">
                {t("wallet.no_products")}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-warning" /> {t("wallet.ranking")}
          </h3>
          <div className="bg-gradient-card border border-border rounded-2xl p-3 space-y-1">
            {leaderboard.map((u) => {
              const me = u.name === user?.name;
              const toPath = me ? "/app/profile" : "/app/profile/$userId";
              const linkParams = me ? undefined : { userId: u.id || "" };

              return (
                <Link
                  key={u.rank}
                  to={toPath}
                  params={linkParams}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-all ${me ? "bg-gradient-primary/20 ring-1 ring-primary/40" : "hover:bg-accent/50"} cursor-pointer w-full text-left`}
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
                  <div className="text-xs text-neon">{u.coins}</div>
                </Link>
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

              <div className="text-6xl mb-4">
                {getRewardEmoji(selectedReward.category, selectedReward.title)}
              </div>
              <h2 className="text-xl font-bold mb-2">
                {t("wallet.confirm_title", {
                  reward: t(`wallet.reward_${selectedReward.id}_name`, {
                    defaultValue: selectedReward.title,
                  }),
                })}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("wallet.confirm_desc", { cost: selectedReward.cost_fitcoins })}
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleRedeem(selectedReward)}
                  className="w-full py-3 rounded-xl bg-gradient-neon text-neon-foreground font-semibold hover:shadow-neon transition-shadow cursor-pointer"
                >
                  {t("wallet.confirm_btn")}
                </button>
                <button
                  onClick={() => setSelectedReward(null)}
                  className="w-full py-3 rounded-xl glass border border-border font-semibold hover:bg-accent transition-colors cursor-pointer"
                >
                  {t("wallet.cancel_btn")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Item Purchase Confirmation Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-card p-6 text-center"
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted grid place-items-center hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <img
                src={
                  selectedItem.image_url ||
                  "https://images.unsplash.com/photo-1546429070-1fc422f1d77a"
                }
                alt=""
                className="h-24 w-24 rounded-full mx-auto object-cover mb-4 border border-border bg-muted"
              />
              <h2 className="text-xl font-bold mb-2">{t("wallet.confirm_purchase_title")}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("wallet.confirm_purchase_desc", {
                  name: selectedItem.name,
                  price: selectedItem.price,
                })}
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={purchasing}
                  className="w-full py-3 rounded-xl bg-gradient-neon text-neon-foreground font-semibold hover:shadow-neon transition-shadow cursor-pointer"
                  id="confirm-purchase-btn"
                >
                  {purchasing ? t("wallet.processing") : t("wallet.confirm_purchase_title")}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-3 rounded-xl glass border border-border font-semibold hover:bg-accent transition-colors cursor-pointer"
                >
                  {t("wallet.cancel")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <TransferFitCoinsModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
