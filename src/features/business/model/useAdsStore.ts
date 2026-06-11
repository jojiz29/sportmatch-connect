import { create } from "zustand";
import { Ad } from "@/entities/types";
import { adsService } from "@/shared/api/adsService";

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

export const useAdsStore = create<AdsState>((set) => ({
  ads: [],
  isLoading: false,

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

  trackAdAction: async (adId, action) => {
    try {
      // Optimistic update
      set((state) => ({
        ads: state.ads.map((ad) =>
          ad.id === adId ? { ...ad, [action]: (ad[action] || 0) + 1 } : ad,
        ),
      }));

      // Sinking action to DB/demo storage
      await adsService.trackAdAction(adId, action);
    } catch (err) {
      console.error(`Error tracking ad action ${action} in store:`, err);
      // Revert if failed
      set((state) => ({
        ads: state.ads.map((ad) =>
          ad.id === adId ? { ...ad, [action]: Math.max(0, (ad[action] || 0) - 1) } : ad,
        ),
      }));
    }
  },
}));
