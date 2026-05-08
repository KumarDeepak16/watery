// daily goal computation with weather/activity overrides

import { useMemo } from 'react';

import { computeDailyGoal, useUserStore } from '@/stores/userStore';
import { useSettingsStore, type SettingsState } from '@/stores/settingsStore';
import { clamp } from '@/utils/math';
import type { Climate } from '@/storage';

export interface DailyGoalAdjustments {
  // extra ml for high-temp days
  weatherBoostMl?: number;
  // extra ml for unscheduled workouts today
  activityBoostMl?: number;
  // override climate for a single day (e.g. travel)
  climateOverride?: Climate;
}

// hook returns the adjusted goal (in ml) directly.
// Number-as-return-value matches screen usage (`goalMl - x`, `goalMl * 7`, etc.).
export type UseDailyGoalResult = number;

export const useDailyGoal = (adjustments: DailyGoalAdjustments = {}): UseDailyGoalResult => {
  const profile = useUserStore((s) => s.profile);
  // keep hook reactive to settings.units
  useSettingsStore((s: SettingsState) => s.units);

  const climateOverride = adjustments.climateOverride;
  const weatherBoostMl = adjustments.weatherBoostMl;
  const activityBoostMl = adjustments.activityBoostMl;

  return useMemo(() => {
    const effectiveProfile =
      climateOverride && profile ? { ...profile, climate: climateOverride } : profile;
    const base = computeDailyGoal(effectiveProfile);
    const weather = Math.max(0, Math.round(weatherBoostMl ?? 0));
    const activity = Math.max(0, Math.round(activityBoostMl ?? 0));
    return clamp(base + weather + activity, 500, 8000);
  }, [profile, climateOverride, weatherBoostMl, activityBoostMl]);
};
