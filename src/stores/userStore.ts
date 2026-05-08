import { create } from 'zustand';

import {
  userRepository,
  zustandMMKVStorage,
  type ActivityLevel,
  type Climate,
  type UserProfile,
} from '@/storage';
import { DEFAULT_DAILY_GOAL_ML } from '@/constants';
import { clamp } from '@/utils/math';

export interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  _hydrated: boolean;
  setProfile: (profile: Partial<UserProfile> & { name: string }) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setDailyGoal: (goalMl: number) => void;
  completeOnboarding: () => void;
  resetUser: () => void;
  resetAll: () => void;
  rehydrate: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

const STORE_KEY = 'aquapulse:user';

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isOnboarded: false,
  _hydrated: false,

  setProfile: (profile) => {
    const now = Date.now();
    const full: UserProfile = {
      id: get().profile?.id ?? `u_${now}`,
      createdAt: get().profile?.createdAt ?? now,
      dailyGoalMl: DEFAULT_DAILY_GOAL_ML,
      gender: 'prefer-not-to-say',
      age: 24,
      weightKg: 69,
      heightCm: 182,
      activityLevel: 'moderate',
      climate: 'temperate',
      wakeTime: '08:00',
      sleepTime: '23:00',
      ...profile,
    };
    userRepository.saveUser(full);
    const serialized = JSON.stringify({ profile: full, isOnboarded: get().isOnboarded });
    void zustandMMKVStorage.setItem(STORE_KEY, serialized);
    set({ profile: full });
  },

  updateProfile: (patch) => {
    const current = get().profile;
    if (!current) return;
    const next = { ...current, ...patch };
    userRepository.saveUser(next);
    const serialized = JSON.stringify({ profile: next, isOnboarded: get().isOnboarded });
    void zustandMMKVStorage.setItem(STORE_KEY, serialized);
    set({ profile: next });
  },

  setDailyGoal: (goalMl) => {
    const current = get().profile;
    if (!current) return;
    const clamped = clamp(Math.round(goalMl), 500, 8000);
    const next = { ...current, dailyGoalMl: clamped };
    userRepository.saveUser(next);
    const serialized = JSON.stringify({ profile: next, isOnboarded: get().isOnboarded });
    void zustandMMKVStorage.setItem(STORE_KEY, serialized);
    set({ profile: next });
  },

  completeOnboarding: () => {
    const profile = get().profile;
    const serialized = JSON.stringify({ profile, isOnboarded: true });
    void zustandMMKVStorage.setItem(STORE_KEY, serialized);
    set({ isOnboarded: true });
  },

  resetUser: () => {
    userRepository.deleteUser();
    void zustandMMKVStorage.removeItem(STORE_KEY);
    // Reset _hydrated so rehydrate() runs fresh on next mount
    set({ profile: null, isOnboarded: false, _hydrated: false });
  },

  resetAll: () => {
    userRepository.deleteUser();
    void zustandMMKVStorage.removeItem(STORE_KEY);
    set({ profile: null, isOnboarded: false, _hydrated: false });
  },

  rehydrate: async () => {
    if (get()._hydrated) return;
    try {
      const raw = await zustandMMKVStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { profile: UserProfile | null; isOnboarded: boolean };
        set({ profile: parsed.profile, isOnboarded: parsed.isOnboarded ?? false, _hydrated: true });
      } else {
        const stored = userRepository.getUser();
        if (stored) set({ profile: stored, isOnboarded: true });
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },

  // alias — calls rehydrate via get() to avoid circular ref in initializer
  hydrateFromStorage: async (): Promise<void> => get().rehydrate(),
}));

export const computeDailyGoal = (profile: UserProfile | null): number => {
  if (!profile) return DEFAULT_DAILY_GOAL_ML;
  if (profile.dailyGoalMl && profile.dailyGoalMl > 0) {
    return clamp(profile.dailyGoalMl, 500, 8000);
  }
  return userRepository.calculateDailyGoalMl(
    profile.weightKg ?? 70,
    (profile.activityLevel ?? 'moderate') as ActivityLevel,
    (profile.climate ?? 'temperate') as Climate,
  );
};

export const selectDailyGoal = (s: UserState): number => computeDailyGoal(s.profile);
