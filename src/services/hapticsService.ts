// haptic wrappers; respect settings.hapticsEnabled

import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/stores/settingsStore';

const enabled = (): boolean => useSettingsStore.getState().hapticsEnabled !== false;

export const lightTap = async (): Promise<void> => {
  if (!enabled()) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const mediumTap = async (): Promise<void> => {
  if (!enabled()) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const heavyTap = async (): Promise<void> => {
  if (!enabled()) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

export const success = async (): Promise<void> => {
  if (!enabled()) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const warning = async (): Promise<void> => {
  if (!enabled()) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

export const error = async (): Promise<void> => {
  if (!enabled()) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

export const selection = async (): Promise<void> => {
  if (!enabled()) return;
  await Haptics.selectionAsync();
};

export const haptics = {
  light: lightTap,
  medium: mediumTap,
  heavy: heavyTap,
  success,
  warning,
  error,
  selection,
};
