// badge definitions, unlock predicates evaluated by gamification store

import type { Gamification } from '@/storage/types';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeContext {
  totalEntries: number;
  totalMl: number;
  streak: number;
  longestStreak: number;
  totalDays: number;
  goalsHit: number;
  level: number;
  earlyDrinks: number; // drinks logged before 9am
  lateDrinks: number; // drinks after 9pm
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // ionicon-like name
  tier: BadgeTier;
  xpReward: number;
  condition: (ctx: BadgeContext) => boolean;
}

export const BADGES: readonly BadgeDefinition[] = [
  {
    id: 'first-sip',
    name: 'First Sip',
    description: 'Logged your first drink',
    icon: 'water-outline',
    tier: 'bronze',
    xpReward: 50,
    condition: (c) => c.totalEntries >= 1,
  },
  {
    id: 'hydrated-rookie',
    name: 'Hydrated Rookie',
    description: 'Hit your daily goal once',
    icon: 'trophy-outline',
    tier: 'bronze',
    xpReward: 75,
    condition: (c) => c.goalsHit >= 1,
  },
  {
    id: 'streak-3',
    name: 'On a Roll',
    description: '3-day streak',
    icon: 'flame-outline',
    tier: 'bronze',
    xpReward: 100,
    condition: (c) => c.streak >= 3 || c.longestStreak >= 3,
  },
  {
    id: 'streak-7',
    name: 'Weekly Warrior',
    description: '7-day streak',
    icon: 'flame',
    tier: 'silver',
    xpReward: 200,
    condition: (c) => c.streak >= 7 || c.longestStreak >= 7,
  },
  {
    id: 'streak-14',
    name: 'Fortnight Flow',
    description: '14-day streak',
    icon: 'flame',
    tier: 'silver',
    xpReward: 300,
    condition: (c) => c.longestStreak >= 14,
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: '30-day streak',
    icon: 'flame',
    tier: 'gold',
    xpReward: 500,
    condition: (c) => c.longestStreak >= 30,
  },
  {
    id: 'streak-100',
    name: 'Centurion',
    description: '100-day streak',
    icon: 'flame',
    tier: 'platinum',
    xpReward: 1500,
    condition: (c) => c.longestStreak >= 100,
  },
  {
    id: 'volume-10l',
    name: 'Ten Liter Club',
    description: 'Drank 10L total',
    icon: 'water',
    tier: 'bronze',
    xpReward: 75,
    condition: (c) => c.totalMl >= 10_000,
  },
  {
    id: 'volume-100l',
    name: 'Hectoliter Hero',
    description: 'Drank 100L total',
    icon: 'water',
    tier: 'silver',
    xpReward: 250,
    condition: (c) => c.totalMl >= 100_000,
  },
  {
    id: 'volume-500l',
    name: 'Ocean Walker',
    description: 'Drank 500L total',
    icon: 'water',
    tier: 'gold',
    xpReward: 750,
    condition: (c) => c.totalMl >= 500_000,
  },
  {
    id: 'volume-1000l',
    name: 'Tidal Force',
    description: 'Drank 1000L total',
    icon: 'water',
    tier: 'platinum',
    xpReward: 2000,
    condition: (c) => c.totalMl >= 1_000_000,
  },
  {
    id: 'goals-10',
    name: 'Consistent',
    description: 'Hit goal 10 times',
    icon: 'checkmark-circle-outline',
    tier: 'bronze',
    xpReward: 150,
    condition: (c) => c.goalsHit >= 10,
  },
  {
    id: 'goals-50',
    name: 'Disciplined',
    description: 'Hit goal 50 times',
    icon: 'checkmark-circle',
    tier: 'silver',
    xpReward: 400,
    condition: (c) => c.goalsHit >= 50,
  },
  {
    id: 'goals-200',
    name: 'Unstoppable',
    description: 'Hit goal 200 times',
    icon: 'medal',
    tier: 'gold',
    xpReward: 1000,
    condition: (c) => c.goalsHit >= 200,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Logged 30 drinks before 9am',
    icon: 'sunny-outline',
    tier: 'silver',
    xpReward: 200,
    condition: (c) => c.earlyDrinks >= 30,
  },
  {
    id: 'night-owl',
    name: 'Night Sipper',
    description: 'Logged 30 drinks after 9pm',
    icon: 'moon-outline',
    tier: 'silver',
    xpReward: 200,
    condition: (c) => c.lateDrinks >= 30,
  },
  {
    id: 'level-10',
    name: 'Aqua Adept',
    description: 'Reached level 10',
    icon: 'star-outline',
    tier: 'silver',
    xpReward: 300,
    condition: (c) => c.level >= 10,
  },
  {
    id: 'level-25',
    name: 'Aqua Expert',
    description: 'Reached level 25',
    icon: 'star',
    tier: 'gold',
    xpReward: 750,
    condition: (c) => c.level >= 25,
  },
  {
    id: 'level-50',
    name: 'Aqua Master',
    description: 'Reached level 50',
    icon: 'star',
    tier: 'platinum',
    xpReward: 2000,
    condition: (c) => c.level >= 50,
  },
  {
    id: 'days-30',
    name: 'Month In',
    description: 'Used app for 30 days',
    icon: 'calendar-outline',
    tier: 'silver',
    xpReward: 250,
    condition: (c) => c.totalDays >= 30,
  },
  {
    id: 'days-365',
    name: 'Year of Water',
    description: '365 active days',
    icon: 'calendar',
    tier: 'platinum',
    xpReward: 3000,
    condition: (c) => c.totalDays >= 365,
  },
];

export const findUnlockableBadges = (
  ctx: BadgeContext,
  current: Gamification,
): BadgeDefinition[] => {
  const owned = new Set(current.badges.map((b: { id: string }) => b.id));
  return BADGES.filter((b) => !owned.has(b.id) && b.condition(ctx));
};
