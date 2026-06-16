import { useState } from "react";
import { Share2, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { shareService, type ShareableAchievement } from "@/shared/api/shareService";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  achievement: ShareableAchievement;
  variant?: "icon" | "button";
  className?: string;
  onShare?: () => void;
}

export function ShareButton({
  achievement,
  variant = "icon",
  className,
  onShare,
}: ShareButtonProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleShare = async () => {
    setStatus("loading");
    const result = await shareService.share(achievement);
    if (result) {
      setStatus("success");
      onShare?.();
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("idle");
    }
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={status === "loading"}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px]",
          status === "success"
            ? "bg-neon/20 text-neon border border-neon/30"
            : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
          className,
        )}
        aria-label={t("share.button", "Compartir")}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "success" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {status === "success" ? t("share.copied", "¡Copiado!") : t("share.button", "Compartir")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={status === "loading"}
      className={cn(
        "p-2 rounded-lg transition-all hover:bg-accent active:scale-90",
        status === "success" && "text-neon",
        className,
      )}
      aria-label={t("share.button", "Compartir")}
      title={t("share.button", "Compartir")}
    >
      {status === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : status === "success" ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </button>
  );
}
