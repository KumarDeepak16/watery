// gamification view-model with auto level-up + confetti event

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

import type { Badge } from '@/storage';
import {
  useGamificationStore,
  xpToLevel,
  levelToXp,
} from '@/stores/gamificationStore';
import { playAchievementSound } from '@/services/audioService';
import { haptics } from '@/services/hapticsService';

export const GAMIFICATION_EVENTS = {
  LEVEL_UP: 'aquapulse.levelUp',
  BADGE_UNLOCKED: 'aquapulse.badgeUnlocked',
  CONFETTI: 'aquapulse.confetti',
} as const;

export interface LevelUpEvent {
  level: number;
}

export interface UseGamificationResult {
  level: number;
  xp: number;
  xpInLevel: number;
  xpForCurrent: number;
  xpForNext: number;
  xpToNext: number;
  progress: number;
  badges: Badge[];
  badgesOwned: number;
  streak: number;
  longestStreak: number;
  totalDays: number;
  awardXp: (amount: number) => void;
  unlockBadge: (id: string) => Badge | null;
  fireConfetti: (reason?: string) => void;
  // overlay state for screens
  levelUpEvent: LevelUpEvent | null;
  latestUnlock: Badge | null;
  dismissLevelUp: () => void;
  dismissUnlock: () => void;
}

export const useGamification = (): UseGamificationResult => {
  const xp = useGamificationStore((s) => s.xp);
  const level = useGamificationStore((s) => s.level);
  const badges = useGamificationStore((s) => s.badges);
  const streak = useGamificationStore((s) => s.streak);
  const longestStreak = useGamificationStore((s) => s.longestStreak);
  const totalDays = useGamificationStore((s) => s.totalDays);
  const addXp = useGamificationStore((s) => s.addXp);
  const unlock = useGamificationStore((s) => s.unlockBadge);

  const prevLevel = useRef(level);
  const prevBadgeIds = useRef(new Set(badges.filter((b) => b.unlockedAt).map((b) => b.id)));

  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [latestUnlock, setLatestUnlock] = useState<Badge | null>(null);

  // subscribe to emitted events
  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener(
      GAMIFICATION_EVENTS.LEVEL_UP,
      (payload: LevelUpEvent) => setLevelUpEvent(payload),
    );
    const sub2 = DeviceEventEmitter.addListener(
      GAMIFICATION_EVENTS.BADGE_UNLOCKED,
      (payload: { badge: Badge }) => setLatestUnlock(payload.badge),
    );
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  const dismissLevelUp = useCallback(() => setLevelUpEvent(null), []);
  const dismissUnlock = useCallback(() => setLatestUnlock(null), []);

  // detect level-up
  useEffect(() => {
    if (level > prevLevel.current) {
      DeviceEventEmitter.emit(GAMIFICATION_EVENTS.LEVEL_UP, { level });
      DeviceEventEmitter.emit(GAMIFICATION_EVENTS.CONFETTI, { reason: 'level-up' });
      void playAchievementSound();
      void haptics.success();
    }
    prevLevel.current = level;
  }, [level]);

  // detect newly unlocked badges
  useEffect(() => {
    const currentIds = badges.filter((b) => b.unlockedAt).map((b) => b.id);
    for (const id of currentIds) {
      if (!prevBadgeIds.current.has(id)) {
        const badge = badges.find((b) => b.id === id);
        if (badge) {
          DeviceEventEmitter.emit(GAMIFICATION_EVENTS.BADGE_UNLOCKED, { badge });
          DeviceEventEmitter.emit(GAMIFICATION_EVENTS.CONFETTI, { reason: 'badge', badge });
          void playAchievementSound();
          void haptics.success();
        }
      }
    }
    prevBadgeIds.current = new Set(currentIds);
  }, [badges]);

  const awardXp = useCallback(
    (amount: number) => {
      addXp(amount);
    },
    [addXp],
  );

  const unlockBadge = useCallback(
    (id: string): Badge | null => unlock(id),
    [unlock],
  );

  const fireConfetti = useCallback((reason?: string) => {
    DeviceEventEmitter.emit(GAMIFICATION_EVENTS.CONFETTI, { reason: reason ?? 'manual' });
  }, []);

  return useMemo(() => {
    const xpForCurrent = levelToXp(level);
    const xpForNext = levelToXp(level + 1);
    const span = Math.max(1, xpForNext - xpForCurrent);
    const xpInLevel = Math.max(0, xp - xpForCurrent);
    const xpToNext = Math.max(0, xpForNext - xp);
    return {
      level,
      xp,
      xpInLevel,
      xpForCurrent,
      xpForNext,
      xpToNext,
      progress: Math.min(1, xpInLevel / span),
      badges,
      badgesOwned: badges.filter((b) => b.unlockedAt != null).length,
      streak,
      longestStreak,
      totalDays,
      awardXp,
      unlockBadge,
      fireConfetti,
      levelUpEvent,
      latestUnlock,
      dismissLevelUp,
      dismissUnlock,
    };
  }, [
    awardXp,
    badges,
    fireConfetti,
    level,
    longestStreak,
    streak,
    totalDays,
    unlockBadge,
    xp,
    levelUpEvent,
    latestUnlock,
    dismissLevelUp,
    dismissUnlock,
  ]);
};

export { xpToLevel };
