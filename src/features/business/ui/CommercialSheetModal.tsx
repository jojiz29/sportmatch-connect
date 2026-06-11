import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  MapPin,
  Clock,
  Instagram as InstagramIcon,
  Globe,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { User } from "@/entities/types";
import { useAdsStore } from "../model/useAdsStore";
import { toast } from "sonner";
import { getSportFallbackImage } from "@/shared/lib/imageUtils";

interface CommercialSheetModalProps {
  business: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateCatalog?: (businessId: string) => void;
}

export function CommercialSheetModal({
  business,
  isOpen,
  onOpenChange,
  onNavigateCatalog,
}: CommercialSheetModalProps) {
  const { ads, fetchAds, trackAdAction } = useAdsStore();

  useEffect(() => {
    if (isOpen && business) {
      // Fetch ads for this specific business
      fetchAds(business.id);

      // Track general view action for all ads of this business on sheet open
      // This increases the "views" metric dynamically
      setTimeout(() => {
        const businessAds = ads.filter((ad) => ad.business_id === business.id);
        businessAds.forEach((ad) => {
          trackAdAction(ad.id, "views");
        });
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, business, fetchAds, trackAdAction]);

  if (!business) return null;

  const businessAds = ads.filter((ad) => ad.business_id === business.id);

  // Generate WhatsApp link with custom message based on matchmaking
  const cleanPhone = business.whatsapp ? business.whatsapp.replace(/\D/g, "") : "";
  const whatsappText = encodeURIComponent(
    `Hola ${business.company_name || business.name}, vi tu perfil comercial en SportMatch. Me interesa conocer más sobre tus servicios deportivos para encontrar compañeros y entrenamientos.`,
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappText}`;

  // Instagram handle clean
  const instagramUrl = business.instagram
    ? business.instagram.startsWith("http")
      ? business.instagram
      : `https://instagram.com/${business.instagram.replace("@", "")}`
    : null;

  // Website clean
  const websiteUrl = business.website
    ? business.website.startsWith("http")
      ? business.website
      : `https://${business.website}`
    : null;

  const handleContactAction = (adId?: string) => {
    if (adId) {
      trackAdAction(adId, "contacts");
    } else if (businessAds.length > 0) {
      // Increment contacts for the first ad if general contact clicked
      trackAdAction(businessAds[0].id, "contacts");
    }
    toast.success("Redireccionando al contacto comercial...");
  };

  const handleAdClick = (adId: string) => {
    trackAdAction(adId, "clicks");
  };

  // Default images gallery
  const gallery =
    business.images && business.images.length > 0
      ? business.images
      : [business.avatar_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background border border-border rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-4">
            <img
              src={
                business.avatar_url ||
                "https://api.dicebear.com/7.x/identicon/svg?seed=" + business.id
              }
              alt={business.company_name || business.name}
              className="h-16 w-16 rounded-2xl object-cover bg-muted border border-border/80 shadow-md"
            />
            <div className="text-left">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
                🏢 {business.business_category || "Negocio Deportivo"}
              </span>
              <DialogTitle className="text-2xl font-extrabold text-foreground mt-0.5">
                {business.company_name || business.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  {business.address || "Lima, Perú"}{" "}
                  {business.district ? `· ${business.district}` : ""}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-4">
            {/* Business Bio / Description */}
            <div className="glass border border-border/60 rounded-2xl p-5 text-left space-y-3">
              <h4 className="font-bold text-sm text-foreground">Sobre Nosotros</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {business.bio ||
                  "Este comercio aún no ha registrado una descripción comercial. ¡Ofrece excelentes servicios y eventos deportivos!"}
              </p>
            </div>

            {/* Hours and Details */}
            <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 text-left space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-border/30 pb-2">
                <Clock className="h-4.5 w-4.5 text-electric shrink-0" />
                <div>
                  <span className="font-bold text-foreground block">Horarios de Atención</span>
                  <span className="text-muted-foreground">
                    {business.operating_hours && business.operating_hours.length > 0
                      ? business.operating_hours.join(", ")
                      : "Lunes a Sábado: 8:00 AM - 10:00 PM"}
                  </span>
                </div>
              </div>

              <div className="flex gap-1 flex-wrap pt-1">
                {business.preferred_sports &&
                  business.preferred_sports.map((sport) => (
                    <span
                      key={sport}
                      className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold"
                    >
                      {sport}
                    </span>
                  ))}
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-col gap-2.5">
              {business.whatsapp && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactAction()}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs cursor-pointer border-0"
                >
                  <MessageSquare className="h-4.5 w-4.5" /> CONTACTAR POR WHATSAPP
                </a>
              )}

              <div className="grid grid-cols-2 gap-2">
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactAction()}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[11px] font-bold hover:opacity-90 transition-all cursor-pointer border-0"
                  >
                    <InstagramIcon className="h-4 w-4" /> Instagram
                  </a>
                ) : (
                  <div className="py-2.5 rounded-xl bg-accent/30 text-muted-foreground text-[11px] font-semibold text-center border border-border/50 select-none">
                    Sin Instagram
                  </div>
                )}

                {websiteUrl ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactAction()}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-[11px] font-bold transition-all border-0 cursor-pointer"
                  >
                    <Globe className="h-4 w-4" /> Sitio Web <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <div className="py-2.5 rounded-xl bg-accent/30 text-muted-foreground text-[11px] font-semibold text-center border border-border/50 select-none">
                    Sin Web
                  </div>
                )}
              </div>

              {onNavigateCatalog && (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onNavigateCatalog(business.id);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-primary hover:scale-[1.01] active:scale-[0.99] text-primary-foreground font-bold rounded-xl shadow-glow transition-all text-xs cursor-pointer border-0"
                >
                  <ShoppingBag className="h-4 w-4" /> VER CATÁLOGO DE PRODUCTOS / SERVICIOS
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Gallery & Active Matchmaking Ads */}
          <div className="space-y-4 text-left">
            {/* Primary Gallery Image */}
            <div className="relative h-44 rounded-2xl overflow-hidden border border-border/50 shadow-md">
              <img src={gallery[0]} alt="Local" className="w-full h-full object-cover" />
              {business.is_sponsored && (
                <div className="absolute top-2 right-2 bg-yellow-500/90 text-black px-2 py-0.5 rounded-md text-[9px] font-bold shadow-md animate-pulse flex items-center gap-0.5">
                  <Sparkles className="h-3 w-3" /> Premium
                </div>
              )}
            </div>

            {/* Active Ads list */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                📢 Eventos y Promociones Activas
              </h4>

              {businessAds.length > 0 ? (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {businessAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="glass border border-border/60 rounded-xl p-3 flex gap-3 items-start hover:ring-glow transition-all relative group"
                    >
                      <img
                        src={ad.image_url || getSportFallbackImage("Pádel")}
                        alt={ad.title}
                        className="h-14 w-14 rounded-lg object-cover bg-muted shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary-foreground font-bold uppercase tracking-wider">
                          {ad.category}
                        </span>
                        <h5 className="font-bold text-xs text-foreground mt-1 truncate">
                          {ad.title}
                        </h5>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                          {ad.description}
                        </p>
                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-border/20">
                          <span className="text-[8px] text-muted-foreground">
                            Vence: {new Date(ad.valid_until).toLocaleDateString()}
                          </span>
                          <a
                            href={`https://wa.me/${cleanPhone}?text=Hola, me interesa el anuncio "${ad.title}" que vi en SportMatch.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              handleAdClick(ad.id);
                              handleContactAction(ad.id);
                            }}
                            className="text-[9px] font-bold text-neon hover:underline flex items-center gap-0.5"
                          >
                            Me interesa <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border/60 rounded-2xl text-xs">
                  No hay anuncios publicados por este comercio en este momento.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
