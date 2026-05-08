// hydration runtime state, mirrors repo + writes through

import { create } from 'zustand';

import {
  hydrationRepository,
  type EntrySource,
  type HydrationEntry,
} from '@/storage';
import {
  XP_PER_DRINK,
  XP_PER_GOAL_HIT,
  XP_PER_STREAK_DAY,
} from '@/constants';
import { hourOfDay } from '@/utils/date';
import { useGamificationStore } from './gamificationStore';
import { computeDailyGoal, useUserStore } from './userStore';

export type DrinkSource = EntrySource;

export interface HydrationState {
  todayEntries: HydrationEntry[];
  todayTotalMl: number;
  currentStreak: number;
  lastDrinkTime: number | null;
  weeklyAverage: number;
  isRefreshing: boolean;
  addWater: (amountMl: number, source?: DrinkSource) => Promise<HydrationEntry>;
  removeEntry: (id: string) => Promise<void>;
  refreshToday: () => Promise<void>;
  refreshWeekly: () => Promise<void>;
  refreshAll: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const buildBadgeCtx = () => {
  const gam = useGamificationStore.getState();
  return {
    totalEntries: gam.totalEntries,
    totalMl: gam.totalMl,
    streak: gam.streak,
    longestStreak: gam.longestStreak,
    totalDays: gam.totalDays,
    goalsHit: gam.goalsHit,
    earlyDrinks: gam.earlyDrinks,
    lateDrinks: gam.lateDrinks,
  };
};

export const useHydrationStore = create<HydrationState>((set, get) => ({
  todayEntries: [],
  todayTotalMl: 0,
  currentStreak: 0,
  lastDrinkTime: null,
  weeklyAverage: 0,
  isRefreshing: false,

  addWater: async (amountMl, source = 'quick') => {
    const profile = useUserStore.getState().profile;
    const goal = computeDailyGoal(profile);
    const prevTotal = get().todayTotalMl;
    const ts = Date.now();

    // 1. Optimistic update — instant UI
    const optimisticEntry: HydrationEntry = {
      id: `tmp_${Date.now()}`,
      amountMl,
      timestamp: ts,
      source,
    };
    set((s) => ({
      todayEntries: [...s.todayEntries, optimisticEntry],
      todayTotalMl: s.todayTotalMl + amountMl,
      lastDrinkTime: ts,
    }));

    // 2. Persist in background (non-blocking)
    let finalEntry: HydrationEntry = optimisticEntry;
    try {
      const result = hydrationRepository.addEntry(amountMl, source, undefined, ts);
      finalEntry = result.entry;
      // Replace optimistic entry with the real persisted one
      set((s) => ({
        todayEntries: s.todayEntries.map((e) =>
          e.id === optimisticEntry.id ? result.entry : e,
        ),
      }));
    } catch {
      // Keep optimistic state on error; background refresh will reconcile
    }

    // 3. Refresh data in parallel (non-blocking)
    void Promise.all([get().refreshToday(), get().refreshWeekly()]);

    // 4. XP + gamification (non-blocking)
    const gam = useGamificationStore.getState();
    gam.addXp(XP_PER_DRINK);
    const hr = hourOfDay(ts);
    gam.recordEntryStats({
      addedMl: amountMl,
      earlyDrink: hr < 9,
      lateDrink: hr >= 21,
    });

    // Crossed goal threshold this drink → goal hit + streak bump
    const newTotal = prevTotal + amountMl;
    if (prevTotal < goal && newTotal >= goal) {
      gam.addXp(XP_PER_GOAL_HIT);
      gam.incrementStreak();
      gam.addXp(XP_PER_STREAK_DAY);
      useGamificationStore.setState((s) => ({ goalsHit: s.goalsHit + 1 }));
    }

    gam.evaluateBadges(buildBadgeCtx());

    return finalEntry;
  },

  removeEntry: async (id) => {
    hydrationRepository.deleteEntry(id);
    await Promise.all([get().refreshToday(), get().refreshWeekly()]);
  },

  refreshToday: async () => {
    set({ isRefreshing: true });
    try {
      const today = new Date();
      const entries = hydrationRepository.getEntriesForDate(today);
      const total = hydrationRepository.getTodayTotal();
      const streak = hydrationRepository.getCurrentStreak();
      const last = hydrationRepository.getLastDrinkTime();
      set({
        todayEntries: entries,
        todayTotalMl: total,
        currentStreak: streak,
        lastDrinkTime: last,
      });
    } finally {
      set({ isRefreshing: false });
    }
  },

  refreshWeekly: async () => {
    const avg = hydrationRepository.getWeeklyAverage();
    set({ weeklyAverage: avg });
  },

  refreshAll: async () => {
    await Promise.all([get().refreshToday(), get().refreshWeekly()]);
  },

  resetAll: async () => {
    set({
      todayEntries: [],
      todayTotalMl: 0,
      currentStreak: 0,
      lastDrinkTime: null,
      weeklyAverage: 0,
      isRefreshing: false,
    });
  },
}));
