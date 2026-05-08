// Weekly bar chart — pure react-native-svg, no victory-native.
// Animated bars (Reanimated), dashed goal line, day labels, Y-axis.

import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  Line,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { getWeekData } from '@/services/analyticsService';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface WeeklyBarChartProps {
  weekOffset?: number;
  goalMl?: number;
  height?: number;
}

const Y_AXIS_W = 32;
const X_LABELS_H = 24;
const BAR_RADIUS = 5;

interface BarItemProps {
  x: number;
  barW: number;
  chartH: number;
  totalMl: number;
  maxMl: number;
  goalMl: number;
  label: string;
  delay: number;
  primaryColor: string;
  accentColor: string;
  mutedColor: string;
  successColor: string;
}

function BarItem({
  x,
  barW,
  chartH,
  totalMl,
  maxMl,
  goalMl,
  label,
  delay,
  primaryColor,
  accentColor,
  mutedColor,
  successColor,
}: BarItemProps): JSX.Element {
  const ratio = maxMl > 0 ? Math.min(totalMl / maxMl, 1) : 0;
  const barH = useSharedValue(0);

  useEffect(() => {
    barH.value = withDelay(
      delay,
      withTiming(ratio * chartH, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
  }, [ratio, delay, barH]);

  const pct = goalMl > 0 ? totalMl / goalMl : 0;
  const fill =
    pct >= 1 ? successColor : pct >= 0.5 ? primaryColor : pct > 0 ? accentColor : mutedColor;

  const animProps = useAnimatedProps(() => ({
    y: chartH - barH.value,
    height: barH.value,
  }));

  return (
    <>
      <AnimatedRect
        x={x}
        width={barW}
        rx={BAR_RADIUS}
        ry={BAR_RADIUS}
        fill={fill}
        animatedProps={animProps}
      />
      <SvgText
        x={x + barW / 2}
        y={chartH + 16}
        fontSize={10}
        textAnchor="middle"
        fill={mutedColor}
        fontFamily="PlusJakartaSans_400Regular"
      >
        {label}
      </SvgText>
    </>
  );
}

export function WeeklyBarChart({
  weekOffset = 0,
  goalMl: goalProp,
  height = 200,
}: WeeklyBarChartProps): JSX.Element {
  const { colors } = useTheme();
  const hookGoal = useDailyGoal();
  const goalMl = goalProp ?? hookGoal;

  const days = useMemo(
    () => getWeekData(weekOffset, goalMl),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekOffset, goalMl],
  );

  const chartH = height - X_LABELS_H;

  const maxMl = useMemo(() => {
    const peak = Math.max(goalMl, ...days.map((d) => d.totalMl), 1);
    return peak * 1.1;
  }, [days, goalMl]);

  // Y-axis ticks: 0, 1L, 2L, 3L up to maxMl
  const yTicks = useMemo(() => {
    const step = 1000;
    const ticks: number[] = [0];
    for (let v = step; v <= maxMl; v += step) ticks.push(v);
    return ticks;
  }, [maxMl]);

  const goalLineY = maxMl > 0 ? chartH - (goalMl / maxMl) * chartH : 0;

  return (
    <View style={{ width: '100%' }}>
      <Svg width="100%" height={height} viewBox={`0 0 280 ${height}`}>
        <Defs />

        {/* Y-axis labels */}
        {yTicks.map((v) => {
          const y = chartH - (v / maxMl) * chartH;
          const label = v === 0 ? '0' : `${v / 1000}L`;
          return (
            <SvgText
              key={v}
              x={0}
              y={y + 4}
              fontSize={9}
              fill={colors.textSubtle}
              fontFamily="PlusJakartaSans_400Regular"
            >
              {label}
            </SvgText>
          );
        })}

        {/* goal line — dashed */}
        <Line
          x1={Y_AXIS_W}
          y1={goalLineY}
          x2={280}
          y2={goalLineY}
          stroke={colors.primary}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.45}
        />

        {/* bars */}
        {days.map((d, i) => {
          const availableW = 280 - Y_AXIS_W;
          const slotW = availableW / 7;
          const barW = slotW * 0.55;
          const barX = Y_AXIS_W + i * slotW + (slotW - barW) / 2;
          return (
            <BarItem
              key={d.date}
              x={barX}
              barW={barW}
              chartH={chartH}
              totalMl={d.totalMl}
              maxMl={maxMl}
              goalMl={goalMl}
              label={d.dayLabel}
              delay={60 * i}
              primaryColor={colors.primary}
              accentColor={colors.accent}
              mutedColor={colors.textSubtle}
              successColor={colors.success}
            />
          );
        })}
      </Svg>
    </View>
  );
}
