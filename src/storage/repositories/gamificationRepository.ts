import { format } from 'date-fns';

import { getJSON, setJSON } from '../mmkv';
import { StorageKey } from '../keys';
import { DEFAULT_GAMIFICATION, type Badge, type Gamification } from '../types';

const DATE_FMT = 'yyyy-MM-dd';

// xp curve: level n requires n*100 + (n-1)*50 cumulative
const xpForLevel = (level: number): number =>
  level <= 1 ? 0 : (level - 1) * 100 + (level - 2) * 50;

const computeLevel = (xp: number): number => {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  return level;
};

export const getGamification = (): Gamification => {
  const stored = getJSON<Partial<Gamification>>(StorageKey.GAMIFICATION);
  return { ...DEFAULT_GAMIFICATION, ...(stored ?? {}) };
};

const writeState = (state: Gamification): Gamification => {
  setJSON(StorageKey.GAMIFICATION, state);
  return state;
};

export const addXp = (
  amount: number,
): { state: Gamification; leveledUp: boolean; previousLevel: number } => {
  const current = getGamification();
  const xp = current.xp + Math.max(0, Math.round(amount));
  const previousLevel = current.level;
  const level = computeLevel(xp);
  const next: Gamification = { ...current, xp, level };
  return {
    state: writeState(next),
    leveledUp: level > previousLevel,
    previousLevel,
  };
};

export const addLevel = (delta: number = 1): Gamification => {
  const current = getGamification();
  const level = Math.max(1, current.level + delta);
  const xp = Math.max(current.xp, xpForLevel(level));
  return writeState({ ...current, level, xp });
};

export const unlockBadge = (
  badge: Omit<Badge, 'unlockedAt'> & { unlockedAt?: number | null },
): { state: Gamification; alreadyHad: boolean } => {
  const current = getGamification();
  const exists = current.badges.find((b) => b.id === badge.id);
  if (exists?.unlockedAt) {
    return { state: current, alreadyHad: true };
  }
  const unlocked: Badge = {
    ...badge,
    unlockedAt: badge.unlockedAt ?? Date.now(),
  };
  const badges = exists
    ? current.badges.map((b) => (b.id === badge.id ? unlocked : b))
    : [...current.badges, unlocked];
  return {
    state: writeState({ ...current, badges }),
    alreadyHad: false,
  };
};

export const incrementStreak = (
  today: Date = new Date(),
): Gamification => {
  const current = getGamification();
  const todayKey = format(today, DATE_FMT);
  // already counted today -> no-op
  if (current.lastStreakDate === todayKey) return current;
  const streak = current.streak + 1;
  const longestStreak = Math.max(current.longestStreak, streak);
  return writeState({
    ...current,
    streak,
    longestStreak,
    lastStreakDate: todayKey,
    totalDays: current.totalDays + 1,
  });
};

export const resetStreak = (): Gamification => {
  const current = getGamification();
  return writeState({ ...current, streak: 0, lastStreakDate: null });
};

export const unlockTheme = (themeId: string): Gamification => {
  const current = getGamification();
  if (current.unlockedThemes.includes(themeId)) return current;
  return writeState({
    ...current,
    unlockedThemes: [...current.unlockedThemes, themeId],
  });
};

export const unlockCup = (cupId: string): Gamification => {
  const current = getGamification();
  if (current.unlockedCups.includes(cupId)) return current;
  return writeState({
    ...current,
    unlockedCups: [...current.unlockedCups, cupId],
  });
};

export const gamificationRepository = {
  getGamification,
  addXp,
  addLevel,
  unlockBadge,
  incrementStreak,
  resetStreak,
  unlockTheme,
  unlockCup,
  xpForLevel,
};
