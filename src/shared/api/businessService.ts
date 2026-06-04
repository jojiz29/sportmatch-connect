import { supabase } from "./supabase";
import { CatalogItem, Transaction } from "@/entities/types";
import { createNotification } from "./notificationService";
import { useAuthStore } from "@/entities/user/useAuth";
import { apiClient } from "./apiClient";
import { useBusinessStore } from "@/features/business/model/useBusinessStore";

const MOCK_CATALOG: CatalogItem[] = [
  {
    id: "puka-power-bottle",
    business_id: "user-puka-power",
    name: "Botella Puka Power",
    description: "Bebida energética de 500ml para máxima resistencia.",
    price: 150,
    type: "PRODUCT",
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
    created_at: new Date().toISOString(),
  },
  {
    id: "puka-pack-6",
    business_id: "user-puka-power",
    name: "Puka Pack (6 botellas)",
    description: "Caja de 6 botellas para compartir con tu squad.",
    price: 800,
    type: "PRODUCT",
    image_url: "https://images.unsplash.com/photo-1546429070-1fc422f1d77a",
    created_at: new Date().toISOString(),
  },
  {
    id: "puka-vip-pass",
    business_id: "user-puka-power",
    name: "Acceso VIP Arena Puka",
    description: "Entrada exclusiva para eventos de pádel patrocinados.",
    price: 2500,
    type: "SERVICE",
    image_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8",
    created_at: new Date().toISOString(),
  },
  {
    id: "item-1",
    business_id: "business-1",
    name: "Bebida Energética Gatorade 500ml",
    description: "Rehidrátate con la bebida líder en el deporte.",
    price: 150,
    type: "PRODUCT",
    image_url:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400",
    created_at: new Date().toISOString(),
  },
  {
    id: "item-2",
    business_id: "business-2",
    name: "Alquiler Raqueta Pádel Wilson Pro",
    description: "Raqueta de fibra de carbono para control máximo.",
    price: 300,
    type: "PRODUCT",
    image_url:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=400",
    created_at: new Date().toISOString(),
  },
  {
    id: "item-3",
    business_id: "business-3",
    name: "Pase Diario Gimnasio Megatlon",
    description: "Acceso libre a máquinas y piscina climatizada.",
    price: 600,
    type: "SERVICE",
    image_url:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400",
    created_at: new Date().toISOString(),
  },
];

const getDemoCatalog = (): CatalogItem[] => {
  if (typeof window === "undefined") return MOCK_CATALOG;
  const stored = localStorage.getItem("sportmatch_demo_catalog");
  if (!stored) {
    localStorage.setItem("sportmatch_demo_catalog", JSON.stringify(MOCK_CATALOG));
    return MOCK_CATALOG;
  }
  return JSON.parse(stored);
};

const saveDemoCatalog = (catalog: CatalogItem[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("sportmatch_demo_catalog", JSON.stringify(catalog));
  }
};

export async function getCatalogItems(businessId?: string): Promise<CatalogItem[]> {
  if (useAuthStore.getState().isDemoMode) {
    const catalog = getDemoCatalog();
    return businessId ? catalog.filter((i) => i.business_id === businessId) : catalog;
  }

  let query = supabase.from("business_catalog").select("*");

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    if (import.meta.env.DEV) console.error("Error fetching catalog items from Supabase:", error);
    throw error;
  }

  return (data || []) as CatalogItem[];
}

export async function createCatalogItem(
  item: Omit<CatalogItem, "created_at">,
): Promise<CatalogItem> {
  if (useAuthStore.getState().isDemoMode) {
    const newItem = {
      ...item,
      created_at: new Date().toISOString(),
    };
    const catalog = getDemoCatalog();
    catalog.unshift(newItem);
    saveDemoCatalog(catalog);
    return newItem;
  }

  const { data, error } = await supabase
    .from("business_catalog")
    .insert({
      id: item.id,
      business_id: item.business_id,
      name: item.name,
      description: item.description,
      price: item.price,
      type: item.type,
      image_url: item.image_url,
    })
    .select()
    .single();

  if (error) {
    if (import.meta.env.DEV) console.error("Error creating catalog item in Supabase:", error);
    throw error;
  }

  return data as CatalogItem;
}

