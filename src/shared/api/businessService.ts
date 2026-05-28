import { query } from "@/shared/lib/database";
import { CatalogItem } from "@/entities/types";
import { useBusinessStore } from "@/features/business/model/useBusinessStore";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { MOCK_USERS, MOCK_TRANSACTIONS, syncMockUsersToStorage } from "@/lib/mock";

const USE_MOCKS = 
  (typeof process !== "undefined" && process.env?.VITE_USE_MOCKS !== "false") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_USE_MOCKS !== "false");

export async function getCatalogItems(businessId?: string): Promise<CatalogItem[]> {
  if (USE_MOCKS) {
    const items = useBusinessStore.getState().catalogItems;
    if (businessId) {
      return Promise.resolve(items.filter((i) => i.business_id === businessId));
    }
    return Promise.resolve(items);
  }

  let sqlQuery = `SELECT id, business_id, name, description, price, type, image_url, created_at FROM public.business_catalog`;
  const params: any[] = [];
  
  if (businessId) {
    sqlQuery += ` WHERE business_id = $1`;
    params.push(businessId);
  }
  
  sqlQuery += ` ORDER BY created_at DESC;`;

  try {
    const result = await query(sqlQuery, params);
    return (result.rows || []).map((row: any) => ({
      id: row.id,
      business_id: row.business_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      type: row.type as any,
      image_url: row.image_url,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error("Vercel Postgres getCatalogItems failed:", error);
    throw error;
  }
}

export async function createCatalogItem(
  item: Omit<CatalogItem, "created_at">
): Promise<CatalogItem> {
  const newItem: CatalogItem = {
    ...item,
    created_at: new Date().toISOString(),
  };

  if (USE_MOCKS) {
    useBusinessStore.getState().addCatalogItem(newItem);
    return Promise.resolve(newItem);
  }

  const sqlQuery = `
    INSERT INTO public.business_catalog (id, business_id, name, description, price, type, image_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, business_id, name, description, price, type, image_url, created_at;
  `;

  try {
    const result = await query(sqlQuery, [
      newItem.id,
      newItem.business_id,
      newItem.name,
      newItem.description || null,
      newItem.price,
      newItem.type,
      newItem.image_url || null,
    ]);
    const row = result.rows[0];
    return {
      id: row.id,
      business_id: row.business_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      type: row.type as any,
      image_url: row.image_url,
      created_at: row.created_at,
    };
  } catch (error) {
    console.error("Vercel Postgres createCatalogItem failed:", error);
    throw error;
  }
}

export async function deleteCatalogItem(itemId: string): Promise<void> {
  if (USE_MOCKS) {
    useBusinessStore.getState().deleteCatalogItem(itemId);
    return Promise.resolve();
  }

  const sqlQuery = `DELETE FROM public.business_catalog WHERE id = $1;`;
  try {
    await query(sqlQuery, [itemId]);
  } catch (error) {
    console.error("Vercel Postgres deleteCatalogItem failed:", error);
    throw error;
  }
}

export async function purchaseCatalogItem(
  buyerId: string,
  itemId: string
): Promise<boolean> {
  // Fetch item details first
  const items = await getCatalogItems();
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error("Item not found");
  }

  if (USE_MOCKS) {
    // 1. Check buyer has enough balance
    const buyer = MOCK_USERS.find((u) => u.id === buyerId);
    if (!buyer) throw new Error("Buyer not found");
    if (buyer.fitcoins_balance < item.price) {
      return false;
    }

    // 2. Perform wallet balance updates
    const success = useWalletStore.getState().redeem(item.price, `Compra: ${item.name}`);
    if (!success) return false;

    // 3. Credit the business user
    const seller = MOCK_USERS.find((u) => u.id === item.business_id);
    if (seller) {
      const newSellerBalance = seller.fitcoins_balance + item.price;
      seller.fitcoins_balance = newSellerBalance;
      
      // If the current logged in user is the seller, update session store
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.id === seller.id) {
        useAuthStore.setState({ user: { ...currentUser, fitcoins_balance: newSellerBalance } });
      }

      // Generate EARN transaction for business
      const earnTx = {
        id: `txn_${Date.now()}_earn`,
        created_at: new Date().toISOString(),
        user_id: seller.id,
        amount: item.price,
        description: `Venta: ${item.name} a ${buyer.name}`,
        type: "EARN" as const,
      };
      MOCK_TRANSACTIONS.unshift(earnTx);
    }

    // 4. Log sales record in business store
    useBusinessStore.getState().addSale({
      id: `sale_${Date.now()}`,
      catalog_item_id: item.id,
      item_name: item.name,
      buyer_id: buyerId,
      buyer_name: buyer.name,
      price: item.price,
      created_at: new Date().toISOString(),
    });

    syncMockUsersToStorage();

    return true;
  }

  // Production DB transaction would go here.
  // In production, we decrement buyer balance, increment seller balance, and insert transaction logs.
  try {
    // Basic verification of balance
    const buyerResult = await query("SELECT fitcoins_balance FROM public.users WHERE id = $1", [buyerId]);
    const buyerBalance = buyerResult.rows[0]?.fitcoins_balance || 0;
    if (buyerBalance < item.price) {
      return false;
    }

    // Perform updates in DB (simple sequence)
    await query("UPDATE public.users SET fitcoins_balance = fitcoins_balance - $1 WHERE id = $2", [item.price, buyerId]);
    await query("UPDATE public.users SET fitcoins_balance = fitcoins_balance + $1 WHERE id = $2", [item.price, item.business_id]);
    
    // Insert transactions
    const txId1 = `txn_${Date.now()}_spend`;
    const txId2 = `txn_${Date.now()}_earn`;
    await query(
      "INSERT INTO public.transactions (id, user_id, amount, description, type, created_at) VALUES ($1, $2, $3, $4, $5, now())",
      [txId1, buyerId, -item.price, `Compra: ${item.name}`, "SPEND"]
    );
    await query(
      "INSERT INTO public.transactions (id, user_id, amount, description, type, created_at) VALUES ($1, $2, $3, $4, $5, now())",
      [txId2, item.business_id, item.price, `Venta: ${item.name}`, "EARN"]
    );

    return true;
  } catch (error) {
    console.error("Vercel Postgres purchaseCatalogItem execution failed:", error);
    throw error;
  }
}
