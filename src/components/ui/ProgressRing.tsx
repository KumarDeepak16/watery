// circular progress ring. SVG circle with animated stroke-dashoffset via Reanimated.
// glow halo prop adds outer shadow tint.

import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';
import { clamp } from '@/utils/math';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  glow?: boolean;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
  durationMs?: number;
}

export function ProgressRing({
  size = 120,
  strokeWidth = 10,
  progress,
  color,
  trackColor,
  glow = true,
  rounded = true,
  style,
  durationMs = 900,
}: ProgressRingProps): JSX.Element {
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = clamp(progress, 0, 1);

  const t = useSharedValue(target);

  useEffect(() => {
    t.value = withTiming(target, { duration: durationMs, easing: Easing.out(Easing.cubic) });
  }, [target, t, durationMs]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - t.value),
  }));

  const ringColor = color ?? theme.colors.primary;
  const track = trackColor ?? theme.colors.divider;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: glow ? ringColor : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glow ? 0.55 : 0,
          shadowRadius: glow ? 16 : 0,
          elevation: glow ? 6 : 0,
        },
        style,
      ]}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap={rounded ? 'round' : 'butt'}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}
