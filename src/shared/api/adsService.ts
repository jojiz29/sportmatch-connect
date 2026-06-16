/**
 * ===================================================================
 * ARCHIVO: src/shared/api/adsService.ts
 * PROPÓSITO: Servicio de anuncios/publicidad para negocios (B2B).
 *            CRUD completo de anuncios + tracking de métricas
 *            (vistas, clicks, contactos).
 * FLUJO: Los negocios crean anuncios -> aparecen en el feed de
 *        jugadores -> se trackean las interacciones.
 * ===================================================================
 */

import { supabase } from "./supabase";
import { Ad } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";

// ==============================================================
// DATOS MOCK: Anuncios iniciales de demostración
// Cada anuncio representa un negocio local con su oferta:
// torneos, clases, descuentos, servicios.
// ==============================================================
const INITIAL_ADS: Ad[] = [
  {
    id: "ad-puka-tournament",
    business_id: "user-puka-power",
    title: "Torneo Relámpago Pádel Puka Power",
    description:
      "Inscríbete hoy en nuestro torneo relámpago categoría Intermedia. Arma tu dupla o regístrate solo y te emparejamos. ¡Grandes premios!",
    image_url: "https://images.unsplash.com/photo-1622279457486-62dcc4a631d6",
    category: "Patrocinador",
    location: "Jockey Club, Surco",
    district: "Santiago de Surco",
    valid_until: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      return d.toISOString();
    })(),
    contact_phone: "+51999888777",
    views: 450,
    clicks: 120,
    contacts: 35,
    is_featured: true,
    is_premium: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "ad-academy-classes",
    business_id: "business-academy-1",
    title: "Clases de Pádel Grupal 50% Desc",
    description:
      "Aprende técnica y táctica en grupos reducidos de tu misma categoría. Ideal para encontrar nuevos partners de juego.",
    image_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8",
    category: "Academia",
    location: "Padel Academy Lima, Primavera 1230",
    district: "Santiago de Surco",
    valid_until: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 20);
      return d.toISOString();
    })(),
    contact_phone: "+51912345678",
    views: 380,
    clicks: 98,
    contacts: 24,
    is_featured: true,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "ad-gym-assessment",
    business_id: "business-gym-1",
    title: "Preparación Física para Padrón/Tenis",
    description:
      "Evita lesiones y gana explosividad en la cancha. Evaluación funcional de fuerza y resistencia gratuita para nuevos usuarios.",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
    category: "Gym",
    location: "Megatlon Center, San Borja Sur 789",
    district: "San Borja",
    valid_until: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 25);
      return d.toISOString();
    })(),
    contact_phone: "+51987654321",
    views: 290,
    clicks: 65,
    contacts: 18,
    is_featured: false,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "ad-store-running",
    business_id: "business-store-1",
    title: "Prueba de Pisada Running Marathon",
    description:
      "Encuentra la zapatilla perfecta para tu pisada y peso. Análisis gratuito en tienda para mejorar tu ritmo y proteger tus rodillas.",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    category: "Tienda",
    location: "Marathon Miraflores, Av. Larco 450",
    district: "Miraflores",
    valid_until: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      return d.toISOString();
    })(),
    contact_phone: "+51999777666",
    views: 520,
    clicks: 140,
    contacts: 42,
    is_featured: true,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "ad-nutri-match",
    business_id: "business-nutri-1",
    title: "Nutrición Deportiva para Torneos",
    description:
      "¿Quieres rendir al máximo en tu próximo partido? Diseñamos tu alimentación pre y post competencia. 20% desc en tu primera cita.",
    image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
    category: "Nutricionista",
    location: "NutriSport Lince, Arequipa 2450",
    district: "Lince",
    valid_until: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString();
    })(),
    contact_phone: "+51955444333",
    views: 180,
    clicks: 40,
    contacts: 10,
    is_featured: false,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "ad-physio-descarga",
    business_id: "business-physio-1",
    title: "Terapia de Descarga Muscular Post-Juego",
    description:
      "Reduce la tensión acumulada tras tus partidos de tenis o fútbol. Terapia física manual + presoterapia en Magdalena.",
    image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
    category: "Fisioterapia",
    location: "FisioKine, Jirón Tacna 650",
    district: "Magdalena",
    valid_until: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      return d.toISOString();
    })(),
    contact_phone: "+51922333444",
    views: 230,
    clicks: 58,
    contacts: 21,
    is_featured: false,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
];

// ==============================================================
// HELPERS DE DEMO MODE (persistencia en localStorage)
// ==============================================================

/** Lee anuncios demo desde localStorage */
const getDemoAds = (): Ad[] => {
  if (typeof globalThis.window === "undefined") return INITIAL_ADS;
  const stored = localStorage.getItem("sportmatch_demo_ads");
  if (!stored) {
    localStorage.setItem("sportmatch_demo_ads", JSON.stringify(INITIAL_ADS));
    return INITIAL_ADS;
  }
  return JSON.parse(stored);
};

