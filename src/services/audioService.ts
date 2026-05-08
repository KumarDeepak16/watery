// Audio stub — expo-av deprecated in SDK 54. No real assets bundled.
// Swap for expo-audio when available.

import { useSettingsStore } from '@/stores/settingsStore';

const enabled = (): boolean => useSettingsStore.getState().soundsEnabled !== false;

// No-op implementations until expo-audio replaces expo-av.
export const preloadSounds = async (): Promise<void> => undefined;
export const playDrinkSound = async (): Promise<void> => undefined;
export const playAchievementSound = async (): Promise<void> => undefined;
export const unloadAll = async (): Promise<void> => undefined;
export const playDrink = playDrinkSound;
export const playAchievement = playAchievementSound;

export const audioService = {
  playDrink,
  playDrinkSound,
  playAchievement,
  playAchievementSound,
  preloadSounds,
  unloadAll,
  enabled,
};
