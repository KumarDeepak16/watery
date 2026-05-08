import type { ViewStyle } from 'react-native';

export type ShadowToken = ViewStyle;

// android elevation only roughly approximates iOS shadow.
export const shadows: Record<
  'sm' | 'md' | 'lg' | 'xl' | 'glow' | 'darkGlow' | 'floatingCard',
  ShadowToken
> = {
  sm: {
    shadowColor: '#0A1B2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0A1B2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0A1B2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0A1B2A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
  },
  glow: {
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  darkGlow: {
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 16,
  },
  floatingCard: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 12,
  },
};
