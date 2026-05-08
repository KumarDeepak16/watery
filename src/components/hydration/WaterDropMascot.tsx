// SVG droplet mascot. eyes change with expression. optional idle bobbing animation.

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
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';

export type MascotExpression = 'happy' | 'celebrate' | 'sad' | 'sleepy' | 'thirsty';

export interface WaterDropMascotProps {
  size?: number;
  expression?: MascotExpression;
  float?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function WaterDropMascot({
  size = 140,
  expression = 'happy',
  float = true,
  style,
}: WaterDropMascotProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const bob = useSharedValue(0);

  useEffect(() => {
    if (!float) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [float, bob]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  // eye props per expression
  const eyes = (() => {
    switch (expression) {
      case 'celebrate':
        return { kind: 'arc' as const, mouthD: 'M 60 78 Q 70 90 80 78' };
      case 'sad':
      case 'thirsty':
        return { kind: 'dot' as const, mouthD: 'M 60 86 Q 70 78 80 86' };
      case 'sleepy':
        return { kind: 'line' as const, mouthD: 'M 62 84 Q 70 82 78 84' };
      case 'happy':
      default:
        return { kind: 'dot' as const, mouthD: 'M 60 80 Q 70 88 80 80' };
    }
  })();

  return (
    <Animated.View style={[animStyle, style]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 140 140">
          <Defs>
            <LinearGradient id="dropFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.accent} />
              <Stop offset="1" stopColor={theme.colors.waterDeep} />
            </LinearGradient>
            <RadialGradient id="hl" cx="42%" cy="38%" r="22%">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {/* body: water drop shape */}
          <Path
            d="M70 8 C 90 38 120 58 120 88 A 50 50 0 1 1 20 88 C 20 58 50 38 70 8 Z"
            fill="url(#dropFill)"
            stroke={isDark ? theme.colors.accent : theme.colors.waterDeep}
            strokeWidth={1}
          />
          {/* highlight */}
          <Path
            d="M55 30 C 50 42 45 56 50 70"
            stroke="#ffffff"
            strokeOpacity={0.5}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={70} cy={70} r={28} fill="url(#hl)" opacity={0.5} />

          {/* eyes */}
          {eyes.kind === 'dot' && (
            <>
              <Circle cx={56} cy={64} r={4} fill="#ffffff" />
              <Circle cx={84} cy={64} r={4} fill="#ffffff" />
              <Circle cx={56} cy={64} r={2} fill="#0A1B2A" />
              <Circle cx={84} cy={64} r={2} fill="#0A1B2A" />
            </>
          )}
          {eyes.kind === 'arc' && (
            <>
              <Path
                d="M50 62 Q 56 56 62 62"
                stroke="#ffffff"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M78 62 Q 84 56 90 62"
                stroke="#ffffff"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
          {eyes.kind === 'line' && (
            <>
              <Path d="M50 64 L 62 64" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
              <Path d="M78 64 L 90 64" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
            </>
          )}

          {/* mouth */}
          <Path
            d={eyes.mouthD}
            stroke="#ffffff"
            strokeOpacity={0.95}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    </Animated.View>
  );
}
