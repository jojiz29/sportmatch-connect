import { Venue, User } from "@/entities/types";
import { getSportFallbackImage } from "@/shared/lib/imageUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Clock,
  Edit3,
  ExternalLink,
  Globe,
  Instagram,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";

export function VenueDetailModal({
  venue,
  owner,
  isOpen,
  onOpenChange,
  onEdit,
}: {
  venue: Venue | null;
  owner?: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (venue: Venue) => void;
}) {
  if (!venue) return null;
  const image = venue.image_url || getSportFallbackImage(venue.sport);
  const instagramUrl = owner?.instagram
    ? owner.instagram.startsWith("http")
      ? owner.instagram
      : `https://instagram.com/${owner.instagram.replace("@", "")}`
    : null;
  const websiteUrl = owner?.website
    ? owner.website.startsWith("http")
      ? owner.website
      : `https://${owner.website}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-3xl p-0">
        <div className="relative h-64 overflow-hidden rounded-t-3xl bg-muted">
          <img src={image} alt={venue.name} className="h-full w-full object-cover" />
          <span className="absolute left-5 top-5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            {venue.sport}
          </span>
        </div>

        <div className="p-6 md:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-extrabold">{venue.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {venue.address || "Dirección no especificada"}
              {venue.district ? ` · ${venue.district}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Detail
              icon={<Clock />}
              label="Horario"
              value={venue.operating_hours?.[0] || "Por confirmar"}
            />
            <Detail
              icon={<Users />}
              label="Capacidad"
              value={`${venue.max_players || 4} jugadores`}
            />
            <Detail
              icon={<MessageSquare />}
              label="Precio"
              value={venue.price_per_hour > 0 ? `${venue.price_per_hour} FC/h` : "Acceso libre"}
            />
          </div>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h3 className="font-bold">Sobre esta sede</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {venue.description || "La empresa todavía no agregó una descripción para esta sede."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(venue.amenities || []).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </section>

          {owner && (
            <section className="mt-4 rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold">{owner.company_name || owner.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{owner.business_category}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {owner.whatsapp && (
                  <SocialLink
                    href={`https://wa.me/${owner.whatsapp.replace(/\D/g, "")}`}
                    label="WhatsApp"
                    icon={<MessageSquare />}
                  />
                )}
                {instagramUrl && (
                  <SocialLink href={instagramUrl} label="Instagram" icon={<Instagram />} />
                )}
                {websiteUrl && <SocialLink href={websiteUrl} label="Sitio web" icon={<Globe />} />}
              </div>
            </section>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              <MapPin className="h-4 w-4" /> Cómo llegar
            </a>
            {onEdit && (
              <button
                onClick={() => onEdit(venue)}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold cursor-pointer"
              >
                <Edit3 className="h-4 w-4" /> Editar sede
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      {<span className="[&>svg]:h-4 [&>svg]:w-4 text-primary">{icon}</span>}
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold"
    >
      {icon}
      <span>{label}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
