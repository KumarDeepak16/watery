// round/square icon button. spring scale on press. uses ionicon-like name -> svg lookup via vector glyph.

import { useCallback } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { springs } from '@/theme';

export type IconName =
  | 'moon'
  | 'sunny'
  | 'phone-portrait'
  | 'flame'
  | 'water'
  | 'plus'
  | 'close'
  | 'check'
  | 'arrow-back'
  | 'arrow-forward'
  | 'settings'
  | 'bell'
  | 'home'
  | 'history'
  | 'profile';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: IconName;
  size?: number;
  variant?: 'glass' | 'solid' | 'ghost';
  shape?: 'round' | 'square';
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// minimal ionicon-style SVG paths. caveman-set kept small.
const PATHS: Record<IconName, string> = {
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  sunny: 'M12 4V2 m0 20v-2 M4.93 4.93 3.51 3.51 m16.97 16.97-1.41-1.41 M2 12h2 m16 0h2 M4.93 19.07l-1.42 1.42 m16.96-16.96 1.42-1.42 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  'phone-portrait':
    'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 17.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  flame: 'M12 2c1.5 4 5 6 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3 1-6 1-10z',
  water: 'M12 3s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z',
  plus: 'M12 5v14 M5 12h14',
  close: 'M6 6l12 12 M18 6L6 18',
  check: 'M5 12l4 4 10-10',
  'arrow-back': 'M15 18l-6-6 6-6',
  'arrow-forward': 'M9 18l6-6-6-6',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4-2 1 1 2-2 2-2-1-1 2h-2l-1-2-2 1-2-2 1-2-2-1v-2l2-1-1-2 2-2 2 1 1-2h2l1 2 2-1 2 2-1 2 2 1z',
  bell: 'M6 17h12l-1-2v-4a5 5 0 0 0-10 0v4l-1 2zm5 3a2 2 0 0 0 4 0',
  home: 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z',
  history: 'M3 12a9 9 0 1 1 3 6.7L3 21l.5-3 M12 7v5l3 2',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
};

export function IconButton({
  icon,
  size = 22,
  variant = 'glass',
  shape = 'round',
  color,
  className,
  style,
  onPress,
  ...rest
}: IconButtonProps): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const handle: PressableProps['onPress'] = useCallback(
    (e: GestureResponderEvent) => {
      haptics.selection();
      onPress?.(e);
    },
    [haptics, onPress],
  );

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const dim = size + 22;
  const fg = color ?? theme.colors.text;
  const bg =
    variant === 'solid'
      ? theme.colors.primary
      : variant === 'ghost'
        ? 'transparent'
        : theme.colors.surfaceGlass;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        {...rest}
        onPressIn={() => (scale.value = withSpring(0.92, springs.snappy))}
        onPressOut={() => (scale.value = withSpring(1, springs.snappy))}
        onPress={handle}
        accessibilityRole="button"
        className={className}
        style={[
          {
            width: dim,
            height: dim,
            borderRadius: shape === 'round' ? dim / 2 : 14,
            backgroundColor: bg,
            borderWidth: variant === 'glass' ? 1 : 0,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d={PATHS[icon]}
            stroke={variant === 'solid' ? '#fff' : fg}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* anchor circle so empty paths render reliably */}
          <Circle cx={0} cy={0} r={0} fill="transparent" />
        </Svg>
        <View pointerEvents="none" />
      </Pressable>
    </Animated.View>
  );
}
