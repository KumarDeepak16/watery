export type ColorPalette = {
  bg: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  primary: string;
  primaryFg: string; // text ON primary background
  primaryGlow: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  divider: string;
  success: string;
  warning: string;
  danger: string;
  water: string;
  waterDeep: string;
  gradientStart: string;
  gradientEnd: string;
};

export const lightColors: ColorPalette = {
  bg: '#F5F8FA',           // very slight blue-gray tint, not pure white
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.80)',
  primary: '#0077B6',      // deep ocean blue
  primaryFg: '#FFFFFF',    // white text always on primary
  primaryGlow: 'rgba(0,119,182,0.14)',
  secondary: '#0096C7',
  accent: '#00B4D8',
  text: '#0D1B2A',
  textMuted: '#52647A',    // darker muted for light mode readability
  textSubtle: '#8FA3B8',
  border: 'rgba(13,27,42,0.10)',
  divider: '#E8EEF3',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  water: '#00B4D8',
  waterDeep: '#0077B6',
  gradientStart: '#90E0EF',
  gradientEnd: '#0077B6',
};

export const darkColors: ColorPalette = {
  bg: '#080D1A',           // deeper dark
  surface: '#111827',      // slightly warmer dark surface
  surfaceElevated: '#1A2438',
  surfaceGlass: 'rgba(17,24,39,0.90)',
  primary: '#38BDF8',      // sky-400 — visible on dark, not too neon
  primaryFg: '#0A1628',    // very dark text on light-ish primary
  primaryGlow: 'rgba(56,189,248,0.20)',
  secondary: '#0EA5E9',
  accent: '#7DD3FC',       // lighter accent for dark mode visibility
  text: '#F0F9FF',         // near white with blue tint
  textMuted: '#7AA3C0',    // visible muted on dark
  textSubtle: '#3D5A72',
  border: 'rgba(56,189,248,0.15)',
  divider: '#1E2D42',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  water: '#7DD3FC',
  waterDeep: '#0EA5E9',
  gradientStart: '#0EA5E9',
  gradientEnd: '#080D1A',
};

export const colorTokens = { lightColors, darkColors };
