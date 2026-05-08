// level + xp progress bar. animated fill on change.

import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';
import { clamp } from '@/utils/math';

export interface XpBarProps {
  level: number;
  xpInLevel?: number;
  xpForNextLevel?: number;
  // alias names accepted by screens
  xp?: number;
  xpForNext?: number;
  showLabels?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function XpBar({
  level,
  xpInLevel,
  xpForNextLevel,
  xp,
  xpForNext,
  showLabels = true,
  height = 14,
  style,
}: XpBarProps): JSX.Element {
  const { theme } = useTheme();
  const currentXp = xpInLevel ?? xp ?? 0;
  const targetXp = xpForNextLevel ?? xpForNext ?? 0;
  const target = clamp(targetXp > 0 ? currentXp / targetXp : 0, 0, 1);
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withTiming(target, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [target, w]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={style}>
      {showLabels ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text variant="caption" weight="semibold">
            Level {level}
          </Text>
          <Text variant="caption" muted>
            {currentXp} / {targetXp} XP
          </Text>
        </View>
      ) : null}
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.divider,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              borderRadius: height / 2,
              backgroundColor: theme.colors.accent,
              shadowColor: theme.colors.accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}
