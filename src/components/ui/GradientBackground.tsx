import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';
import { gradientPresets, type GradientName } from '@/theme';

export interface GradientBackgroundProps {
  preset?: GradientName;
  children?: ReactNode;
  speed?: number;
}

export function GradientBackground({
  preset,
  children,
}: GradientBackgroundProps): JSX.Element {
  const { isDark } = useTheme();
  const name: GradientName = preset ?? (isDark ? 'midnightWater' : 'oceanDawn');
  const stops = gradientPresets[name];

  // expo-linear-gradient needs at least 2 colors
  const colors = stops.length >= 2 ? stops : [stops[0] ?? '#0A0E1A', stops[0] ?? '#1A3A4A'];

  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      style={StyleSheet.absoluteFill}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </LinearGradient>
  );
}
