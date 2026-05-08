// animated switch. spring-translated thumb. glow halo when on.

import { useCallback, useEffect } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { springs } from '@/theme';

export interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const W = 52;
const H = 32;
const PAD = 3;
const THUMB = H - PAD * 2;

export function Toggle({ value, onChange, disabled, style }: ToggleProps): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const t = useSharedValue(value ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    t.value = withSpring(value ? 1 : 0, springs.snappy);
  }, [value, t]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      t.value,
      [0, 1],
      [theme.colors.divider, theme.colors.primary],
    ),
    shadowOpacity: 0.45 * t.value,
    shadowRadius: 4 + t.value * 12,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * (W - THUMB - PAD * 2) },
      { scale: press.value },
    ],
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;
    haptics.selection();
    onChange(!value);
  }, [disabled, haptics, onChange, value]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      onPress={handlePress}
      onPressIn={() => (press.value = withTiming(0.92, { duration: 120, easing: Easing.out(Easing.cubic) }))}
      onPressOut={() => (press.value = withTiming(1, { duration: 160 }))}
      style={style}
    >
      <Animated.View
        style={[
          {
            width: W,
            height: H,
            borderRadius: H / 2,
            padding: PAD,
            opacity: disabled ? 0.5 : 1,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 0 },
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: '#ffffff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.18,
              shadowRadius: 2,
              elevation: 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
