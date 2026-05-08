// pressable button. spring-scale on press. theme-aware variants.

import { type ReactNode, useCallback } from 'react';
import {
  ActivityIndicator,
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { springs } from '@/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonHaptic = 'selection' | 'light' | 'medium' | 'heavy';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  icon?: string;
  haptic?: ButtonHaptic;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 38, md: 48, lg: 52 };
const PADDING_X: Record<ButtonSize, number> = { sm: 14, md: 18, lg: 22 };
// max radius 16 per spec
const RADIUS: Record<ButtonSize, number> = { sm: 10, md: 14, lg: 14 };

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  iconLeft,
  iconRight,
  icon: _icon,
  haptic = 'medium',
  className,
  style,
  onPress,
  ...rest
}: ButtonProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress: PressableProps['onPress'] = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled || loading) return;
      switch (haptic) {
        case 'selection':
          haptics.selection();
          break;
        case 'light':
          haptics.light();
          break;
        case 'heavy':
          haptics.heavy();
          break;
        default:
          haptics.medium();
      }
      onPress?.(e);
    },
    [disabled, loading, haptic, haptics, onPress],
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const primaryBg = theme.colors.primary;
  const primaryFg = theme.colors.primaryFg;

  const palette = (() => {
    switch (variant) {
      case 'primary':
        return {
          bg: primaryBg,
          fg: primaryFg,
          border: 'transparent',
          borderWidth: 0,
          glow: theme.colors.primaryGlow,
        };
      case 'secondary':
        return {
          bg: 'transparent',
          fg: theme.colors.primary,
          border: theme.colors.primary,
          borderWidth: 1.5,
          glow: 'transparent',
        };
      case 'ghost':
        return {
          bg: 'transparent',
          fg: theme.colors.primary,
          border: 'transparent',
          borderWidth: 0,
          glow: 'transparent',
        };
      case 'glass':
        return {
          bg: theme.colors.surfaceGlass,
          fg: theme.colors.text,
          border: theme.colors.border,
          borderWidth: 1,
          glow: 'transparent',
        };
      case 'danger':
        return {
          bg: theme.colors.danger,
          fg: '#FFFFFF',
          border: 'transparent',
          borderWidth: 0,
          glow: 'transparent',
        };
    }
  })();

  return (
    <Animated.View style={[animStyle, fullWidth ? { width: '100%' } : null]}>
      <Pressable
        {...rest}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!(disabled || loading) }}
        onPressIn={() => {
          scale.value = withSpring(0.96, springs.snappy);
          opacity.value = withTiming(0.88, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.snappy);
          opacity.value = withTiming(1, { duration: 150 });
        }}
        onPress={handlePress}
        disabled={disabled || loading}
        className={className}
        style={[
          {
            height: HEIGHTS[size],
            paddingHorizontal: PADDING_X[size],
            borderRadius: RADIUS[size],
            backgroundColor: palette.bg,
            borderWidth: palette.borderWidth,
            borderColor: palette.border,
            opacity: disabled ? 0.5 : 1,
            shadowColor: variant === 'primary' ? palette.glow : 'transparent',
            shadowOffset: { width: 0, height: variant === 'primary' ? 4 : 0 },
            shadowOpacity: variant === 'primary' ? 1 : 0,
            shadowRadius: variant === 'primary' ? 12 : 0,
            elevation: variant === 'primary' ? 6 : 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={palette.fg} size="small" />
        ) : (
          <>
            {iconLeft ? <View style={{ marginRight: 8 }}>{iconLeft}</View> : null}
            <Text
              variant={size === 'lg' ? 'bodyLg' : size === 'sm' ? 'caption' : 'body'}
              weight="semibold"
              color={palette.fg}
              style={{ letterSpacing: 0.1 }}
            >
              {title}
            </Text>
            {iconRight ? <View style={{ marginLeft: 8 }}>{iconRight}</View> : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
