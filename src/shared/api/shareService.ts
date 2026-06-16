import { useAuthStore } from "@/entities/user/useAuth";

export type ShareableAchievement =
  | { type: "level_up"; level: number; label: string; xp?: number }
  | { type: "match_completed"; sport: string; score?: string }
  | { type: "challenge_completed"; name: string; reward?: number }
  | { type: "badge_unlocked"; badge: string }
  | { type: "ranking_position"; position: number };

interface ShareData {
  title: string;
  text: string;
  url: string;
}

function getAchievementText(achievement: ShareableAchievement): string {
  const user = useAuthStore.getState().user;
  const name = user?.name || "Un deportista";

  switch (achievement.type) {
    case "level_up":
      return `${name} acaba de subir a nivel ${achievement.level} (${achievement.label}) en SportMatch! 🏆`;
    case "match_completed": {
      const score = achievement.score ? ` (${achievement.score})` : "";
      return `${name} completó un partidazo de ${achievement.sport}${score} en SportMatch! 🔥`;
    }
    case "challenge_completed": {
      const reward = achievement.reward ? ` +${achievement.reward} FC` : "";
      return `${name} completó el desafío "${achievement.name}"${reward} en SportMatch! 🎯`;
    }
    case "badge_unlocked":
      return `${name} desbloqueó la insignia "${achievement.badge}" en SportMatch! ⭐`;
    case "ranking_position":
      return `${name} está en el puesto #${achievement.position} del ranking de SportMatch! 🥇`;
  }
}

export const shareService = {
  generateShareData(achievement: ShareableAchievement): ShareData {
    const text = getAchievementText(achievement);
    return {
      title: "SportMatch - Logro deportivo",
      text,
      url: "https://sportmatch-connect.vercel.app/app",
    };
  },

  async share(achievement: ShareableAchievement): Promise<boolean> {
    const data = this.generateShareData(achievement);

    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, text: data.text, url: data.url });
        return true;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return false;
        return this.fallbackCopy(data.text);
      }
    }

    return this.fallbackCopy(data.text);
  },

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  async fallbackCopy(text: string): Promise<boolean> {
    const copied = await this.copyToClipboard(text);
    if (!copied) {
      globalThis.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
    return copied;
  },

  shareToWhatsApp(achievement: ShareableAchievement): void {
    const data = this.generateShareData(achievement);
    const message = data.text + "\n" + data.url;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    globalThis.open(whatsappUrl, "_blank", "noopener,noreferrer");
  },

  shareToTwitter(achievement: ShareableAchievement): void {
    const data = this.generateShareData(achievement);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}&hashtags=SportMatch,Deporte,FitCoins`;
    globalThis.open(twitterUrl, "_blank", "noopener,noreferrer");
  },
};
