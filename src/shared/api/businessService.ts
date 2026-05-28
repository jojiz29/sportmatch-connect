import { supabase } from "./supabase";
import { CatalogItem } from "@/entities/types";
import { createNotification } from "./notificationService";

export async function getCatalogItems(businessId?: string): Promise<CatalogItem[]> {
  let query = supabase.from("business_catalog").select("*");

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching catalog items from Supabase:", error);
    throw error;
  }

  return (data || []) as CatalogItem[];
}

export async function createCatalogItem(
  item: Omit<CatalogItem, "created_at">,
): Promise<CatalogItem> {
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
    console.error("Error creating catalog item in Supabase:", error);
    throw error;
  }

  return data as CatalogItem;
}

export async function deleteCatalogItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("business_catalog").delete().eq("id", itemId);

  if (error) {
    console.error("Error deleting catalog item from Supabase:", error);
    throw error;
  }
}

export async function purchaseCatalogItem(buyerId: string, itemId: string): Promise<boolean> {
  // 1. Fetch catalog item
  const { data: item, error: itemError } = await supabase
    .from("business_catalog")
    .select("*")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    console.error("Item not found for purchase:", itemError);
    throw new Error("Item not found");
  }

  // 2. Fetch buyer profile
  const { data: buyer, error: buyerError } = await supabase
    .from("profiles")
    .select("fitcoins_balance, name")
    .eq("id", buyerId)
    .single();

  if (buyerError || !buyer) {
    console.error("Buyer profile not found:", buyerError);
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
    console.error("Error updating buyer balance:", updateBuyerError);
    throw updateBuyerError;
  }

  // 4. Update seller balance in profiles
  const { data: seller, error: sellerError } = await supabase
    .from("profiles")
    .select("fitcoins_balance, name")
    .eq("id", item.business_id)
    .single();

  if (sellerError || !seller) {
    console.error("Seller profile not found:", sellerError);
    throw new Error("Seller not found");
  }

  const newSellerBalance = (seller.fitcoins_balance || 0) + item.price;
  const { error: updateSellerError } = await supabase
    .from("profiles")
    .update({ fitcoins_balance: newSellerBalance })
    .eq("id", item.business_id);

  if (updateSellerError) {
    console.error("Error updating seller balance:", updateSellerError);
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
    console.error("Error inserting transactions:", txError);
    throw txError;
  }

  // 6. Send notifications
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

  return true;
}
