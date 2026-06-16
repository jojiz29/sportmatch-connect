import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { favoritesApi } from "@/features/courts/api/favoritesApi";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface FavoriteButtonProps {
  courtId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ courtId, className, size = "md", onToggle }: FavoriteButtonProps) {
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    favoritesApi.isFavorite(courtId).then(setIsFavorite);
  }, [courtId]);

  const handleToggle = useCallback(async () => {
    setLoading(true);
    const prev = isFavorite;
    setIsFavorite(!prev);

    const result = await favoritesApi.toggle(courtId);
    if (result !== !prev) {
      setIsFavorite(prev);
    }
    onToggle?.(result);
    setLoading(false);
  }, [courtId, isFavorite, onToggle]);

  const sizeClasses = {
    sm: "h-7 w-7 p-1",
    md: "h-9 w-9 p-2",
    lg: "h-11 w-11 p-2.5",
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "rounded-full transition-all active:scale-90",
        "hover:bg-accent/50 backdrop-blur-sm",
        isFavorite
          ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
          : "bg-background/60 text-muted-foreground hover:text-foreground",
        sizeClasses[size],
        className,
      )}
      aria-label={
        isFavorite
          ? t("favorites.remove", "Quitar de favoritos")
          : t("favorites.add", "Añadir a favoritos")
      }
      title={
        isFavorite
          ? t("favorites.remove", "Quitar de favoritos")
          : t("favorites.add", "Añadir a favoritos")
      }
    >
      <Heart className={cn("h-full w-full transition-all", isFavorite && "fill-destructive")} />
    </button>
  );
}
