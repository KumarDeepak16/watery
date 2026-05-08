// DailyRhythmChart — last 7 days as vertical pill bars colored by % of goal.

import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { getWeekData } from '@/services/analyticsService';
import { format, addWeeks, startOfWeek, addDays } from 'date-fns';

export interface DailyRhythmChartProps {
  weekOffset?: number;
  goalMl?: number;
  height?: number;
}

const PILL_W = 32;
const PILL_RADIUS = 8;
const DOT_R = 3;
const DOT_GAP = 6; // px above top of pill area

interface PillBarProps {
  pct: number;       // 0..1+ (clamped to 1 for display)
  maxHeight: number;
  color: string;
  isToday: boolean;
  dotColor: string;
  delay: number;
}

function PillBar({ pct, maxHeight, color, isToday, dotColor, delay }: PillBarProps): JSX.Element {
  const clampedPct = Math.min(1, Math.max(0, pct));
  const targetH = Math.max(4, clampedPct * maxHeight);

  const heightPct = useSharedValue(0);

  useEffect(() => {
    heightPct.value = withDelay(
      delay,
      withTiming(targetH, { duration: 550, easing: Easing.out(Easing.back(1.2)) }),
    );
  }, [targetH, delay, heightPct]);

  const animStyle = useAnimatedStyle(() => ({
    height: heightPct.value,
  }));

  const svgH = DOT_GAP + DOT_R * 2;

  return (
    <View style={{ alignItems: 'center', width: PILL_W }}>
      {/* dot above today's pill */}
      <Svg width={PILL_W} height={svgH}>
        {isToday ? (
          <Circle
            cx={PILL_W / 2}
            cy={DOT_R}
            r={DOT_R}
            fill={dotColor}
          />
        ) : null}
      </Svg>
      {/* pill container — fixed height so bars grow from the bottom */}
      <View
        style={{
          width: PILL_W,
          height: maxHeight,
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              width: PILL_W,
              borderRadius: PILL_RADIUS,
              backgroundColor: color,
            },
            animStyle,
          ]}
        />
      </View>
    </View>
  );
}

export function DailyRhythmChart({
  weekOffset = 0,
  goalMl: goalProp,
  height = 120,
}: DailyRhythmChartProps): JSX.Element {
  const { colors } = useTheme();
  const hookGoal = useDailyGoal();
  const goalMl = goalProp ?? hookGoal;

  const days = useMemo(
    () => getWeekData(weekOffset, goalMl),
    [weekOffset, goalMl],
  );

  // Determine today's date string for highlighting
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const pillColor = (pct: number): string => {
    if (pct >= 1)   return colors.success;
    if (pct >= 0.5) return colors.accent;
    if (pct > 0)    return `${colors.textSubtle}4D`; // ~30% opacity hex
    return `${colors.textSubtle}26`; // ~15% opacity for zero days
  };

  return (
    <View>
      {/* Pill row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {days.map((d, i) => (
          <PillBar
            key={d.date}
            pct={d.pct}
            maxHeight={height}
            color={pillColor(d.pct)}
            isToday={d.date === todayStr}
            dotColor={colors.primary}
            delay={i * 70}
          />
        ))}
      </View>

      {/* Day labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        {days.map((d) => (
          <Text
            key={d.date}
            variant="micro"
            style={{
              width: PILL_W,
              textAlign: 'center',
              color: d.date === todayStr ? colors.primary : colors.textMuted,
              fontSize: 10,
            }}
          >
            {d.dayLabel.slice(0, 3)}
          </Text>
        ))}
      </View>
    </View>
  );
}
