// three pulsing dots, staggered cycle. used for inline loading.

import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

export interface LoadingDotsProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingDots({ size = 8, color, style }: LoadingDotsProps): JSX.Element {
  const { theme } = useTheme();
  const tint = color ?? theme.colors.primary;

  const a = useSharedValue(0.3);
  const b = useSharedValue(0.3);
  const c = useSharedValue(0.3);

  useEffect(() => {
    const cycle = (sv: typeof a, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
            withTiming(0.3, { duration: 360, easing: Easing.in(Easing.cubic) }),
          ),
          -1,
        ),
      );
    };
    cycle(a, 0);
    cycle(b, 120);
    cycle(c, 240);
  }, [a, b, c]);

  const dotStyle = (sv: typeof a) =>
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [{ scale: 0.7 + sv.value * 0.5 }],
    }));

  return (
    <View style={[{ flexDirection: 'row', gap: 6 }, style]}>
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: tint },
          dotStyle(a),
        ]}
      />
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: tint },
          dotStyle(b),
        ]}
      />
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: tint },
          dotStyle(c),
        ]}
      />
    </View>
  );
}