/** Guarda anuncios demo en localStorage */
const saveDemoAds = (ads: Ad[]) => {
  if (typeof globalThis.window !== "undefined") {
    localStorage.setItem("sportmatch_demo_ads", JSON.stringify(ads));
  }
};

// ==============================================================
// ADS SERVICE: Exportación principal
// ==============================================================
export const adsService = {
  /**
   * getAds(): Obtiene anuncios, opcionalmente filtrados por negocio
   */
  async getAds(businessId?: string): Promise<Ad[]> {
    if (useAuthStore.getState().isDemoMode) {
      const ads = getDemoAds();
      return businessId ? ads.filter((ad) => ad.business_id === businessId) : ads;
    }

    let query = supabase.from("business_ads").select("*");
    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error("Error fetching ads from Supabase:", error);
      throw error;
    }

    return (data || []) as Ad[];
  },

  /**
   * createAd(): Crea un nuevo anuncio
   * Los campos de métricas (views, clicks, contacts) se inicializan en 0.
   */
  async createAd(ad: Omit<Ad, "id" | "views" | "clicks" | "contacts" | "created_at">): Promise<Ad> {
    if (useAuthStore.getState().isDemoMode) {
      const newAd: Ad = {
        ...ad,
        id: `ad-demo-${Date.now()}`,
        views: 0,
        clicks: 0,
        contacts: 0,
        created_at: new Date().toISOString(),
      };
      const ads = getDemoAds();
      ads.unshift(newAd);
      saveDemoAds(ads);
      return newAd;
    }

    const { data, error } = await supabase
      .from("business_ads")
      .insert({
        business_id: ad.business_id,
        title: ad.title,
        description: ad.description,
        image_url: ad.image_url,
        category: ad.category,
        location: ad.location,
        district: ad.district,
        valid_until: ad.valid_until,
        contact_phone: ad.contact_phone,
        is_featured: ad.is_featured,
        is_premium: ad.is_premium,
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error("Error creating ad in Supabase:", error);
      throw error;
    }

    return data as Ad;
  },

  /**
   * updateAd(): Actualiza un anuncio existente
   * Solo permite modificar campos editables (no métricas ni fechas de creación).
   */
  async updateAd(
    adId: string,
    ad: Partial<Omit<Ad, "id" | "views" | "clicks" | "contacts" | "created_at">>,
  ): Promise<Ad> {
    if (useAuthStore.getState().isDemoMode) {
      const ads = getDemoAds();
      const index = ads.findIndex((a) => a.id === adId);
      if (index === -1) throw new Error("Ad not found");
      const updatedAd = { ...ads[index], ...ad };
      ads[index] = updatedAd;
      saveDemoAds(ads);
      return updatedAd;
    }

    const { data, error } = await supabase
      .from("business_ads")
      .update(ad)
      .eq("id", adId)
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error("Error updating ad in Supabase:", error);
      throw error;
    }

    return data as Ad;
  },

  /**
   * deleteAd(): Elimina un anuncio
   */
  async deleteAd(adId: string): Promise<void> {
    if (useAuthStore.getState().isDemoMode) {
      const ads = getDemoAds();
      const index = ads.findIndex((ad) => ad.id === adId);
      if (index !== -1) {
        ads.splice(index, 1);
        saveDemoAds(ads);
      }
      return;
    }

    const { error } = await supabase.from("business_ads").delete().eq("id", adId);

    if (error) {
      if (import.meta.env.DEV) console.error("Error deleting ad from Supabase:", error);
      throw error;
    }
  },

  /**
   * trackAdAction(): Incrementa una métrica de un anuncio
   * ------------------------------------------------------------------
   * En modo real usa la RPC increment_ad_metric de Supabase (transacción
   * atómica). Las métricas trackeadas son: views, clicks, contacts.
   *
   * @param adId   - ID del anuncio
   * @param action - Tipo de métrica a incrementar
   */
  async trackAdAction(adId: string, action: "views" | "clicks" | "contacts"): Promise<void> {
    if (useAuthStore.getState().isDemoMode) {
      const ads = getDemoAds();
      const index = ads.findIndex((ad) => ad.id === adId);
      if (index !== -1) {
        ads[index][action] = (ads[index][action] || 0) + 1;
        saveDemoAds(ads);
      }
      return;
    }

    const { error } = await supabase.rpc("increment_ad_metric", {
      ad_id: adId,
      metric_name: action,
    });

    if (error) {
      if (import.meta.env.DEV) console.error(`Error incrementing ad metric ${action}:`, error);
      throw error;
    }
  },
};
