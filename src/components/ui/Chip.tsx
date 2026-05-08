// pill chip. icon + label, optional selected state with glow.

import { type ReactNode, useCallback } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { radius, springs } from '@/theme';

import { Text } from './Text';

export type ChipTint = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export interface ChipProps {
  label: string;
  icon?: 'flame' | 'water' | 'check' | 'star' | 'time' | 'sparkle' | string;
  tint?: ChipTint;
  selected?: boolean;
  onPress?: () => void;
  iconNode?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const ICONS: Record<string, string> = {
  flame: 'M12 2c1.5 4 5 6 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3 1-6 1-10z',
  water: 'M12 3s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z',
  check: 'M5 12l4 4 10-10',
  star: 'M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  time: 'M12 7v5l3 2',
  sparkle: 'M12 2v4 m0 12v4 M2 12h4 m12 0h4 M5 5l3 3 m8 8l3 3 M19 5l-3 3 m-8 8l-3 3',
};

export function Chip({
  label,
  icon,
  tint = 'primary',
  selected,
  onPress,
  iconNode,
  className,
  style,
}: ChipProps): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const tone = (() => {
    switch (tint) {
      case 'success':
        return { bg: theme.colors.success, glow: theme.colors.success };
      case 'warning':
        return { bg: theme.colors.warning, glow: theme.colors.warning };
      case 'danger':
        return { bg: theme.colors.danger, glow: theme.colors.danger };
      case 'neutral':
        return { bg: theme.colors.textMuted, glow: theme.colors.textMuted };
      case 'primary':
      default:
        return { bg: theme.colors.primary, glow: theme.colors.primaryGlow };
    }
  })();

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(() => {
    haptics.selection();
    onPress?.();
  }, [haptics, onPress]);

  const Inner = (
    <Animated.View
      style={[
        animStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: selected ? tone.bg : theme.colors.surface,
          borderWidth: 1,
          borderColor: selected ? tone.bg : theme.colors.border,
          shadowColor: selected ? tone.glow : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: selected ? 0.5 : 0,
          shadowRadius: selected ? 12 : 0,
          elevation: selected ? 4 : 0,
        },
        style,
      ]}
    >
      {iconNode ? (
        <View style={{ marginRight: 6 }}>{iconNode}</View>
      ) : icon && ICONS[icon] ? (
        <Svg width={14} height={14} viewBox="0 0 24 24" style={{ marginRight: 6 }} fill="none">
          <Path
            d={ICONS[icon]}
            stroke={selected ? '#fff' : tone.bg}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
      <Text
        variant="caption"
        weight="semibold"
        color={selected ? '#fff' : theme.colors.text}
      >
        {label}
      </Text>
    </Animated.View>
  );

  if (!onPress) return <View className={className}>{Inner}</View>;

  return (
    <Pressable
      className={className}
      onPress={handlePress}
      onPressIn={() => (scale.value = withSpring(0.95, springs.snappy))}
      onPressOut={() => (scale.value = withSpring(1, springs.snappy))}
    >
      {Inner}
    </Pressable>
  );
}
