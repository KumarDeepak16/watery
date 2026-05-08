import { create } from 'zustand';

import {
  DEFAULT_SETTINGS,
  settingsRepository,
  zustandMMKVStorage,
  type Settings,
  type ThemePref,
} from '@/storage';
import { clamp } from '@/utils/math';

export interface SettingsState extends Settings {
  _hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  update: (patch: Partial<Settings>) => void;
  toggleTheme: () => void;
  setReminderInterval: (minutes: number) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleSilentMode: () => void;
  setSnoozeMinutes: (minutes: number) => void;
  setTheme: (theme: ThemePref) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
  hydrateFromStorage: () => void;
  rehydrate: () => Promise<void>;
}

const STORE_KEY = 'aquapulse:settings';

const save = (state: Partial<Settings>): void => {
  settingsRepository.saveSettings(state);
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  _hydrated: false,

  updateSettings: (patch) => {
    save(patch);
    set(patch);
  },

  update: (patch) => {
    save(patch);
    set(patch);
  },

  toggleTheme: () => {
    const order: ThemePref[] = ['light', 'dark', 'system'];
    const current = get().theme;
    const next = order[(order.indexOf(current) + 1) % order.length] ?? 'system';
    save({ theme: next });
    set({ theme: next });
    void zustandMMKVStorage.setItem(STORE_KEY, JSON.stringify({ ...get(), theme: next }));
  },

  setTheme: (theme) => {
    save({ theme });
    set({ theme });
    void zustandMMKVStorage.setItem(STORE_KEY, JSON.stringify({ ...get(), theme }));
  },

  setReminderInterval: (minutes) => {
    const v = clamp(Math.round(minutes), 5, 240);
    save({ reminderInterval: v });
    set({ reminderInterval: v });
  },

  toggleSound: () => {
    const next = !get().soundsEnabled;
    save({ soundsEnabled: next });
    set({ soundsEnabled: next });
  },

  toggleHaptics: () => {
    const next = !get().hapticsEnabled;
    save({ hapticsEnabled: next });
    set({ hapticsEnabled: next });
  },

  toggleSilentMode: () => {
    const next = !get().silentMode;
    save({ silentMode: next });
    set({ silentMode: next });
  },

  setSnoozeMinutes: (minutes) => {
    const v = clamp(Math.round(minutes), 1, 120);
    save({ snoozeMinutes: v });
    set({ snoozeMinutes: v });
  },

  setNotificationsEnabled: (enabled) => {
    save({ notificationsEnabled: enabled });
    set({ notificationsEnabled: enabled });
  },

  resetSettings: () => {
    settingsRepository.resetSettings();
    void zustandMMKVStorage.removeItem(STORE_KEY);
    set({ ...DEFAULT_SETTINGS, _hydrated: false });
  },

  hydrateFromStorage: () => {
    const stored = settingsRepository.getSettings();
    set((s) => ({ ...s, ...stored }));
  },

  rehydrate: async () => {
    if (get()._hydrated) return;
    try {
      const raw = await zustandMMKVStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        set((s) => ({ ...s, ...parsed, _hydrated: true }));
      } else {
        const stored = settingsRepository.getSettings();
        set((s) => ({ ...s, ...stored, _hydrated: true }));
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
