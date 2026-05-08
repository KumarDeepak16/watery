import { darkColors, lightColors, type ColorPalette } from './colors';
import { gradientPresets, type GradientName } from './gradients';
import { durations, easings, springs } from './motion';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontFamilies, typography } from './typography';

export const lightTheme = {
  mode: 'light' as const,
  colors: lightColors,
  spacing,
  radius,
  shadows,
  typography,
  fontFamilies,
  easings,
  durations,
  springs,
  gradients: gradientPresets,
};

export const darkTheme = {
  mode: 'dark' as const,
  colors: darkColors,
  spacing,
  radius,
  shadows,
  typography,
  fontFamilies,
  easings,
  durations,
  springs,
  gradients: gradientPresets,
};

export type Theme = typeof lightTheme;
export type ThemeMode = Theme['mode'];

export type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode | 'system') => void;
  toggle: () => void;
};

export {
  darkColors,
  durations,
  easings,
  fontFamilies,
  gradientPresets,
  lightColors,
  radius,
  shadows,
  spacing,
  springs,
  typography,
};
export type { ColorPalette, GradientName };
