import { type ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/hooks/useTheme';

export type CardVariant = 'default' | 'glass' | 'elevated' | 'outlined' | 'tinted';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const PAD: Record<CardPadding, number> = { none: 0, sm: 12, md: 18, lg: 24 };
const R = 20;

export function Card({ variant = 'default', padding = 'md', className, style, children }: CardProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const pad = PAD[padding];

  // ── Glass ──────────────────────────────────────────────────────────────────
  if (variant === 'glass') {
    const useBlur = Platform.OS === 'ios';
    return (
      <View
        className={className}
        style={[
          {
            borderRadius: R,
            overflow: 'hidden',
            // outer shadow
            shadowColor: isDark ? '#000' : theme.colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.35 : 0.06,
            shadowRadius: 12,
            elevation: 6,
          },
          style,
        ]}
      >
        {useBlur && (
          <BlurView
            intensity={isDark ? 32 : 55}
            tint={isDark ? 'dark' : 'light'}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}
        {/* Base fill */}
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: isDark ? 'rgba(28,36,64,0.82)' : 'rgba(255,255,255,0.88)',
            borderRadius: R,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(56,189,248,0.14)' : 'rgba(0,119,182,0.10)',
          }}
        />
        {/* Top highlight line — premium glass feel */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 16,
            right: 16,
            height: 1,
            backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.90)',
            borderRadius: 1,
          }}
        />
        <View style={{ padding: pad }}>{children}</View>
      </View>
    );
  }

  // ── Elevated ───────────────────────────────────────────────────────────────
  if (variant === 'elevated') {
    return (
      <View
        className={className}
        style={[
          {
            borderRadius: R,
            padding: pad,
            backgroundColor: theme.colors.surfaceElevated,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.45 : 0.10,
            shadowRadius: 18,
            elevation: 10,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // ── Outlined ───────────────────────────────────────────────────────────────
  if (variant === 'outlined') {
    return (
      <View
        className={className}
        style={[
          {
            borderRadius: R,
            padding: pad,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: theme.colors.border,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // ── Tinted (accent bg) ────────────────────────────────────────────────────
  if (variant === 'tinted') {
    return (
      <View
        className={className}
        style={[
          {
            borderRadius: R,
            padding: pad,
            backgroundColor: theme.colors.primaryGlow,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(56,189,248,0.22)' : 'rgba(0,119,182,0.15)',
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // ── Default ────────────────────────────────────────────────────────────────
  return (
    <View
      className={className}
      style={[
        {
          borderRadius: R,
          padding: pad,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.20 : 0.05,
          shadowRadius: 6,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
