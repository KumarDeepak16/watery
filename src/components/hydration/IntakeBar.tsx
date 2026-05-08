// horizontal intake bar with milestone markers (25/50/75% goal).

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

export interface IntakeBarProps {
  totalMl: number;
  goalMl: number;
  height?: number;
  showMilestones?: boolean;
  showLabels?: boolean;
  style?: StyleProp<ViewStyle>;
}

const MILESTONES = [0.25, 0.5, 0.75] as const;

export function IntakeBar({
  totalMl,
  goalMl,
  height = 14,
  showMilestones = true,
  showLabels,
  style,
}: IntakeBarProps): JSX.Element {
  const { theme } = useTheme();
  const target = clamp(goalMl > 0 ? totalMl / goalMl : 0, 0, 1);
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [target, w]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={style}>
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
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 6,
            },
            fillStyle,
          ]}
        />
        {showMilestones &&
          MILESTONES.map((m) => (
            <View
              key={m}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${m * 100}%`,
                top: 2,
                bottom: 2,
                width: 2,
                backgroundColor: theme.colors.bg,
                opacity: 0.6,
              }}
            />
          ))}
      </View>
      {showLabels ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text variant="micro" muted>
            0
          </Text>
          <Text variant="micro" muted>
            {Math.round(goalMl / 4)}ml
          </Text>
          <Text variant="micro" muted>
            {Math.round(goalMl / 2)}ml
          </Text>
          <Text variant="micro" muted>
            {Math.round((goalMl * 3) / 4)}ml
          </Text>
          <Text variant="micro" muted>
            {goalMl}ml
          </Text>
        </View>
      ) : null}
    </View>
  );
}
