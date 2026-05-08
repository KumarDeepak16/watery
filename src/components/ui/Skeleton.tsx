// shimmer skeleton. opacity oscillates via Reanimated; gradient shimmer via Skia (canvas) lite.

import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps): JSX.Element {
  const { theme } = useTheme();
  const t = useSharedValue(0.6);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true,
    );
  }, [t]);

  const animStyle = useAnimatedStyle(() => ({ opacity: t.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.divider,
        },
        animStyle,
        style as ViewStyle,
      ]}
    >
      <View />
    </Animated.View>
  );
}
