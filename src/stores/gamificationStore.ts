import { create } from 'zustand';

import {
  DEFAULT_GAMIFICATION,
  gamificationRepository,
  zustandMMKVStorage,
  type Badge,
  type Gamification,
} from '@/storage';
import { BADGES, type BadgeContext, type BadgeDefinition } from '@/constants';

export const xpToLevel = (xp: number): number => {
  if (xp <= 0) return 0;
  return Math.floor(Math.sqrt(xp / 100));
};
export const levelToXp = (level: number): number => level * level * 100;

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  targetMl: number;
  progressMl: number;
  startIso: string;
  endIso: string;
  completed: boolean;
  rewardXp: number;
}

export interface GamificationState extends Gamification {
  weeklyChallenge: WeeklyChallenge | null;
  goalsHit: number;
  totalEntries: number;
  totalMl: number;
  earlyDrinks: number;
  lateDrinks: number;
  _hydrated: boolean;

  addXp: (amount: number) => { newLevel: number; leveledUp: boolean };
  unlockBadge: (id: string) => Badge | null;
  checkLevelUp: () => { leveledUp: boolean; newLevel: number };
  incrementStreak: () => void;
  resetStreak: () => void;
  completeChallenge: () => void;
  setWeeklyChallenge: (challenge: WeeklyChallenge | null) => void;
  evaluateBadges: (ctx: Omit<BadgeContext, 'level'>) => Badge[];
  unlockTheme: (themeId: string) => void;
  unlockCup: (cupId: string) => void;
  bumpTotalDays: () => void;
  recordEntryStats: (patch: { addedMl?: number; earlyDrink?: boolean; lateDrink?: boolean }) => void;
  reset: () => void;
  resetAll: () => void;
  hydrateFromStorage: () => void;
  rehydrate: () => Promise<void>;
}

const STORE_KEY = 'aquapulse:gamification';

const initialExtra = {
  weeklyChallenge: null as WeeklyChallenge | null,
  goalsHit: 0,
  totalEntries: 0,
  totalMl: 0,
  earlyDrinks: 0,
  lateDrinks: 0,
  _hydrated: false,
};

const toBadge = (def: BadgeDefinition): Badge => ({
  id: def.id,
  name: def.name,
  description: def.description,
  icon: def.icon,
  tier: def.tier,
  unlockedAt: Date.now(),
});

export const useGamificationStore = create<GamificationState>((set, get) => ({
  ...DEFAULT_GAMIFICATION,
  ...initialExtra,

  addXp: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { newLevel: get().level, leveledUp: false };
    }
    const prevLevel = get().level;
    const result = gamificationRepository.addXp(amount);
    set({ xp: result.state.xp, level: result.state.level });
    return { newLevel: result.state.level, leveledUp: result.state.level > prevLevel };
  },

  unlockBadge: (id) => {
    const owned = get().badges.find((b) => b.id === id && b.unlockedAt);
    if (owned) return null;
    const def = BADGES.find((b) => b.id === id);
    if (!def) return null;
    const badge = toBadge(def);
    const r = gamificationRepository.unlockBadge({ id: badge.id, name: badge.name, description: badge.description, icon: badge.icon, tier: badge.tier });
    if (r.alreadyHad) return null;
    const xpResult = gamificationRepository.addXp(def.xpReward);
    set({ badges: r.state.badges, xp: xpResult.state.xp, level: xpResult.state.level });
    return badge;
  },

  checkLevelUp: () => {
    const xp = get().xp;
    const newLevel = xpToLevel(xp);
    const leveledUp = newLevel > get().level;
    if (leveledUp) set({ level: newLevel });
    return { leveledUp, newLevel };
  },

  incrementStreak: () => {
    const next = gamificationRepository.incrementStreak();
    set({ streak: next.streak, longestStreak: next.longestStreak, totalDays: next.totalDays, lastStreakDate: next.lastStreakDate });
  },

  resetStreak: () => {
    const next = gamificationRepository.resetStreak();
    set({ streak: next.streak, lastStreakDate: next.lastStreakDate });
  },

  completeChallenge: () => {
    const c = get().weeklyChallenge;
    if (!c || c.completed) return;
    const updated: WeeklyChallenge = { ...c, completed: true, progressMl: c.targetMl };
    const xpResult = gamificationRepository.addXp(c.rewardXp);
    set({ weeklyChallenge: updated, xp: xpResult.state.xp, level: xpResult.state.level });
  },

  setWeeklyChallenge: (challenge) => set({ weeklyChallenge: challenge }),

  evaluateBadges: (ctx) => {
    const fullCtx: BadgeContext = { ...ctx, level: get().level };
    const owned = new Set(get().badges.filter((b) => b.unlockedAt).map((b) => b.id));
    const newly: Badge[] = [];
    let totalReward = 0;
    for (const def of BADGES) {
      if (owned.has(def.id)) continue;
      if (def.condition(fullCtx)) {
        const badge = toBadge(def);
        const r = gamificationRepository.unlockBadge({ id: badge.id, name: badge.name, description: badge.description, icon: badge.icon, tier: badge.tier });
        if (!r.alreadyHad) {
          newly.push(badge);
          totalReward += def.xpReward;
          set({ badges: r.state.badges });
        }
      }
    }
    if (totalReward > 0) {
      const xpResult = gamificationRepository.addXp(totalReward);
      set({ xp: xpResult.state.xp, level: xpResult.state.level });
    }
    return newly;
  },

  unlockTheme: (themeId) => {
    const next = gamificationRepository.unlockTheme(themeId);
    set({ unlockedThemes: next.unlockedThemes });
  },

  unlockCup: (cupId) => {
    const next = gamificationRepository.unlockCup(cupId);
    set({ unlockedCups: next.unlockedCups });
  },

  bumpTotalDays: () => set((s) => ({ totalDays: s.totalDays + 1 })),

  recordEntryStats: ({ addedMl = 0, earlyDrink = false, lateDrink = false }) =>
    set((s) => ({
      totalEntries: s.totalEntries + 1,
      totalMl: s.totalMl + Math.max(0, Math.round(addedMl)),
      earlyDrinks: earlyDrink ? s.earlyDrinks + 1 : s.earlyDrinks,
      lateDrinks: lateDrink ? s.lateDrinks + 1 : s.lateDrinks,
    })),

  reset: () => set({ ...DEFAULT_GAMIFICATION, ...initialExtra, _hydrated: false }),
  resetAll: () => set({ ...DEFAULT_GAMIFICATION, ...initialExtra, _hydrated: false }),

  hydrateFromStorage: () => {
    const stored = gamificationRepository.getGamification();
    set((s) => ({ ...s, ...stored }));
  },

  rehydrate: async () => {
    if (get()._hydrated) return;
    try {
      const raw = await zustandMMKVStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Gamification>;
        set((s) => ({ ...s, ...parsed, _hydrated: true }));
      } else {
        const stored = gamificationRepository.getGamification();
        set((s) => ({ ...s, ...stored, _hydrated: true }));
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
