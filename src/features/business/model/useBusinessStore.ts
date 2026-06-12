// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CatalogItem } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

// === BLOQUE: TIPO DE VENTA ===
// Registro individual de una venta realizada: qué producto/servicio se compró,
// quién lo compró y a qué precio.
interface SaleRecord {
  id: string;
  catalog_item_id: string;
  item_name: string;
  buyer_id: string;
  buyer_name: string;
  price: number;
  created_at: string;
}

// === BLOQUE: INTERFAZ DEL ESTADO ===
interface BusinessState {
  catalogItems: CatalogItem[];
  sales: SaleRecord[];
  addCatalogItem: (item: CatalogItem) => void;
  deleteCatalogItem: (id: string) => void;
  addSale: (sale: SaleRecord) => void;
}

// === BLOQUE: CATÁLOGO INICIAL ===
// Productos y servicios de demostración para el negocio "Puka Power".
const INITIAL_CATALOG: CatalogItem[] = [
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
];

// === BLOQUE: STORE DE NEGOCIO ===
// Gestiona el catálogo de productos/servicios y las ventas de un negocio.
// Persistido en localStorage bajo "sportmatch-business".
export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      catalogItems: INITIAL_CATALOG,
      sales: [],

      addCatalogItem: (item) =>
        set((state) => ({
          catalogItems: [item, ...state.catalogItems],
        })),

      deleteCatalogItem: (id) =>
        set((state) => ({
          catalogItems: state.catalogItems.filter((item) => item.id !== id),
        })),

      addSale: (sale) =>
        set((state) => ({
          sales: [sale, ...state.sales],
        })),
    }),
    {
      name: "sportmatch-business",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);
