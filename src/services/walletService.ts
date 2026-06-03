import { supabase } from "@/shared/api/supabase";
import { toast } from "sonner";
import { useAuthStore } from "@/entities/user/useAuth";

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
  if (import.meta.env.VITE_USE_MOCKS === "true" || useAuthStore.getState().isDemoMode) {
    return [
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
  }

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
  if (import.meta.env.VITE_USE_MOCKS === "true" || useAuthStore.getState().isDemoMode) {
    return true;
  }

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