export async function deleteCatalogItem(itemId: string): Promise<void> {
  if (useAuthStore.getState().isDemoMode) {
    const catalog = getDemoCatalog();
    const index = catalog.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      catalog.splice(index, 1);
      saveDemoCatalog(catalog);
    }
    return;
  }

  const { error } = await supabase.from("business_catalog").delete().eq("id", itemId);

  if (error) {
    if (import.meta.env.DEV) console.error("Error deleting catalog item from Supabase:", error);
    throw error;
  }
}

export async function purchaseCatalogItem(buyerId: string, itemId: string): Promise<boolean> {
  if (useAuthStore.getState().isDemoMode) {
    const catalog = getDemoCatalog();
    const item = catalog.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");

    const buyer = useAuthStore.getState().user;
    if (!buyer) throw new Error("Buyer not found");

    if (buyer.fitcoins_balance < item.price) {
      return false;
    }

    const newBuyerBalance = buyer.fitcoins_balance - item.price;
    apiClient.wallet.updateBalance(buyerId, newBuyerBalance);

    const buyerTx: Transaction = {
      id: `demo-tx-buyer-${Date.now()}`,
      user_id: buyerId,
      amount: -item.price,
      description: `Compra: ${item.name}`,
      type: "SPEND",
      created_at: new Date().toISOString(),
    };
    apiClient.wallet.saveTransaction(buyerId, buyerTx);

    // Credit seller's balance
    const currentSellerBalance = await apiClient.wallet.getBalance(item.business_id);
    apiClient.wallet.updateBalance(item.business_id, currentSellerBalance + item.price);

    const sellerTx: Transaction = {
      id: `demo-tx-seller-${Date.now()}`,
      user_id: item.business_id,
      amount: item.price,
      description: `Venta: ${item.name}`,
      type: "EARN",
      created_at: new Date().toISOString(),
    };
    apiClient.wallet.saveTransaction(item.business_id, sellerTx);

    // Add B2B sales record to businessStore
    useBusinessStore.getState().addSale({
      id: `sale-demo-${Date.now()}`,
      catalog_item_id: item.id,
      item_name: item.name,
      buyer_id: buyer.id,
      buyer_name: buyer.name,
      price: item.price,
      created_at: new Date().toISOString(),
    });

    createNotification(
      buyerId,
      "TRANSACTION_SUCCESS",
      "Compra Exitosa (Demo)",
      `Compraste ${item.name} por ${item.price} FC.`,
      "/app/wallet/history",
    ).catch((e) => {
      if (import.meta.env.DEV) console.warn("Failed to create buyer notification:", e);
    });

    createNotification(
      item.business_id,
      "TRANSACTION_SUCCESS",
      "Venta Completada (Demo)",
      `Vendiste ${item.name} a ${buyer.name} por ${item.price} FC.`,
      "/app/business",
    ).catch((e) => {
      if (import.meta.env.DEV) console.warn("Failed to create seller notification:", e);
    });

    return true;
  }

  const { data, error } = await supabase.rpc("purchase_catalog_item", {
    p_buyer_id: buyerId,
    p_item_id: itemId,
  });

  if (error) {
    console.error(`Error purchasing catalog item via RPC (code: ${error.code}):`, error);
    throw new Error(error.message || "Failed to purchase item");
  }

  try {
    const { data: item } = await supabase
      .from("business_catalog")
      .select("*")
      .eq("id", itemId)
      .single();

    const { data: buyer } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", buyerId)
      .single();

    if (item && buyer) {
      createNotification(
        buyerId,
        "TRANSACTION_SUCCESS",
        "Compra Exitosa",
        `Compraste ${item.name} por ${item.price} FC.`,
        "/app/wallet/history",
      ).catch((e) => console.warn("Failed to create buyer notification:", e));

      createNotification(
        item.business_id,
        "TRANSACTION_SUCCESS",
        "Venta Completada",
        `Vendiste ${item.name} a ${buyer.name} por ${item.price} FC.`,
        "/app/business",
      ).catch((e) => console.warn("Failed to create seller notification:", e));
    }
  } catch (notifErr) {
    console.warn("Error triggering B2B purchase notifications:", notifErr);
  }

  return data as boolean;
}
