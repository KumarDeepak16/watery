import { Appearance, type ColorSchemeName } from 'react-native';
import { create } from 'zustand';

import { zustandMMKVStorage } from '@/storage';

export type ThemeScheme = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

export interface ThemeState {
  scheme: ThemeScheme;
  mode: ThemeScheme;
  setScheme: (scheme: ThemeScheme) => void;
  setMode: (mode: ThemeScheme) => void;
  toggle: () => void;
  cycle: () => void;
  rehydrate: () => Promise<void>;
}

const STORE_KEY = 'aquapulse:theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  scheme: 'system',
  mode: 'system',

  setScheme: (scheme) => {
    set({ scheme, mode: scheme });
    void zustandMMKVStorage.setItem(STORE_KEY, JSON.stringify({ scheme }));
  },

  setMode: (mode) => {
    set({ scheme: mode, mode });
    void zustandMMKVStorage.setItem(STORE_KEY, JSON.stringify({ scheme: mode }));
  },

  toggle: () => {
    const current = get().scheme;
    const resolved = resolveScheme(current);
    const next: ThemeScheme = resolved === 'dark' ? 'light' : 'dark';
    set({ scheme: next, mode: next });
    void zustandMMKVStorage.setItem(STORE_KEY, JSON.stringify({ scheme: next }));
  },

  cycle: () => {
    const order: ThemeScheme[] = ['light', 'dark', 'system'];
    const current = get().scheme;
    const next = order[(order.indexOf(current) + 1) % order.length] ?? 'system';
    set({ scheme: next, mode: next });
    void zustandMMKVStorage.setItem(STORE_KEY, JSON.stringify({ scheme: next }));
  },

  rehydrate: async () => {
    try {
      const raw = await zustandMMKVStorage.getItem(STORE_KEY);
      if (raw) {
        const { scheme } = JSON.parse(raw) as { scheme: ThemeScheme };
        if (scheme) set({ scheme, mode: scheme });
      }
    } catch {
      // default system stays
    }
  },
}));

export const resolveScheme = (scheme: ThemeScheme): ResolvedScheme => {
  if (scheme === 'system') {
    const sys: ColorSchemeName = Appearance.getColorScheme();
    return sys === 'dark' ? 'dark' : 'light';
  }
  return scheme;
};

export const selectResolvedScheme = (s: ThemeState): ResolvedScheme => resolveScheme(s.scheme);
