import { type ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/hooks/useTheme';

export interface GlassCardProps {
  intensity?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  borderRadius?: number;
  noBorder?: boolean;
  padding?: number;
}

export function GlassCard({
  intensity,
  className,
  style,
  children,
  borderRadius = 20,
  noBorder,
  padding,
}: GlassCardProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const blur = intensity ?? (isDark ? 32 : 55);
  const useBlur = Platform.OS === 'ios';
  const pad = padding ?? 0;  // callers use className="p-5" or style={{padding:n}} — don't double-pad

  return (
    <View
      className={className}
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          shadowColor: isDark ? '#000' : theme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.32 : 0.06,
          shadowRadius: 14,
          elevation: 6,
        },
        style,
      ]}
    >
      {/* Blur layer (iOS only) */}
      {useBlur && (
        <BlurView
          intensity={blur}
          tint={isDark ? 'dark' : 'light'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      {/* Tinted fill */}
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: isDark
            ? 'rgba(22,30,52,0.88)'
            : 'rgba(255,255,255,0.90)',
          borderRadius,
          borderWidth: noBorder ? 0 : 1,
          borderColor: isDark
            ? 'rgba(56,189,248,0.13)'
            : 'rgba(0,119,182,0.09)',
        }}
      />

      {/* Top highlight — premium glass shimmer */}
      {!noBorder && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 18,
            right: 18,
            height: 1,
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.09)'
              : 'rgba(255,255,255,1)',
            borderRadius: 1,
          }}
        />
      )}

      {/* Content */}
      <View style={{ padding: pad }}>{children}</View>
    </View>
  );
}
