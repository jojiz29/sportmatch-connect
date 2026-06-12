// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { Ad } from "@/entities/types";
import { adsService } from "@/shared/api/adsService";

// === BLOQUE: INTERFAZ DEL ESTADO ===
interface AdsState {
  ads: Ad[];
  isLoading: boolean;
  fetchAds: (businessId?: string) => Promise<void>;
  createAd: (ad: Omit<Ad, "id" | "views" | "clicks" | "contacts" | "created_at">) => Promise<Ad>;
  updateAd: (
    adId: string,
    ad: Partial<Omit<Ad, "id" | "views" | "clicks" | "contacts" | "created_at">>,
  ) => Promise<Ad>;
  deleteAd: (adId: string) => Promise<void>;
  trackAdAction: (adId: string, action: "views" | "clicks" | "contacts") => Promise<void>;
}

// === BLOQUE: STORE DE ANUNCIOS ===
// Gestiona el CRUD de anuncios publicitarios y el tracking de métricas.
// No se persiste en localStorage porque los datos vienen del servicio remoto.
export const useAdsStore = create<AdsState>((set) => ({
  ads: [],
  isLoading: false,

  // Obtiene los anuncios, filtrados opcionalmente por negocio
  fetchAds: async (businessId) => {
    try {
      set({ isLoading: true });
      const data = await adsService.getAds(businessId);
      set({ ads: data || [], isLoading: false });
    } catch (err) {
      console.error("Error fetching ads in store:", err);
      set({ ads: [], isLoading: false });
    }
  },

  // Crea un nuevo anuncio y lo agrega al estado local
  createAd: async (adData) => {
    try {
      set({ isLoading: true });
      const newAd = await adsService.createAd(adData);
      set((state) => ({
        ads: [newAd, ...state.ads],
        isLoading: false,
      }));
      return newAd;
    } catch (err) {
      console.error("Error creating ad in store:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  // Actualiza un anuncio existente y reemplaza su entrada en el array
  updateAd: async (adId, adData) => {
    try {
      set({ isLoading: true });
      const updatedAd = await adsService.updateAd(adId, adData);
      set((state) => ({
        ads: state.ads.map((ad) => (ad.id === adId ? updatedAd : ad)),
        isLoading: false,
      }));
      return updatedAd;
    } catch (err) {
      console.error("Error updating ad in store:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  // Elimina un anuncio y lo remueve del estado local
  deleteAd: async (adId) => {
    try {
      set({ isLoading: true });
      await adsService.deleteAd(adId);
      set((state) => ({
        ads: state.ads.filter((ad) => ad.id !== adId),
        isLoading: false,
      }));
    } catch (err) {
      console.error("Error deleting ad in store:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  // Registra una acción (vista, clic, contacto) con actualización optimista
  // y reversión automática si la llamada al servicio falla
  trackAdAction: async (adId, action) => {
    try {
      // Actualización optimista: incrementa el contador de inmediato en UI
      set((state) => ({
        ads: state.ads.map((ad) =>
          ad.id === adId ? { ...ad, [action]: (ad[action] || 0) + 1 } : ad,
        ),
      }));

      // Persiste la acción en BD/demo storage
      await adsService.trackAdAction(adId, action);
    } catch (err) {
      console.error(`Error tracking ad action ${action} in store:`, err);
      // Reversión: si falla, decrementa el contador para mantener consistencia
      set((state) => ({
        ads: state.ads.map((ad) =>
          ad.id === adId ? { ...ad, [action]: Math.max(0, (ad[action] || 0) - 1) } : ad,
        ),
      }));
    }
  },
}));
