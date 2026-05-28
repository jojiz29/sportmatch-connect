import React, { useState, useEffect } from "react";
import { followUser, unfollowUser, isFollowing } from "@/shared/api/socialService";
import { useAuthStore } from "@/entities/user/useAuth";
import { useProfileStore } from "@/features/profile/useProfileStore";
import { toast } from "sonner";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowingNow: boolean) => void;
}

/**
 * FollowButton component with Optimistic UI updates.
 * Renders a "Seguir" (Follow) or "Siguiendo" (Following) button.
 * Uses useProfileStore to update the logged-in user's following count in real-time.
 * Automatically performs rollbacks if the network/database request fails.
 * Self-follow check prevents rendering if targetUserId is the current user.
 */
export function FollowButton({ targetUserId, onFollowChange }: FollowButtonProps) {
  const currentUser = useAuthStore((state) => state.user);
  const { profile, updateProfile } = useProfileStore();
  const [following, setFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    let active = true;
    async function checkStatus() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const status = await isFollowing(currentUser.id, targetUserId);
        if (active) {
          setFollowing(status);
        }
      } catch (err) {
        console.error("Error checking follow status:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    checkStatus();
    return () => {
      active = false;
    };
  }, [currentUser, targetUserId]);

  // Self-follow check at render boundary
  if (!currentUser || currentUser.id === targetUserId) {
    return null;
  }

  const handleToggleFollow = async () => {
    if (!currentUser) return;
    
    const previousState = following;
    
    // 1. Optimistic Updates
    // Update local button state
    setFollowing(!previousState);
    
    // Update parent stats optimistically
    if (onFollowChange) {
      onFollowChange(!previousState);
    }
    
    // Update current user's profile following count optimistically
    if (profile) {
      const currentFollowingCount = profile.following_count ?? 0;
      updateProfile({
        following_count: previousState 
          ? Math.max(0, currentFollowingCount - 1) 
          : currentFollowingCount + 1
      });
    }

    // 2. Perform background request
    try {
      if (previousState) {
        await unfollowUser(currentUser.id, targetUserId);
        toast.success("Has dejado de seguir a este usuario");
      } else {
        await followUser(currentUser.id, targetUserId);
        toast.success("Ahora sigues a este usuario");
      }
    } catch (error) {
      // 3. Rollback on failure
      setFollowing(previousState);
      if (onFollowChange) {
        onFollowChange(previousState);
      }
      if (profile) {
        const currentFollowingCount = profile.following_count ?? 0;
        updateProfile({
          following_count: previousState 
            ? currentFollowingCount + 1 
            : Math.max(0, currentFollowingCount - 1)
        });
      }
      console.error("Follow operation failed:", error);
      toast.error("Error al procesar la solicitud", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo más tarde.",
      });
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="w-full py-3 rounded-xl border border-border bg-card text-muted-foreground flex items-center justify-center gap-2 text-sm font-semibold transition-all"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando...
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
        following
          ? "bg-accent text-accent-foreground border border-border shadow-sm hover:bg-accent/80"
          : "bg-foreground text-background shadow-md hover:bg-foreground/90"
      }`}
    >
      {following ? (
        <>
          <UserMinus className="h-4 w-4" /> Siguiendo
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> Seguir
        </>
      )}
    </button>
  );
}
export default FollowButton;
