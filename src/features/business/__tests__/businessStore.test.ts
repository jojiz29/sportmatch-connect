// ============================================================
// businessStore.test.ts — Tests de la store de negocio B2B
// Verifica catálogo, publicaciones y operaciones comerciales
// ============================================================

import { describe, it, expect, beforeEach } from "vitest";
import { useBusinessStore } from "../model/useBusinessStore";
import { CatalogItem } from "@/entities/types";

describe("useBusinessStore Zustand Store", () => {
  beforeEach(() => {
    // Reset store state before each test if necessary, or just test its main operations
  });

  it("should initialize with structurally sound initial states", () => {
    const state = useBusinessStore.getState();
    expect(Array.isArray(state.catalogItems)).toBe(true);
    expect(state.catalogItems.length).toBeGreaterThan(0);
    expect(Array.isArray(state.sales)).toBe(true);
    expect(state.sales.length).toBe(0); // Initial sales should be empty
  });

  it("should correctly add and delete catalog items", () => {
    const initialCount = useBusinessStore.getState().catalogItems.length;
    const newItem: CatalogItem = {
      id: "test-item-123",
      business_id: "test-business",
      name: "Test Product",
      description: "This is a test product",
      price: 100,
      type: "PRODUCT",
      image_url: "",
      created_at: new Date().toISOString(),
    };

    // Add item
    useBusinessStore.getState().addCatalogItem(newItem);
    expect(useBusinessStore.getState().catalogItems.length).toBe(initialCount + 1);
    expect(useBusinessStore.getState().catalogItems[0].id).toBe("test-item-123");

    // Delete item
    useBusinessStore.getState().deleteCatalogItem("test-item-123");
    expect(useBusinessStore.getState().catalogItems.length).toBe(initialCount);
    expect(
      useBusinessStore.getState().catalogItems.find((i) => i.id === "test-item-123"),
    ).toBeUndefined();
  });

  it("should correctly record a sale", () => {
    const initialSalesCount = useBusinessStore.getState().sales.length;

    const sale = {
      id: `sale-${Date.now()}`,
      catalog_item_id: "puka-power-bottle",
      item_name: "Botella Puka Power",
      buyer_id: "buyer-1",
      buyer_name: "Test Buyer",
      price: 150,
      created_at: new Date().toISOString(),
    };

    useBusinessStore.getState().addSale(sale);
    expect(useBusinessStore.getState().sales.length).toBe(initialSalesCount + 1);
    expect(useBusinessStore.getState().sales[0].item_name).toBe("Botella Puka Power");
  });
});
