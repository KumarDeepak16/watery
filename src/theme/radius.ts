export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
