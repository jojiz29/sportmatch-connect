import { create } from "zustand";
import { useAuthStore } from "@/entities/user/useAuth";

interface LevelUpState {
  showModal: boolean;
  previousLevel: number;
  newLevel: number;
  xpGained: number;

  triggerLevelUp: (prev: number, curr: number, xp?: number) => void;
  dismissModal: () => void;
}

export const useLevelUpStore = create<LevelUpState>((set) => ({
  showModal: false,
  previousLevel: 0,
  newLevel: 0,
  xpGained: 0,

  triggerLevelUp: (prev, curr, xp = 0) => {
    set({
      showModal: true,
      previousLevel: prev,
      newLevel: curr,
      xpGained: xp,
    });
  },

  dismissModal: () => {
    set({ showModal: false });
  },
}));

let _prevLevel: number | null = null;

export function initLevelUpDetection() {
  const user = useAuthStore.getState().user;
  const currentLevel = user?.xp_level || 1;

  if (_prevLevel === null) {
    _prevLevel = currentLevel;
    return;
  }

  if (currentLevel > _prevLevel) {
    useLevelUpStore.getState().triggerLevelUp(_prevLevel, currentLevel);
  }

  _prevLevel = currentLevel;
}

useAuthStore.subscribe(() => {
  initLevelUpDetection();
});
