// === BLOQUE: Portal de Empresas y Patrocinadores (B2B) ===
// Dashboard completo para cuentas BUSINESS con pestañas:
// - Profile: gestión del perfil comercial (nombre, categoría, dirección, horarios, redes)
// - Ads: creación, edición y publicación de campañas publicitarias con pago
// - Analytics: gráficos de tráfico, clics, alcance geográfico y KPIs de conversión
// - Catalog: marketplace de productos/servicios con precios en FitCoins
// - Venues: registro y administración de sedes georreferenciadas
// - Settings: preferencias de notificaciones y herramientas de demo
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ImageUploadField } from "@/components/ImageUploadField";
import { VenueLocationPicker } from "@/features/map/VenueLocationPicker";
import { useAuthStore } from "@/entities/user/useAuth";
import { useThemeStore } from "@/features/theme/store";
import { useState, useEffect, useMemo } from "react";
import {
  getCatalogItems,
  createCatalogItem,
  deleteCatalogItem,
} from "@/shared/api/businessService";
import { CatalogItem, Venue, SportCatalog, Ad, User } from "@/entities/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { PaymentCheckout, PaymentSelection } from "@/components/PaymentCheckout";
import { usePaymentGatewayStore } from "@/features/wallet/usePaymentGatewayStore";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { useBusinessStore } from "@/features/business/model/useBusinessStore";
import { useSocialStore } from "@/features/social/model/useSocialStore";
import { useProfileStore } from "@/features/profile/useProfileStore";
import { useAdsStore } from "@/features/business/model/useAdsStore";
import { IntelligenceDashboard } from "@/features/b2b-ai";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { withTimeout } from "@/shared/api/timeoutHelper";
import { apiClient, MOCK_VENUES } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import {
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
  ShieldAlert,
  Eye,
  BarChart3,
  Target,
  Megaphone,
  MousePointer,
  MapPin,
  ShoppingBag,
  Heart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// === BLOQUE: Tipos de búsqueda para pestañas ===
interface BusinessSearch {
  tab?: "profile" | "ads" | "analytics" | "catalog" | "venues" | "settings" | "intelligence";
}

async function uploadVenueImage(imageValue: string, businessId: string): Promise<string> {
  if (!imageValue.startsWith("data:image/")) return imageValue;

  console.info("[venue-register] image-upload:start", { businessId });
  const imageBlob = await fetch(imageValue).then((response) => response.blob());
  const extension =
    imageBlob.type === "image/png" ? "png" : imageBlob.type === "image/webp" ? "webp" : "jpg";
  const filePath = `${businessId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await withTimeout(
    supabase.storage.from("venue-images").upload(filePath, imageBlob, {
      contentType: imageBlob.type || "image/webp",
      upsert: false,
    }),
    30000,
  );

  if (error) {
    console.error("[venue-register] image-upload:error", { message: error.message });
    throw new Error(`No se pudo subir la imagen de la sede: ${error.message}`);
  }

  const { data } = supabase.storage.from("venue-images").getPublicUrl(filePath);
  console.info("[venue-register] image-upload:success", { filePath });
  return data.publicUrl;
}

export const Route = createFileRoute("/app/business")({
  validateSearch: (search: Record<string, unknown>): BusinessSearch => {
    return { tab: (search.tab as BusinessSearch["tab"]) || "profile" };
  },
  head: () => ({ meta: [{ title: "Mi Negocio — SportMatch" }] }),
  component: BusinessPage,
});

function BusinessPage() {
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate({ from: "/app/business" });
  const sales = useBusinessStore((s) => s.sales);
  const { ads, fetchAds, createAd, updateAd, deleteAd, isLoading: loadingAds } = useAdsStore();

  // === BLOQUE: Métricas de anuncios ===
  const businessAds = useMemo(() => {
    if (!user) return [];
    return (ads || []).filter((ad) => ad.business_id === user.id);
  }, [ads, user]);

  const totalAdsCount = (businessAds || []).length;
  const totalViews = useMemo(
    () => (businessAds || []).reduce((acc, ad) => acc + (ad.views || 0), 0),
    [businessAds],
  );
  const totalClicks = useMemo(
    () => (businessAds || []).reduce((acc, ad) => acc + (ad.clicks || 0), 0),
    [businessAds],
  );
  const totalContacts = useMemo(
    () => (businessAds || []).reduce((acc, ad) => acc + (ad.contacts || 0), 0),
    [businessAds],
  );
  const followersCount = useMemo(() => {
    if (!user) return 0;
    return useSocialStore.getState().getFollowStats(user.id).followersCount;
  }, [user]);

  // === BLOQUE: Datos de gráficos ===
  const salesData = useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const baseViews = totalViews || 350;
    const baseClicks = totalClicks || 85;
    const baseContacts = totalContacts || 18;
    return days.map((day, idx) => {
      const mult = (idx + 1) / 7;
      return {
        day,
        impresiones: Math.round((baseViews / 7) * (0.6 + mult * Math.random())),
        clics: Math.round((baseClicks / 7) * (0.5 + mult * Math.random())),
        contactos: Math.round((baseContacts / 7) * (0.4 + mult * Math.random())),
      };
    });
  }, [totalViews, totalClicks, totalContacts]);

  const reachData = useMemo(
    () => [
      { name: "< 1km", value: 35, color: theme === "world-cup" ? "#D4AF37" : "#39FF14" },
      { name: "1-3km", value: 40, color: "#00E5FF" },
      { name: "3-5km", value: 20, color: "#E040FB" },
      { name: "> 5km", value: 5, color: "#475569" },
    ],
    [theme],
  );

  // === BLOQUE: Estados de formularios ===
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const search = Route.useSearch();
  const activeTab = search.tab || "profile";

  // Estados para Venues (Sedes)
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [sportsList, setSportsList] = useState<SportCatalog[]>([]);
  const [venueFormOpen, setVenueFormOpen] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueDistrict, setVenueDistrict] = useState("");
  const [venueLat, setVenueLat] = useState<number | "">("");
  const [venueLng, setVenueLng] = useState<number | "">("");
  const [venuePrice, setVenuePrice] = useState<number | "">("");
  const [venueSport, setVenueSport] = useState("");
  const [venueMaxPlayers, setVenueMaxPlayers] = useState<number | "">("");
  const [venueAmenities, setVenueAmenities] = useState("");
  const [venueImage, setVenueImage] = useState("");
  const [venueDescription, setVenueDescription] = useState("");
  const [venueHours, setVenueHours] = useState("");
  const [registeringVenue, setRegisteringVenue] = useState(false);

  // Estados para Catálogo
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [type, setType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estados para Perfil Comercial
  const [compName, setCompName] = useState("");
  const [compCategory, setCompCategory] = useState("");
  const [compBio, setCompBio] = useState("");
  const [compLogo, setCompLogo] = useState("");
  const [compAddress, setCompAddress] = useState("");
  const [compDistrict, setCompDistrict] = useState("");
  const [compHours, setCompHours] = useState("");
  const [compWhatsapp, setCompWhatsapp] = useState("");
  const [compInstagram, setCompInstagram] = useState("");
  const [compWebsite, setCompWebsite] = useState("");
  const [compImages, setCompImages] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Estados para Campañas (Ads)
  const [adTitle, setAdTitle] = useState("");
  const [adDesc, setAdDesc] = useState("");
  const [adCategory, setAdCategory] = useState("");
  const [adLocation, setAdLocation] = useState("");
  const [adDistrict, setAdDistrict] = useState("");
  const [adValidUntil, setAdValidUntil] = useState("");
  const [adPhone, setAdPhone] = useState("");
  const [adImage, setAdImage] = useState("");
  const [adFeatured, setAdFeatured] = useState(false);
  const [adPremium, setAdPremium] = useState(false);
  const [publishingAd, setPublishingAd] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [adCashCost, setAdCashCost] = useState(0);
  const { isProcessing: isAdPaying, processPayment: processAdPayment } = usePaymentGatewayStore();

  // === BLOQUE: Carga de perfil en formularios ===
  useEffect(() => {
    if (user) {
      setCompName(user.company_name || "");
      setCompCategory(user.business_category || "");
      setCompBio(user.bio || "");
      setCompLogo(user.avatar_url || "");
      setCompAddress(user.address || "");
      setCompDistrict(user.district || "");
      setCompHours(user.operating_hours?.[0] || "");
      setCompWhatsapp(user.whatsapp || "");
      setCompInstagram(user.instagram || "");
      setCompWebsite(user.website || "");
      setCompImages(user.images ? user.images.join(", ") : "");
    }
  }, [user]);

  // === BLOQUE: Carga de anuncios ===
  useEffect(() => {
    if (user) fetchAds(user.id);
  }, [user, fetchAds]);

  // === BLOQUE: Autocompletado de GPS ===
  const handleAutofillLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setVenueLat(pos.coords.latitude);
          setVenueLng(pos.coords.longitude);
          toast.success("Ubicación actual obtenida con éxito.");
        },
        (err) => {
          console.error(err);
          toast.error("No se pudo obtener la ubicación actual.");
        },
      );
    } else {
      toast.error("La geolocalización no está soportada en este navegador.");
    }
  };

  // === BLOQUE: handleCreateVenue ===
  // Crea una nueva sede (venue) en Supabase o localStorage (demo).
  // Calcula coordenadas, horarios y comodidades del formulario.
  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión.");
      return;
    }
    if (!venueName || !venueAddress || venueLat === "" || venueLng === "") {
      toast.error("Completa los datos obligatorios y selecciona la sede en el mapa.");
      return;
    }

    try {
      setRegisteringVenue(true);
      const latVal = Number(venueLat);
      const lngVal = Number(venueLng);
      const priceVal = venuePrice !== "" ? Number(venuePrice) : 0;
      const maxPlayersVal = venueMaxPlayers !== "" ? Number(venueMaxPlayers) : 4;
      const hoursVal = venueHours ? [venueHours] : ["08:00 - 22:00"];

      const newVenue: Venue = {
        id: `venue-${Date.now()}`,
        created_at: new Date().toISOString(),
        name: venueName,
        sport: venueSport || "Deporte General",
        price_per_hour: priceVal,
        lat: latVal,
        lng: lngVal,
        address: venueAddress,
        district: venueDistrict || compDistrict || "Surco",
        max_players: maxPlayersVal,
        operating_hours: hoursVal,
        image_url: venueImage || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8",
        amenities: venueAmenities
          ? venueAmenities
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : ["Seguridad", "Estacionamiento"],
        owner_id: user.id,
        is_available: true,
        rating: 5.0,
        reviews_count: 0,
        description: venueDescription,
      };

      if (useAuthStore.getState().isDemoMode) {
        const stored = localStorage.getItem("sportmatch_demo_venues");
        const list: Venue[] = stored
          ? (() => {
              try {
                return JSON.parse(stored);
              } catch {
                return [...MOCK_VENUES];
              }
            })()
          : [...MOCK_VENUES];
        list.push(newVenue);
        localStorage.setItem("sportmatch_demo_venues", JSON.stringify(list));
        setVenues((prev) => [...prev, newVenue]);
        toast.success("¡Sede registrada con éxito en modo Demo!");
      } else {
        // Los archivos locales se suben a Storage; PostgreSQL conserva únicamente su URL pública.
        const imageUrl = venueImage
          ? await uploadVenueImage(venueImage, user.id)
          : "https://images.unsplash.com/photo-1554068865-24cecd4e34b8";

        console.info("[venue-register] court-insert:start", {
          ownerId: user.id,
          name: venueName,
        });
        const { data: createdVenue, error: insertErr } = await withTimeout(
          supabase
            .from("courts")
            .insert({
              name: venueName,
              sport: venueSport || "Deporte General",
              price_per_hour: priceVal,
              lat: latVal,
              lng: lngVal,
              location: `POINT(${lngVal} ${latVal})`,
              address: venueAddress,
              max_players: maxPlayersVal,
              operating_hours: hoursVal,
              image_url: imageUrl,
              amenities: newVenue.amenities,
              owner_id: user.id,
              is_available: true,
              rating: 5.0,
              reviews_count: 0,
              district: venueDistrict || compDistrict || "Surco",
            })
            .select()
            .single(),
        );

        if (insertErr) {
          console.error("[venue-register] court-insert:error", {
            code: insertErr.code,
            message: insertErr.message,
          });
          throw insertErr;
        }

        console.info("[venue-register] court-insert:success", { venueId: createdVenue.id });
        setVenues((prev) => [...prev, createdVenue as Venue]);
        toast.success("¡Sede registrada con éxito!");
      }

      setVenueName("");
      setVenueAddress("");
      setVenueLat("");
      setVenueLng("");
      setVenuePrice("");
      setVenueSport("");
      setVenueMaxPlayers("");
      setVenueAmenities("");
      setVenueImage("");
      setVenueDistrict("");
      setVenueDescription("");
      setVenueHours("");
      setVenueFormOpen(false);
    } catch (err: unknown) {
      console.error("[venue-register] failed", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Error al registrar sede: " + msg);
    } finally {
      setRegisteringVenue(false);
    }
  };

  // === BLOQUE: handleDeleteVenue ===
  const handleDeleteVenue = async (id: string) => {
    try {
      if (useAuthStore.getState().isDemoMode) {
        const stored = localStorage.getItem("sportmatch_demo_venues");
        const list: Venue[] = stored
          ? (() => {
              try {
                return JSON.parse(stored);
              } catch {
                return [...MOCK_VENUES];
              }
            })()
          : [...MOCK_VENUES];
        const updatedList = list.filter((c) => c.id !== id);
        localStorage.setItem("sportmatch_demo_venues", JSON.stringify(updatedList));
        setVenues((prev) => prev.filter((c) => c.id !== id));
        toast.success("Sede eliminada con éxito en modo Demo");
      } else {
        const { error } = await supabase.from("courts").delete().eq("id", id);
        if (error) throw error;
        setVenues((prev) => prev.filter((c) => c.id !== id));
        toast.success("Sede eliminada con éxito");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        "Error al eliminar la sede: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  // === BLOQUE: Carga inicial de datos del negocio ===
  // Obtiene catálogo, sedes y deportes desde backend o Supabase.
  useEffect(() => {
    if (!user || user.user_role !== "BUSINESS") return;
    const businessId = user.id;

    async function loadBusinessData() {
      try {
        setLoading(true);
        setLoadingVenues(true);
        const catalogData = await getCatalogItems(businessId);
        setItems(catalogData);

        if (useAuthStore.getState().isDemoMode) {
          const allVenues = (await apiClient.venues.getAll()) || [];
          let venuesData = allVenues.filter((c) => c.owner_id === businessId);
          if (venuesData.length === 0) {
            const updatedVenues = allVenues.map((c, idx) =>
              idx < 3 ? { ...c, owner_id: businessId } : c,
            );
            localStorage.setItem("sportmatch_demo_venues", JSON.stringify(updatedVenues));
            venuesData = updatedVenues.filter((c) => c.owner_id === businessId);
          }
          setVenues(venuesData || []);
          const backendSports = await backendApi.sports.getAll().catch(() => null);
          // El backend envuelve sus resultados en { data, error }; la interfaz necesita el arreglo.
          const sportsData = Array.isArray(backendSports?.data)
            ? backendSports.data
            : await apiClient.sports.getAll();
          setSportsList((sportsData || []) as SportCatalog[]);
          setLoading(false);
          setLoadingVenues(false);
          return;
        }

        const { data: courtsData, error: courtsErr } = await supabase
          .from("courts")
          .select("*")
          .eq("owner_id", businessId);
        if (courtsErr) throw courtsErr;
        setVenues((courtsData || []) as Venue[]);

        const backendSports = await backendApi.sports.getAll().catch(() => null);
        // Evita que la pestaña "Mis sedes" intente ejecutar .map() sobre la respuesta completa.
        const sportsData = Array.isArray(backendSports?.data)
          ? backendSports.data
          : await apiClient.sports.getAll();
        setSportsList((sportsData || []) as SportCatalog[]);
      } catch (err) {
        console.error("Failed to load business dashboard data:", err);
        toast.error("Error al cargar datos del negocio");
      } finally {
        setLoading(false);
        setLoadingVenues(false);
      }
    }
    loadBusinessData();
  }, [user]);

  if (!user) return null;

  // === BLOQUE: Guardia de acceso (rol BUSINESS) ===
  if (user.user_role !== "BUSINESS") {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-warning/10 border border-warning/30 grid place-items-center mb-6 animate-pulse">
          <ShieldAlert className="h-8 w-8 text-warning" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Acceso Exclusivo B2B</h1>
        <p className="text-muted-foreground max-w-md mb-8 text-sm">
          Esta sección está reservada para cuentas comerciales y patrocinadores de SportMatch.
        </p>
        <button
          onClick={() => navigate({ to: "/app" })}
          className="px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 active:scale-95 transition-transform"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  // === BLOQUE: handleCreateItem (catálogo) ===
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === "") return;
    try {
      setSubmitting(true);
      const created = await createCatalogItem({
        id: `item-${Date.now()}`,
        business_id: user.id,
        name,
        description: description || null,
        price: Number(price),
        type,
        image_url: imageUrl || "https://images.unsplash.com/photo-1546429070-1fc422f1d77a",
      });
      setItems((prev) => [created, ...prev]);
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      toast.success("¡Producto/Servicio añadido al catálogo!");
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el producto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteCatalogItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item eliminado de tu catálogo");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el item");
    }
  };

  // === BLOQUE: handleSaveProfile ===
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const imgArray = compImages
        ? compImages
            .split(",")
            .map((img) => img.trim())
            .filter(Boolean)
        : [];
      await useProfileStore.getState().updateProfile({
        company_name: compName,
        business_category: compCategory as User["business_category"],
        bio: compBio,
        avatar_url: compLogo,
        address: compAddress,
        district: compDistrict,
        operating_hours: compHours ? [compHours] : [],
        whatsapp: compWhatsapp,
        instagram: compInstagram,
        website: compWebsite,
        images: imgArray,
      });
      toast.success("¡Perfil comercial guardado con éxito!");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error(err instanceof Error ? err.message : "Error al actualizar perfil comercial.");
    } finally {
      setSavingProfile(false);
    }
  };

  const resetAdForm = () => {
    setAdTitle("");
    setAdDesc("");
    setAdCategory("");
    setAdLocation("");
    setAdDistrict("");
    setAdValidUntil("");
    setAdPhone("");
    setAdImage("");
    setAdFeatured(false);
    setAdPremium(false);
    setEditingAdId(null);
  };

  const handleStartEditAd = (ad: Ad) => {
    setEditingAdId(ad.id);
    setAdTitle(ad.title);
    setAdDesc(ad.description);
    setAdCategory(ad.category);
    setAdLocation(ad.location || "");
    setAdDistrict(ad.district || "");
    setAdValidUntil(ad.valid_until ? ad.valid_until.split("T")[0] : "");
    setAdPhone(ad.contact_phone || "");
    setAdImage(ad.image_url || "");
    setAdFeatured(ad.is_featured || false);
    setAdPremium(ad.is_premium || false);
  };

  // === BLOQUE: handleCreateAd ===
  // Crea o actualiza un anuncio. Si tiene costo (featured/premium),
  // abre el diálogo de pago antes de publicar.
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adDesc || !adCategory || !adValidUntil) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }

    if (editingAdId) {
      try {
        setPublishingAd(true);
        await updateAd(editingAdId, {
          title: adTitle,
          description: adDesc,
          image_url: adImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
          category: adCategory as Ad["category"],
          location: adLocation || compAddress || "",
          district: adDistrict || compDistrict || "",
          valid_until: new Date(adValidUntil).toISOString(),
          contact_phone: adPhone || compWhatsapp || "",
          is_featured: adFeatured,
          is_premium: adPremium,
        });
        toast.success("¡Anuncio actualizado con éxito!");
        resetAdForm();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Error al actualizar el anuncio");
      } finally {
        setPublishingAd(false);
      }
      return;
    }

    const cost = (adFeatured ? 10 : 0) + (adPremium ? 20 : 0);
    if (cost > 0) {
      setAdCashCost(cost);
      setPaymentDialogOpen(true);
      return;
    }

    try {
      setPublishingAd(true);
      await createAd({
        business_id: user.id,
        title: adTitle,
        description: adDesc,
        image_url: adImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        category: adCategory as Ad["category"],
        location: adLocation || compAddress || "",
        district: adDistrict || compDistrict || "",
        valid_until: new Date(adValidUntil).toISOString(),
        contact_phone: adPhone || compWhatsapp || "",
        is_featured: false,
        is_premium: false,
      });
      toast.success("¡Anuncio deportivo publicado con éxito!");
      resetAdForm();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al crear anuncio");
    } finally {
      setPublishingAd(false);
    }
  };

  // === BLOQUE: handleAdPaymentConfirm ===
  // Procesa el pago de anuncios destacados/premium, crea el anuncio
  // y descuenta FitCoins si aplica.
  const handleAdPaymentConfirm = async (
    selection: PaymentSelection,
    stripe?: Stripe | null,
    elements?: StripeElements | null,
  ) => {
    try {
      setPublishingAd(true);
      const netAmount = Math.max(
        0,
        adCashCost - (selection.useFitcoins ? selection.fitcoinsToUse : 0),
      );
      const paymentPayload = {
        method: selection.method,
        amount: netAmount,
        useFitcoins: selection.useFitcoins,
        fitcoinsToUse: selection.fitcoinsToUse,
      };

      const result = await processAdPayment(
        paymentPayload,
        `Destacar Campaña: ${adTitle}`,
        stripe,
        elements,
      );
      if (!result.success) {
        toast.error(usePaymentGatewayStore.getState().error || "El pago no pudo ser completado.");
        return;
      }

      await createAd({
        business_id: user.id,
        title: adTitle,
        description: adDesc,
        image_url: adImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        category: adCategory as Ad["category"],
        location: adLocation || compAddress || "",
        district: adDistrict || compDistrict || "",
        valid_until: new Date(adValidUntil).toISOString(),
        contact_phone: adPhone || compWhatsapp || "",
        is_featured: adFeatured,
        is_premium: adPremium,
      });

      if (selection.useFitcoins && selection.fitcoinsToUse > 0) {
        const newBalance = (user.fitcoins_balance || 0) - selection.fitcoinsToUse;
        apiClient.wallet.updateBalance(user.id, newBalance);
        apiClient.wallet.saveTransaction(user.id, {
          id: `tx-ad-${Date.now()}`,
          user_id: user.id,
          amount: -selection.fitcoinsToUse,
          description: `Descuento en destaque: ${adTitle}`,
          type: "SPEND",
          created_at: new Date().toISOString(),
        });
      }

      toast.success("¡Pago recibido y anuncio promocionado publicado!");
      setPaymentDialogOpen(false);
      resetAdForm();
    } catch (err) {
      console.error("Ad creation after payment failed:", err);
      toast.error(err instanceof Error ? err.message : "Error al guardar el anuncio.");
    } finally {
      setPublishingAd(false);
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader
        title="Portal de Empresas y Patrocinadores"
        subtitle={`Ecosistema deportivo conectado para ${user.company_name || user.name}`}
      />

      {/* === BLOQUE: Banner de métricas === */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <MetricCard
          id="business-balance-display"
          label="Saldo FitCoins"
          value={`${user.fitcoins_balance ?? 0} FC`}
          icon={<DollarSign className="h-5 w-5" />}
          accentClass="text-neon bg-neon/10 border-neon/20"
        />
        <MetricCard
          id="business-sales-display"
          label="Ventas Realizadas"
          value={String(sales?.length ?? 0)}
          icon={<ShoppingBag className="h-5 w-5" />}
          accentClass="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        />
        <MetricCard
          id="business-followers-display"
          label="Seguidores"
          value={String(followersCount)}
          icon={<Heart className="h-5 w-5" />}
          accentClass="text-pink-500 bg-pink-500/10 border-pink-500/20"
        />
        <MetricCard
          label="Anuncios Activos"
          value={String(totalAdsCount)}
          icon={<Megaphone className="h-5 w-5" />}
          accentClass="text-electric bg-electric/10 border-electric/20"
        />
        <MetricCard
          label="Impresiones Anuncio"
          value={String(totalViews)}
          icon={<Eye className="h-5 w-5" />}
          accentClass="text-warning bg-warning/10 border-warning/20"
        />
        <MetricCard
          label="Clics Totales"
          value={String(totalClicks)}
          icon={<MousePointer className="h-5 w-5" />}
          accentClass="text-violet-foreground bg-violet/10 border-violet/30"
        />
        <MetricCard
          label="Contactos Match"
          value={String(totalContacts)}
          icon={<Users className="h-5 w-5" />}
          accentClass="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        />
        <MetricCard
          label="Conversión"
          value={totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}%` : "0%"}
          icon={<TrendingUp className="h-5 w-5" />}
          accentClass="text-primary bg-primary/10 border-primary/20"
        />
      </div>

      {/* === BLOQUE: Pestaña Profile === */}
      {activeTab === "profile" && (
        <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card text-left">
          <div className="max-w-3xl">
            <h3 className="font-extrabold text-xl mb-2 flex items-center gap-2 text-foreground">
              🏢 Administrar Perfil Comercial
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Este perfil se mostrará de forma exclusiva en el mapa en vivo para conectar
              deportistas locales con tu establecimiento o servicios.
            </p>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="Ej. Megatlon Club"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Categoría Comercial</label>
                  <select
                    required
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                  >
                    <option value="">Selecciona...</option>
                    <option value="Canchas">🏟️ Canchas / Espacios Deportivos</option>
                    <option value="Gym">🏋️ Gimnasio</option>
                    <option value="Academia">🎓 Academia Deportiva</option>
                    <option value="Fisioterapia">💆 Fisioterapia y Descarga</option>
                    <option value="Nutricionista">🍎 Nutrición Deportiva</option>
                    <option value="Tienda">🛍️ Tienda y Equipamiento</option>
                    <option value="Bebidas">🥤 Bebidas y Suplementos</option>
                    <option value="Torneos">🏆 Torneos y Eventos</option>
                    <option value="Marcas">🏷️ Marcas Deportivas</option>
                    <option value="Patrocinador">⭐ Patrocinador</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">
                  Descripción Comercial (Bio)
                </label>
                <textarea
                  value={compBio}
                  onChange={(e) => setCompBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm resize-none"
                  placeholder="Describe qué ofrece tu negocio deportivo..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <ImageUploadField
                    label="Logo del Perfil"
                    value={compLogo}
                    onChange={(val) => setCompLogo(val)}
                    placeholder="https://images.unsplash.com/..."
                    id="compLogo"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Dirección Física</label>
                  <input
                    type="text"
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="Av. Primavera 123, Oficina 201"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">
                    Distrito / Hub de Cobertura
                  </label>
                  <select
                    value={compDistrict}
                    onChange={(e) => setCompDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                  >
                    <option value="">Selecciona...</option>
                    <option value="Santiago de Surco">Santiago de Surco</option>
                    <option value="San Borja">San Borja</option>
                    <option value="Miraflores">Miraflores</option>
                    <option value="Lince">Lince</option>
                    <option value="Magdalena">Magdalena del Mar</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Horario de Atención</label>
                  <input
                    type="text"
                    value={compHours}
                    onChange={(e) => setCompHours(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="Lunes a Viernes 6am - 11pm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Teléfono WhatsApp</label>
                  <input
                    type="text"
                    value={compWhatsapp}
                    onChange={(e) => setCompWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="+51999888777"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Instagram Usuario</label>
                  <input
                    type="text"
                    value={compInstagram}
                    onChange={(e) => setCompInstagram(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="@megatlon.pe"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Sitio Web</label>
                  <input
                    type="text"
                    value={compWebsite}
                    onChange={(e) => setCompWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="https://megatlon.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">
                  Galería de Fotos (URLs separadas por comas)
                </label>
                <input
                  type="text"
                  value={compImages}
                  onChange={(e) => setCompImages(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                  placeholder="https://unsplash.com/..., https://unsplash.com/..."
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="py-3 px-6 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all text-sm cursor-pointer border-0"
              >
                {savingProfile ? "Guardando..." : "Guardar Perfil Comercial"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === BLOQUE: Pestaña Ads === */}
      {activeTab === "ads" && (
        <div className="grid lg:grid-cols-3 gap-8 text-left">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                📢 Campañas Deportivas Publicadas
              </h3>
              {loadingAds ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-neon" />
                  <span>Cargando anuncios...</span>
                </div>
              ) : (businessAds || []).length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(businessAds || []).map((ad) => (
                    <div
                      key={ad.id}
                      className="glass border border-border rounded-2xl p-4 flex gap-4 items-center hover:ring-glow transition-all relative group"
                    >
                      <img
                        src={
                          ad.image_url ||
                          "https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                        }
                        alt={ad.title}
                        className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary-foreground font-semibold">
                            {ad.category}
                          </span>
                          {ad.is_premium && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-bold">
                              Premium
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-1.5 truncate">
                          {ad.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ad.description}
                        </p>
                        <div className="flex gap-3 text-[10px] text-muted-foreground mt-2 border-t border-border/20 pt-1">
                          <span>👁️ {ad.views || 0}</span>
                          <span>🖱️ {ad.clicks || 0}</span>
                          <span>📞 {ad.contacts || 0}</span>
                        </div>
                      </div>
                      <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleStartEditAd(ad)}
                          className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary grid place-items-center border-0 cursor-pointer"
                          title="Editar campaña"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAd(ad.id)}
                          className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 grid place-items-center border-0 cursor-pointer"
                          title="Eliminar campaña"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl text-xs">
                  No has publicado ningún anuncio deportivo todavía.
                </div>
              )}
            </div>
          </div>

          {/* Formulario de creación/edición de anuncios */}
          <div>
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card sticky top-8">
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />{" "}
                {editingAdId ? "Editar Anuncio / Campaña" : "Crear Campaña"}
              </h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                Publica ofertas deportivas vinculadas a la preparación, torneos, rehabilitación o
                indumentaria.
              </p>
              <form onSubmit={handleCreateAd} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Título del Anuncio</label>
                  <input
                    type="text"
                    required
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="Ej. Torneo de Pádel Intermedio"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">
                    Descripción / Llamado a la Acción
                  </label>
                  <textarea
                    required
                    value={adDesc}
                    onChange={(e) => setAdDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm resize-none h-16"
                    placeholder="Ej. Inscríbete hoy y te emparejamos con otros jugadores..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Categoría</label>
                    <select
                      required
                      value={adCategory}
                      onChange={(e) => setAdCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    >
                      <option value="">Selecciona...</option>
                      <option value="Canchas">🏟️ Canchas</option>
                      <option value="Gym">🏋️ Gimnasio</option>
                      <option value="Academia">🎓 Academia</option>
                      <option value="Fisioterapia">💆 Fisioterapia</option>
                      <option value="Nutricionista">🍎 Nutrición</option>
                      <option value="Tienda">🛍️ Tienda</option>
                      <option value="Bebidas">🥤 Bebidas</option>
                      <option value="Torneos">🏆 Torneos</option>
                      <option value="Marcas">🏷️ Marcas</option>
                      <option value="Patrocinador">⭐ Patrocinador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Vence el</label>
                    <input
                      type="date"
                      required
                      value={adValidUntil}
                      onChange={(e) => setAdValidUntil(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <ImageUploadField
                    label="Imagen de Campaña"
                    value={adImage}
                    onChange={(val) => setAdImage(val)}
                    placeholder="https://images.unsplash.com/..."
                    id="adImage"
                  />
                </div>
                <div className="border border-border/60 rounded-xl p-3 bg-background/50 space-y-2.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    ⭐ Opciones de Monetización
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="adFeatured"
                      checked={adFeatured}
                      onChange={(e) => setAdFeatured(e.target.checked)}
                      className="rounded border-border focus:ring-primary h-4 w-4 bg-background text-primary"
                    />
                    <label
                      htmlFor="adFeatured"
                      className="text-xs text-foreground font-semibold cursor-pointer select-none"
                    >
                      Destacar Anuncio (+100 FC)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="adPremium"
                      checked={adPremium}
                      onChange={(e) => setAdPremium(e.target.checked)}
                      className="rounded border-border focus:ring-primary h-4 w-4 bg-background text-primary"
                    />
                    <label
                      htmlFor="adPremium"
                      className="text-xs text-foreground font-semibold cursor-pointer select-none"
                    >
                      Campaña Premium (+200 FC)
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={publishingAd}
                    className="flex-1 py-3 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all text-sm cursor-pointer border-0"
                  >
                    {publishingAd
                      ? "Guardando..."
                      : editingAdId
                        ? "Guardar Cambios"
                        : "Publicar Campaña"}
                  </button>
                  {editingAdId && (
                    <button
                      type="button"
                      onClick={resetAdForm}
                      className="px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-all text-xs border border-border/50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Dialog de pago para anuncios destacados */}
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-background border border-border rounded-3xl p-6 text-left">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-bold text-foreground">
                  Pago de Destaque de Anuncio
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Completa tu pago seguro para activar las opciones promocionales de tu anuncio.
                </DialogDescription>
              </DialogHeader>
              <PaymentCheckout
                cost={adCashCost}
                userBalance={user.fitcoins_balance || 0}
                onConfirm={handleAdPaymentConfirm}
                isProcessing={isAdPaying}
                disabled={publishingAd}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* === BLOQUE: Pestaña Analytics === */}
      {activeTab === "analytics" && (
        <div className="space-y-6" id="bi-analytics-section">
          <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card text-left">
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-neon" /> Tráfico e Interacciones de Campaña
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Rendimiento semanal de visualizaciones y clics para tus promociones deportivas.
            </p>
            <div className="h-[280px] w-full" id="bi-sales-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="impresiones"
                    stroke="#00E5FF"
                    fill="url(#impressionsGrad)"
                    strokeWidth={2}
                    name="Visualizaciones"
                  />
                  <Area
                    type="monotone"
                    dataKey="clics"
                    stroke="#FF6B35"
                    fill="url(#salesGrad)"
                    strokeWidth={2}
                    name="Clics"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alcance geográfico y KPIs */}
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <Target className="h-5 w-5 text-warning" /> Alcance Geográfico B2B
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Ubicación de los deportistas que interactúan con tu ficha comercial.
              </p>
              <div
                className="h-[220px] w-full flex items-center justify-center"
                id="bi-reach-chart"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reachData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {reachData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value}%`, "Deportistas"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {reachData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value}%)
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-electric" /> KPIs de Conversión Deportiva
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Métricas de contacto y conversión sobre matchmaking.
              </p>
              <div className="space-y-4">
                <KpiRow
                  label="Tasa de Clics (CTR)"
                  value={
                    totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}%` : "0%"
                  }
                  barWidth={
                    totalViews > 0 ? Math.min((totalClicks / totalViews) * 100 * 5, 100) : 2
                  }
                  color="neon"
                />
                <KpiRow
                  label="Contactos Generados"
                  value={`${totalContacts} atletas`}
                  barWidth={Math.min(totalContacts * 10, 100)}
                  color="electric"
                />
                <KpiRow
                  label="Seguidores Deportivos"
                  value={`${followersCount} activos`}
                  barWidth={Math.min(followersCount * 20, 100)}
                  color="warning"
                />
                <KpiRow
                  label="Anuncios de Matchmaking"
                  value={`${totalAdsCount}`}
                  barWidth={Math.min(totalAdsCount * 15, 100)}
                  color="primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === BLOQUE: Pestaña Catalog === */}
      {activeTab === "catalog" && (
        <div className="grid lg:grid-cols-3 gap-8 text-left">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                📦 Mi Catálogo de Ventas
              </h3>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-neon" />
                  <span>Cargando catálogo...</span>
                </div>
              ) : (items || []).length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(items || []).map((item) => (
                    <div
                      key={item.id}
                      className="glass border border-border rounded-2xl p-4 flex gap-4 items-center hover:ring-glow transition-all relative group"
                    >
                      <img
                        src={
                          item.image_url ||
                          "https://images.unsplash.com/photo-1546429070-1fc422f1d77a"
                        }
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary-foreground font-semibold">
                          {item.type === "PRODUCT" ? "Producto" : "Servicio"}
                        </span>
                        <h4 className="font-bold text-sm text-foreground mt-1 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                        <span className="text-xs font-bold text-neon block mt-1">
                          {item.price} FC
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 border-0 cursor-pointer"
                        title="Eliminar del catálogo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl text-sm">
                  No has publicado ningún producto o servicio todavía.
                </div>
              )}
            </div>
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-4">📈 Registro de Ventas Recientes</h3>
              {(sales || []).filter((s) => (items || []).some((i) => i.id === s.catalog_item_id))
                .length > 0 ? (
                <div className="space-y-3">
                  {(sales || [])
                    .filter((s) => (items || []).some((i) => i.id === s.catalog_item_id))
                    .map((sale) => (
                      <div
                        key={sale.id}
                        className="flex justify-between items-center py-2 border-b border-border/50 text-sm"
                      >
                        <div>
                          <div className="font-semibold">{sale.item_name}</div>
                          <div className="text-xs text-muted-foreground">
                            Comprador: {sale.buyer_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-neon">+{sale.price} FC</div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No tienes transacciones de venta registradas aún.
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card sticky top-8">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Nuevo Item
              </h3>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">
                    Nombre del Producto / Servicio
                  </label>
                  <input
                    type="text"
                    required
                    id="catalog-item-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="Ej. Bebida Deportiva Isotónica"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Descripción</label>
                  <textarea
                    id="catalog-item-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm resize-none h-16"
                    placeholder="Ej. 500ml sabor limón..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Precio (FitCoins)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      id="catalog-item-price"
                      value={price}
                      onChange={(e) =>
                        setPrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Tipo</label>
                    <select
                      id="catalog-item-type"
                      value={type}
                      onChange={(e) => setType(e.target.value as "PRODUCT" | "SERVICE")}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    >
                      <option value="PRODUCT">Producto</option>
                      <option value="SERVICE">Servicio</option>
                    </select>
                  </div>
                </div>
                <div>
                  <ImageUploadField
                    label="Imagen del Item"
                    value={imageUrl}
                    onChange={(val) => setImageUrl(val)}
                    placeholder="https://images.unsplash.com/..."
                    id="catalog-item-image"
                  />
                </div>
                <button
                  type="submit"
                  id="catalog-item-submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all text-sm cursor-pointer border-0"
                >
                  {submitting ? "Publicando..." : "Publicar en Marketplace"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* === BLOQUE: Pestaña Venues === */}
      {activeTab === "venues" && (
        <div className="space-y-6 text-left">
          <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-xl mb-1 flex items-center gap-2 text-foreground">
                📍 Mis Sedes / Ubicaciones Registradas
              </h3>
              <p className="text-xs text-muted-foreground">
                Gestiona las ubicaciones físicas de tu negocio deportivo. Se mostrarán
                georreferenciadas en el mapa en vivo de los jugadores.
              </p>
            </div>
            <button
              onClick={() => setVenueFormOpen(true)}
              className="px-5 py-3 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all text-sm cursor-pointer border-0 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Registrar Nueva Sede
            </button>
          </div>

          {loadingVenues ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 bg-gradient-card border border-border rounded-3xl shadow-card">
              <Loader2 className="h-8 w-8 animate-spin text-neon" />
              <span className="text-sm font-semibold">Cargando sedes...</span>
            </div>
          ) : (venues || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(venues || []).map((venue) => (
                <div
                  key={venue.id}
                  className="premium-card overflow-hidden hover:ring-glow transition-all relative group flex flex-col h-full"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted border-b border-border/40 shrink-0">
                    <img
                      src={
                        venue.image_url ||
                        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8"
                      }
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold shadow-md">
                      {venue.sport}
                    </span>
                    <button
                      onClick={() => handleDeleteVenue(venue.id)}
                      className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/80 text-red-400 hover:text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-all absolute right-3 top-3 border-0 cursor-pointer shadow-md"
                      title="Eliminar sede"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-base text-foreground line-clamp-1">
                        {venue.name}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">
                          {venue.address} {venue.district ? `(${venue.district})` : ""}
                        </span>
                      </p>
                      {venue.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed italic">
                          "{venue.description}"
                        </p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-border/20 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-neon">
                        {(venue.price_per_hour ?? 0) > 0
                          ? `${venue.price_per_hour} FC/h`
                          : "Acceso Libre"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                        {venue.operating_hours?.[0] || "Horario n/e"}
                      </span>
                    </div>

                    {/* Confirmamos que la sede aparecerá en el mapa sin exponer coordenadas. */}
                    <div className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-neon" />
                      <span>Ubicación configurada en el mapa</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center text-muted-foreground bg-gradient-card border border-dashed border-border rounded-3xl shadow-card flex flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted/10 border border-border/40 grid place-items-center mb-2">
                <MapPin className="h-6 w-6" />
              </div>
              <p className="text-sm max-w-sm">
                No has registrado ninguna sede comercial todavía. Haz clic en el botón superior para
                agregar tu primer establecimiento deportivo.
              </p>
            </div>
          )}

          {/* Dialog para registrar nueva sede */}
          <Dialog open={venueFormOpen} onOpenChange={setVenueFormOpen}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-3xl p-6 text-left">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-bold text-foreground">
                  Registrar Nueva Sede
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Completa el formulario para mostrar este establecimiento en el mapa en vivo de los
                  jugadores.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateVenue} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Nombre de la Sede</label>
                  <input
                    type="text"
                    required
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="Ej. Megatlon Magdalena"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Especialidad / Rubro</label>
                    <select
                      required
                      value={venueSport}
                      onChange={(e) => setVenueSport(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    >
                      <option value="">Selecciona...</option>
                      <optgroup label="Categorías Principales">
                        <option value="Canchas">🏟️ Canchas</option>
                        <option value="Gym">🏋️ Gimnasio</option>
                        <option value="Academia">🎓 Academia</option>
                        <option value="Fisioterapia">💆 Fisioterapia</option>
                        <option value="Nutricionista">🍎 Nutrición</option>
                        <option value="Tienda">🛍️ Tienda</option>
                        <option value="Bebidas">🥤 Bebidas</option>
                        <option value="Torneos">🏆 Torneos</option>
                        <option value="Marcas">🏷️ Marcas</option>
                        <option value="Patrocinador">⭐ Patrocinador</option>
                      </optgroup>
                      <optgroup label="Disciplinas Deportivas">
                        {(sportsList || []).map((sport) => (
                          <option key={sport.id} value={sport.name}>
                            {sport.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">
                      Costo estimado/hora (FC)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={venuePrice}
                      onChange={(e) =>
                        setVenuePrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                      placeholder="0 (Libre)"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Distrito</label>
                    <select
                      required
                      value={venueDistrict}
                      onChange={(e) => setVenueDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    >
                      <option value="">Selecciona...</option>
                      <option value="Santiago de Surco">Surco</option>
                      <option value="San Borja">San Borja</option>
                      <option value="Miraflores">Miraflores</option>
                      <option value="Lince">Lince</option>
                      <option value="Magdalena">Magdalena del Mar</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Horario de Atención</label>
                    <input
                      type="text"
                      value={venueHours}
                      onChange={(e) => setVenueHours(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                      placeholder="Ej. Lun-Vie 6am - 10pm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Descripción de la Sede</label>
                  <textarea
                    value={venueDescription}
                    onChange={(e) => setVenueDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm resize-none"
                    placeholder="Describe los servicios disponibles en esta sede..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Dirección Física</label>
                  <input
                    type="text"
                    required
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="Av. Brasil 3450"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold">Ubicación del establecimiento</label>
                    <button
                      type="button"
                      onClick={handleAutofillLocation}
                      className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1.5 cursor-pointer border-0 bg-transparent"
                    >
                      Usar mi ubicación actual
                    </button>
                  </div>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    Haz clic sobre el mapa para marcar la entrada principal de tu sede.
                  </p>
                  <VenueLocationPicker
                    lat={venueLat}
                    lng={venueLng}
                    onChange={(lat, lng) => {
                      setVenueLat(lat);
                      setVenueLng(lng);
                    }}
                  />
                  <div className="mt-2 text-[11px] font-medium text-muted-foreground">
                    {venueLat === "" || venueLng === ""
                      ? "Todavía no has seleccionado una ubicación."
                      : "Ubicación seleccionada correctamente."}
                  </div>
                </div>
                <div>
                  <ImageUploadField
                    label="Imagen de la Sede"
                    value={venueImage}
                    onChange={(val) => setVenueImage(val)}
                    placeholder="https://images.unsplash.com/..."
                    id="venue-register-image"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setVenueFormOpen(false)}
                    className="px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-all text-xs border border-border/50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={registeringVenue}
                    className="flex-1 py-3 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all text-sm cursor-pointer border-0"
                    id="venue-register-submit"
                  >
                    {registeringVenue ? "Registrando..." : "Registrar Nueva Sede"}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* === BLOQUE: Pestaña Settings === */}
      {activeTab === "settings" && (
        <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card text-left max-w-3xl">
          <h3 className="font-extrabold text-xl mb-2 flex items-center gap-2 text-foreground">
            ⚙️ Configuración del Portal Comercial
          </h3>
          <p className="text-xs text-muted-foreground mb-6">
            Administra las preferencias de tu cuenta comercial, notificaciones y herramientas de
            simulación.
          </p>
          <div className="space-y-6">
            <div className="border-b border-border/40 pb-6">
              <h4 className="font-bold text-sm text-foreground mb-3">
                Preferencias de Notificaciones
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Alertas de Matchmaking
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Recibir notificaciones cuando un jugador interactúe con tus anuncios.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-border focus:ring-primary h-4 w-4 bg-background text-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-foreground">Reportes de Tráfico</div>
                    <div className="text-[10px] text-muted-foreground">
                      Enviar resúmenes semanales de analíticas de visualizaciones y clics.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-border focus:ring-primary h-4 w-4 bg-background text-primary"
                  />
                </div>
              </div>
            </div>
            <div className="border-b border-border/40 pb-6">
              <h4 className="font-bold text-sm text-foreground mb-2">Información del Sistema</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Rol de Cuenta
                  </span>
                  <span className="text-foreground font-semibold">🏢 BUSINESS (Empresa)</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Identificador de Negocio
                  </span>
                  <span className="text-foreground font-semibold font-mono truncate block">
                    {user.id}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground mb-2 text-warning">
                Herramientas de Demostración
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Si estás utilizando la aplicación en modo demostración local, puedes limpiar todos
                los datos dinámicos guardados en tu navegador.
              </p>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("sportmatch_demo_venues");
                  localStorage.removeItem("sportmatch_demo_courts");
                  localStorage.removeItem("sportmatch_demo_balances");
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("sportmatch_demo_transactions_"))
                      localStorage.removeItem(key);
                  }
                  toast.success("¡Datos de demo reiniciados correctamente!");
                  setTimeout(() => window.location.reload(), 1000);
                }}
                className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all text-xs cursor-pointer border-0 flex items-center gap-2"
              >
                🔄 Reiniciar Datos de la Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === BLOQUE: Pestaña Intelligence (B2B-AI) === */}
      {/* Feature #9 Pricing, #21 Ads Optimizer, #23 Churn Predictor */}
      {activeTab === "intelligence" && (
        <IntelligenceDashboard
          businessId={user.id}
          businessName={user.company_name || user.name}
          courts={venues.map((v) => ({ id: v.id, name: v.name }))}
          ads={businessAds}
        />
      )}
    </div>
  );
}

// === BLOQUE: MetricCard ===
// Componente reutilizable para mostrar una métrica con ícono y valor.
function MetricCard({
  label,
  value,
  icon,
  accentClass,
  id,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentClass: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card relative overflow-hidden"
    >
      <div
        className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: "currentColor" }}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">
            {label}
          </span>
          <span className="text-xl md:text-2xl font-extrabold">{value}</span>
        </div>
        <div
          className={`h-10 w-10 rounded-xl border grid place-items-center shrink-0 ${accentClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// === BLOQUE: KpiRow ===
// Barra de progreso horizontal con etiqueta para KPIs de analytics.
function KpiRow({
  label,
  value,
  barWidth,
  color,
}: {
  label: string;
  value: string;
  barWidth: number;
  color: string;
}) {
  const getColor = () => {
    switch (color) {
      case "neon":
        return "hsl(var(--neon))";
      case "electric":
        return "hsl(var(--electric))";
      case "warning":
        return "hsl(var(--warning))";
      default:
        return "hsl(var(--primary))";
    }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(barWidth, 2)}%`, background: getColor() }}
        />
      </div>
    </div>
  );
}
