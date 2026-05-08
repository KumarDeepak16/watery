// flame icon with subtle scale pulse proportional to streak length.

import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';

export interface StreakFlameProps {
  days: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StreakFlame({ days, compact, style }: StreakFlameProps): JSX.Element {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  // bigger pulse for hot streaks
  const intensity = Math.min(1, days / 30);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1 + 0.06 + intensity * 0.06, {
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [intensity, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const size = compact ? 22 : 36;
  const flameColor = days > 0 ? theme.colors.warning : theme.colors.textSubtle;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: compact ? 8 : 12,
          paddingVertical: compact ? 4 : 8,
          borderRadius: 999,
          backgroundColor: compact ? theme.colors.surface : 'transparent',
          borderWidth: compact ? 1 : 0,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Animated.View style={animStyle}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="flameG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FBBF24" />
              <Stop offset="0.6" stopColor={flameColor} />
              <Stop offset="1" stopColor="#DC2626" />
            </LinearGradient>
          </Defs>
          <Path
            d="M12 2c1.5 4 5 6 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3 1-6 1-10z"
            fill={days > 0 ? 'url(#flameG)' : theme.colors.divider}
            stroke={flameColor}
            strokeWidth={1}
          />
        </Svg>
      </Animated.View>
      <Text variant={compact ? 'caption' : 'h4'} weight="semibold">
        {days}
      </Text>
      {!compact ? (
        <Text variant="caption" muted>
          day{days === 1 ? '' : 's'}
        </Text>
      ) : null}
    </View>
  );
}
