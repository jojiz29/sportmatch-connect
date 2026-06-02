import { supabase } from "@/shared/api/supabase";
import { toast } from "sonner";

export interface Reward {
  id: string;
  title: string;
  description: string | null;
  cost_fitcoins: number;
  stock: number;
  image_url: string | null;
  category: string | null;
}

export async function getRewards(): Promise<Reward[]> {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .order("cost_fitcoins", { ascending: true });

  if (error) {
    console.error("Error fetching rewards from Supabase:", error);
    throw error;
  }

  return (data || []) as Reward[];
}

export async function redeemReward(userId: string, rewardId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("redeem_reward", {
    p_user_id: userId,
    p_reward_id: rewardId,
  });

  if (error) {
    console.error("Error invoking redeem_reward RPC:", error);
    throw error;
  }

  return data as boolean;
}

/**
 * Parses Postgres / Supabase error exceptions and triggers elegant custom Destructive Toasts.
 */
export function handleWalletError(err: unknown): boolean {
  const message =
    err && typeof err === "object"
      ? (err as { message?: string; details?: string })?.message ||
        (err as { message?: string; details?: string })?.details ||
        String(err)
      : String(err);

  if (message.includes("Insufficient FitCoins balance for this transaction")) {
    toast.error("Saldo Insuficiente", {
      description: "Insufficient FitCoins balance for this transaction",
      style: {
        background: "#dc2626", // Destructive red background
        color: "#ffffff",
        border: "1px solid #ef4444",
      },
    });
    return true;
  }

  if (message.includes("Reward out of stock")) {
    toast.error("Sin Stock", {
      description: "Esta recompensa ya no cuenta con stock disponible.",
      style: {
        background: "#dc2626",
        color: "#ffffff",
        border: "1px solid #ef4444",
      },
    });
    return true;
  }

  return false;
}
