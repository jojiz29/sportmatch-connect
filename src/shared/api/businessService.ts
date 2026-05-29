import { supabase } from "./supabase";
import { CatalogItem } from "@/entities/types";
import { createNotification } from "./notificationService";
import { useAuthStore } from "@/entities/user/useAuth";

const MOCK_CATALOG: CatalogItem[] = [
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

export async function getCatalogItems(businessId?: string): Promise<CatalogItem[]> {
  if (useAuthStore.getState().isDemoMode) {
    return businessId ? MOCK_CATALOG.filter((i) => i.business_id === businessId) : MOCK_CATALOG;
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
    MOCK_CATALOG.unshift(newItem);
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
    const index = MOCK_CATALOG.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      MOCK_CATALOG.splice(index, 1);
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
    const item = MOCK_CATALOG.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");

    const buyer = useAuthStore.getState().user;
    if (!buyer) throw new Error("Buyer not found");

    if (buyer.fitcoins_balance < item.price) {
      return false;
    }

    const newBuyerBalance = buyer.fitcoins_balance - item.price;
    useAuthStore.setState({ user: { ...buyer, fitcoins_balance: newBuyerBalance } });

    createNotification(
      buyerId,
      "TRANSACTION_SUCCESS",
      "Compra Exitosa (Demo)",
      `Compraste ${item.name} por ${item.price} FC.`,
      "/app/wallet/history",
    ).catch((e) => {
      if (import.meta.env.DEV) console.warn("Failed to create buyer notification:", e);
    });

    return true;
  }

  // 1. Fetch catalog item
  const { data: item, error: itemError } = await supabase
    .from("business_catalog")
    .select("*")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    if (import.meta.env.DEV) console.error("Item not found for purchase:", itemError);
    throw new Error("Item not found");
  }

  // 2. Fetch buyer profile
  const { data: buyer, error: buyerError } = await supabase
    .from("profiles")
    .select("fitcoins_balance, name")
    .eq("id", buyerId)
    .single();

  if (buyerError || !buyer) {
    if (import.meta.env.DEV) console.error("Buyer profile not found:", buyerError);
    throw new Error("Buyer not found");
  }

  if (buyer.fitcoins_balance < item.price) {
    return false;
  }

  // 3. Update buyer balance in profiles
  const newBuyerBalance = buyer.fitcoins_balance - item.price;
  const { error: updateBuyerError } = await supabase
    .from("profiles")
    .update({ fitcoins_balance: newBuyerBalance })
    .eq("id", buyerId);

  if (updateBuyerError) {
    if (import.meta.env.DEV) console.error("Error updating buyer balance:", updateBuyerError);
    throw updateBuyerError;
  }

  // 4. Update seller balance in profiles
  const { data: seller, error: sellerError } = await supabase
    .from("profiles")
    .select("fitcoins_balance, name")
    .eq("id", item.business_id)
    .single();

  if (sellerError || !seller) {
    if (import.meta.env.DEV) console.error("Seller profile not found:", sellerError);
    throw new Error("Seller not found");
  }

  const newSellerBalance = (seller.fitcoins_balance || 0) + item.price;
  const { error: updateSellerError } = await supabase
    .from("profiles")
    .update({ fitcoins_balance: newSellerBalance })
    .eq("id", item.business_id);

  if (updateSellerError) {
    if (import.meta.env.DEV) console.error("Error updating seller balance:", updateSellerError);
    throw updateSellerError;
  }

  // 5. Insert wallet transactions
  const spendTx = {
    id: `txn_${Date.now()}_spend`,
    user_id: buyerId,
    amount: -item.price,
    description: `Compra: ${item.name}`,
    type: "SPEND",
  };

  const earnTx = {
    id: `txn_${Date.now()}_earn`,
    user_id: item.business_id,
    amount: item.price,
    description: `Venta: ${item.name} a ${buyer.name}`,
    type: "EARN",
  };

  const { error: txError } = await supabase.from("wallet_transactions").insert([spendTx, earnTx]);

  if (txError) {
    if (import.meta.env.DEV) console.error("Error inserting transactions:", txError);
    throw txError;
  }

  // 6. Send notifications
  createNotification(
    buyerId,
    "TRANSACTION_SUCCESS",
    "Compra Exitosa",
    `Compraste ${item.name} por ${item.price} FC.`,
    "/app/wallet/history",
  ).catch((e) => {
    if (import.meta.env.DEV) console.warn("Failed to create buyer notification:", e);
  });

  createNotification(
    item.business_id,
    "TRANSACTION_SUCCESS",
    "Venta Completada",
    `Vendiste ${item.name} a ${buyer.name} por ${item.price} FC.`,
    "/app/business",
  ).catch((e) => {
    if (import.meta.env.DEV) console.warn("Failed to create seller notification:", e);
  });

  return true;
}
