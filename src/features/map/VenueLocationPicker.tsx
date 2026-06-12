import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useThemeStore } from "@/features/theme/store";

interface VenueLocationPickerProps {
  lat: number | "";
  lng: number | "";
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_LIMA_LOCATION: [number, number] = [-12.14, -76.995];

function LocationSelection({
  lat,
  lng,
  onChange,
}: {
  lat: number | "";
  lng: number | "";
  onChange: (lat: number, lng: number) => void;
}) {
  const theme = useThemeStore((s) => s.theme);
  const getThemePrimaryColor = () => {
    if (theme === "world-cup") return "#D4AF37";
    if (theme === "dark-footballer") return "#39FF14";
    return "#ff5722"; // light/default
  };
  const primaryColor = getThemePrimaryColor();
  const map = useMapEvents({
    click(event) {
      // Guardamos internamente las coordenadas escogidas sin exigir que la empresa las escriba.
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  useEffect(() => {
    // Los mapas dentro de un diálogo necesitan recalcular su tamaño cuando se vuelven visibles.
    const timeoutId = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timeoutId);
  }, [map]);

  useEffect(() => {
    if (lat !== "" && lng !== "") {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.5 });
    }
  }, [lat, lng, map]);

  if (lat === "" || lng === "") return null;

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={10}
      pathOptions={{ color: "#ffffff", fillColor: primaryColor, fillOpacity: 1, weight: 3 }}
    />
  );
}

export function VenueLocationPicker({ lat, lng, onChange }: VenueLocationPickerProps) {
  const center: [number, number] = lat !== "" && lng !== "" ? [lat, lng] : DEFAULT_LIMA_LOCATION;

  return (
    <div className="h-64 overflow-hidden rounded-2xl border border-border">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationSelection lat={lat} lng={lng} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
