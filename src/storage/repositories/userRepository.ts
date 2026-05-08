import { getJSON, remove, setJSON } from '../mmkv';
import { StorageKey } from '../keys';
import type { ActivityLevel, Climate, UserProfile } from '../types';

// activity multipliers (extra ml/kg over baseline 35)
const ACTIVITY_BONUS_ML: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 250,
  moderate: 500,
  active: 750,
  athlete: 1100,
};

// climate adjustments (flat ml)
const CLIMATE_BONUS_ML: Record<Climate, number> = {
  cold: -150,
  temperate: 0,
  warm: 250,
  hot: 500,
  humid: 600,
};

export const calculateDailyGoalMl = (
  weightKg: number,
  activity: ActivityLevel,
  climate: Climate,
): number => {
  const baseline = Math.round(weightKg * 35);
  const total = baseline + ACTIVITY_BONUS_ML[activity] + CLIMATE_BONUS_ML[climate];
  // round to nearest 50ml, clamp sensible range
  const rounded = Math.round(total / 50) * 50;
  return Math.max(1200, Math.min(rounded, 6000));
};

export const getUser = (): UserProfile | undefined =>
  getJSON<UserProfile>(StorageKey.USER_PROFILE);

export const saveUser = (profile: UserProfile): UserProfile => {
  setJSON(StorageKey.USER_PROFILE, profile);
  return profile;
};

export const updateUser = (
  patch: Partial<UserProfile>,
): UserProfile | undefined => {
  const current = getUser();
  if (!current) return undefined;
  const next: UserProfile = { ...current, ...patch };
  // recompute goal if any input changed and goal wasn't manually overridden in patch
  if (
    patch.dailyGoalMl == null &&
    (patch.weightKg != null ||
      patch.activityLevel != null ||
      patch.climate != null)
  ) {
    next.dailyGoalMl = calculateDailyGoalMl(
      next.weightKg,
      next.activityLevel ?? next.activity ?? 'moderate',
      next.climate,
    );
  }
  setJSON(StorageKey.USER_PROFILE, next);
  return next;
};

export const deleteUser = (): void => {
  remove(StorageKey.USER_PROFILE);
};

export const userRepository = {
  getUser,
  saveUser,
  updateUser,
  deleteUser,
  calculateDailyGoalMl,
};
