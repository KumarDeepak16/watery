// theme accessor: resolves stored scheme + system

import { useMemo } from 'react';

import { darkTheme, lightTheme, type Theme } from '@/theme';
import {
  resolveScheme,
  useThemeStore,
  type ResolvedScheme,
  type ThemeScheme,
} from '@/stores/themeStore';
import { useColorScheme } from './useColorScheme';

export interface UseThemeResult {
  theme: Theme;
  scheme: ResolvedScheme;
  mode: ResolvedScheme;
  isDark: boolean;
  storedScheme: ThemeScheme;
  setScheme: (scheme: ThemeScheme) => void;
  toggle: () => void;
  // exposed sub-tokens (screens destructure these directly)
  colors: Theme['colors'];
  spacing: Theme['spacing'];
  radius: Theme['radius'];
  typography: Theme['typography'];
  shadows: Theme['shadows'];
  gradients: Theme['gradients'];
}

export const useTheme = (): UseThemeResult => {
  // subscribe to system so 'system' mode stays reactive
  const sys = useColorScheme();
  const stored = useThemeStore((s) => s.scheme);
  const setScheme = useThemeStore((s) => s.setScheme);
  const toggle = useThemeStore((s) => s.toggle);

  const resolved: ResolvedScheme = useMemo(() => {
    if (stored === 'system') return sys;
    return resolveScheme(stored);
  }, [stored, sys]);

  // cast to Theme so TS doesn't narrow to the light-only literal type
  const theme: Theme = (resolved === 'dark' ? darkTheme : lightTheme) as Theme;

  return {
    theme,
    scheme: resolved,
    mode: resolved,
    isDark: resolved === 'dark',
    storedScheme: stored,
    setScheme,
    toggle,
    colors: theme.colors,
    spacing: theme.spacing,
    radius: theme.radius,
    typography: theme.typography,
    shadows: theme.shadows,
    gradients: theme.gradients,
  };
};
