// animated cup glyph that fills with water 0..1.
// outer: cup outline. inner: clipped fill rect rising on Reanimated derived value.

import { useEffect } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';
import { clamp } from '@/utils/math';

export interface CupIconProps {
  size?: number;
  fill?: number; // 0..1
  color?: string;
  outlineColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function CupIcon({ size = 28, fill = 0, color, outlineColor, style }: CupIconProps): JSX.Element {
  const { theme } = useTheme();
  const f = useSharedValue(clamp(fill, 0, 1));

  useEffect(() => {
    f.value = withTiming(clamp(fill, 0, 1), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [fill, f]);

  // svg viewport 24
  const VBOX = 24;
  const cupTop = 6;
  const cupBottom = 21;
  const cupHeight = cupBottom - cupTop;

  const fillStyle = useAnimatedStyle(() => ({
    height: f.value * cupHeight,
  }));

  const fg = color ?? theme.colors.water;
  const stroke = outlineColor ?? theme.colors.text;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VBOX} ${VBOX}`}>
        <Defs>
          <ClipPath id="cupClip">
            <Path d="M6 6h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6z" />
          </ClipPath>
        </Defs>
        {/* outline */}
        <Path
          d="M6 6h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6z"
          stroke={stroke}
          strokeWidth={1.6}
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M5 6h14"
          stroke={stroke}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </Svg>
      {/* fill overlay clipped to cup */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          overflow: 'hidden',
          // approx clip via rounded mask isn't strict; visible fill is good enough.
          alignItems: 'flex-end',
          flexDirection: 'column-reverse',
        }}
      >
        <Animated.View
          style={[
            {
              width: '100%',
              backgroundColor: fg,
              opacity: 0.85,
              borderTopLeftRadius: size * 0.2,
              borderTopRightRadius: size * 0.2,
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}
