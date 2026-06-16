import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";

export interface ChallengeInvitation {
  id: string;
  token: string;
  challenger_id: string;
  sport: string;
  modality: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  location: string | null;
  message: string;
  status: string;
  created_at: string;
  expires_at: string;
  challenger?: {
    name: string;
    avatar_url: string | null;
    level: number;
    label: string;
  };
}

export const invitationService = {
  async create(input: {
    sport: string;
    modality?: string;
    message?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    location?: string;
  }): Promise<{ token: string; url: string } | null> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;

    const { data, error } = await supabase.rpc("create_challenge_invitation", {
      p_sport: input.sport,
      p_modality: input.modality || "amistoso",
      p_message: input.message || "",
      p_scheduled_date: input.scheduledDate || null,
      p_scheduled_time: input.scheduledTime || null,
      p_location: input.location || null,
    });

    if (error) {
      console.error("Error creating invitation:", error);
      return null;
    }

    return { token: data.token, url: data.url };
  },

  async getByToken(token: string): Promise<ChallengeInvitation | null> {
    const { data, error } = await supabase.rpc("get_invitation_by_token", {
      p_token: token,
    });

    if (error || !data?.found) return null;

    return data;
  },

  async accept(token: string): Promise<{ success: boolean; challengeId?: string }> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return { success: false };

    const { data, error } = await supabase.rpc("accept_challenge_invitation", {
      p_token: token,
    });

    if (error) {
      console.error("Error accepting invitation:", error);
      return { success: false };
    }

    return { success: true, challengeId: data.challenge_id };
  },

  async cancel(token: string): Promise<boolean> {
    const { error } = await supabase.rpc("cancel_challenge_invitation", {
      p_token: token,
    });

    if (error) {
      console.error("Error cancelling invitation:", error);
      return false;
    }
    return true;
  },

  async shareViaWebShare(invitation: { token: string; sport: string; message?: string }) {
    const url = `${globalThis.location.origin}/challenge/${invitation.token}`;
    const text = invitation.message
      ? `¡Te reto a un ${invitation.sport}! "${invitation.message}"`
      : `¡Te reto a un partido de ${invitation.sport}! ¿Aceptas el desafío?`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Reto SportMatch", text, url });
        return true;
      } catch {
        return false;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return true;
    } catch {
      globalThis.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank");
      return false;
    }
  },
};
