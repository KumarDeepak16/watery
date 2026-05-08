import { useCallback, useEffect, useMemo } from 'react';

import { hydrationRepository, type HydrationEntry } from '@/storage';
import { useHydrationStore, type DrinkSource } from '@/stores/hydrationStore';
import { useUserStore, computeDailyGoal } from '@/stores/userStore';
import { clamp, percent } from '@/utils/math';

export interface UseHydrationResult {
  today: HydrationEntry[];
  total: number;
  goal: number;
  percent: number;
  progress: number;
  remaining: number;
  lastDrink: number | null;
  streak: number;
  weeklyAverage: number;
  isRefreshing: boolean;
  goalHit: boolean;
  addWater: (amountMl: number, source?: DrinkSource) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  // alias names used by screens
  todayTotalMl: number;
  todayEntries: HydrationEntry[];
  totalMl: number;
  allEntries: HydrationEntry[];
  lastEntry: HydrationEntry | null;
  lifetimeMl: number;
  addEntry: (amountMl: number, source?: DrinkSource) => Promise<void>;
}

export const useHydration = (): UseHydrationResult => {
  const today = useHydrationStore((s) => s.todayEntries);
  const total = useHydrationStore((s) => s.todayTotalMl);
  const streak = useHydrationStore((s) => s.currentStreak);
  const lastDrink = useHydrationStore((s) => s.lastDrinkTime);
  const weeklyAverage = useHydrationStore((s) => s.weeklyAverage);
  const isRefreshing = useHydrationStore((s) => s.isRefreshing);
  const refreshAll = useHydrationStore((s) => s.refreshAll);
  const addWaterAction = useHydrationStore((s) => s.addWater);
  const removeEntryAction = useHydrationStore((s) => s.removeEntry);

  const profile = useUserStore((s) => s.profile);
  const goal = useMemo(() => computeDailyGoal(profile), [profile]);

  // refresh on mount
  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const addWater = useCallback(
    async (amountMl: number, source?: DrinkSource): Promise<void> => {
      await addWaterAction(amountMl, source);
    },
    [addWaterAction],
  );

  const removeEntry = useCallback(
    async (id: string): Promise<void> => {
      await removeEntryAction(id);
    },
    [removeEntryAction],
  );

  const refresh = useCallback(async (): Promise<void> => {
    await refreshAll();
  }, [refreshAll]);

  const pct = percent(total, goal);
  const progress = clamp(goal > 0 ? total / goal : 0, 0, 1);
  const remaining = Math.max(0, goal - total);

  const allEntries = useMemo<HydrationEntry[]>(() => {
    const logs = hydrationRepository.getAllLogs();
    return logs.flatMap((log) => log.entries);
  }, [total]); // re-derive when total changes

  const lifetimeMl = useMemo(
    () => allEntries.reduce((s, e) => s + e.amountMl, 0),
    [allEntries],
  );

  return {
    today,
    total,
    goal,
    percent: pct,
    progress,
    remaining,
    lastDrink,
    streak,
    weeklyAverage,
    isRefreshing,
    goalHit: total >= goal && goal > 0,
    addWater,
    removeEntry,
    refresh,
    // aliases
    todayTotalMl: total,
    todayEntries: today,
    totalMl: total,
    allEntries,
    lastEntry: today.length > 0 ? (today[today.length - 1] ?? null) : null,
    lifetimeMl,
    addEntry: addWater,
  };
};
