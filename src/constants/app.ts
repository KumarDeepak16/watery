// app-wide constants

export const APP_NAME = 'Watery';
export const VERSION = '1.0.0';

export const DEFAULT_AMOUNTS_ML: readonly number[] = [100, 250, 500] as const;

export const REMINDER_INTERVALS_MIN: readonly number[] = [15, 30, 60, 90, 120] as const;

// activity / climate / gender option labels (types live in @/storage)
import type { ActivityLevel, Climate, Gender } from '@/storage/types';

// re-export types so screens can import them from `@/constants/app`
export type { ActivityLevel, Climate, Gender } from '@/storage/types';

export const ACTIVITY_LEVELS: readonly { id: ActivityLevel; label: string; factor: number }[] = [
  { id: 'sedentary', label: 'Sedentary', factor: 0 },
  { id: 'light', label: 'Light', factor: 250 },
  { id: 'moderate', label: 'Moderate', factor: 500 },
  { id: 'active', label: 'Active', factor: 750 },
  { id: 'athlete', label: 'Athlete', factor: 1100 },
] as const;

export const CLIMATE_OPTIONS: readonly { id: Climate; label: string; factor: number }[] = [
  { id: 'cold', label: 'Cold', factor: -150 },
  { id: 'temperate', label: 'Temperate', factor: 0 },
  { id: 'warm', label: 'Warm', factor: 250 },
  { id: 'hot', label: 'Hot', factor: 500 },
  { id: 'humid', label: 'Humid', factor: 600 },
] as const;

export const GENDER_OPTIONS: readonly { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' },
] as const;

export const DEFAULT_DAILY_GOAL_ML = 2500;
export const DEFAULT_WAKE_HOUR = 7;
export const DEFAULT_SLEEP_HOUR = 22;
export const DEFAULT_REMINDER_INTERVAL = 60;
export const DEFAULT_SNOOZE_MIN = 10;

// xp economy
export const XP_PER_DRINK = 10;
export const XP_PER_GOAL_HIT = 100;
export const XP_PER_STREAK_DAY = 25;

export const NOTIFICATION_CHANNEL_ID = 'aquapulse-hydration';
export const BACKGROUND_TASK_NAME = 'AQUAPULSE_HYDRATION_CHECK';
