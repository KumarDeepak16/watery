import { Easing } from 'react-native-reanimated';

// cubic-bezier curves picked for crisp deceleration on UI elements.
export const easings = {
  easeOutQuart: Easing.bezier(0.25, 1, 0.5, 1),
  easeOutQuint: Easing.bezier(0.22, 1, 0.36, 1),
  easeOutExpo: Easing.bezier(0.16, 1, 0.3, 1),
  easeInOutCubic: Easing.bezier(0.65, 0, 0.35, 1),
  linear: Easing.linear,
};

export const durations = {
  fast: 200,
  normal: 350,
  slow: 500,
  lazy: 700,
} as const;

export const springs = {
  // gentle for surface transitions
  gentle: { damping: 18, stiffness: 140, mass: 1 },
  // snappy for buttons/taps
  snappy: { damping: 14, stiffness: 220, mass: 0.9 },
  // bouncy for celebrations
  bouncy: { damping: 9, stiffness: 180, mass: 1 },
  // wobbly for water/liquid feel
  wobbly: { damping: 11, stiffness: 90, mass: 1.1 },
} as const;

export type SpringPreset = keyof typeof springs;
export type DurationToken = keyof typeof durations;
