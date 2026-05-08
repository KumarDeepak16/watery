// Monthly heatmap — pure react-native-svg, no victory-native.
// 7-column grid, day number labels, tap-to-tooltip.

import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { addMonths, format, getDay, getDaysInMonth, startOfMonth } from 'date-fns';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { getMonthData, type DayData } from '@/services/analyticsService';
import { formatMl } from '@/utils/format';

export interface MonthlyHeatmapProps {
  monthOffset?: number;
}

const CELL_SIZE = 36;
const GAP = 4;
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
// Mon=1..Sun=0 in getDay; we want Mon=0 col
const dayToCol = (d: number): number => (d === 0 ? 6 : d - 1);

export function MonthlyHeatmap({ monthOffset = 0 }: MonthlyHeatmapProps): JSX.Element {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const goalMl = useDailyGoal();
  const [selected, setSelected] = useState<DayData | null>(null);

  const baseDate = addMonths(new Date(), monthOffset);
  const monthLabel = format(baseDate, 'MMMM yyyy');

  const days = useMemo(
    () => getMonthData(monthOffset, goalMl),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthOffset, goalMl],
  );

  // Grid: figure out the starting column (Mon-based) for day 1
  const firstDay = startOfMonth(baseDate);
  const startCol = dayToCol(getDay(firstDay));
  const totalCells = startCol + getDaysInMonth(baseDate);
  const numRows = Math.ceil(totalCells / 7);

  const svgW = 7 * (CELL_SIZE + GAP) - GAP;
  const svgH = numRows * (CELL_SIZE + GAP) - GAP;

  const cellColor = useCallback(
    (pct: number): string => {
      if (pct <= 0) return colors.surface;
      if (pct < 0.5) return colors.accent + '4D'; // 30% opacity
      if (pct < 1) return colors.accent + 'B3'; // 70% opacity
      return colors.primary;
    },
    [colors],
  );

  const handlePress = useCallback(
    (d: DayData) => {
      haptics.selection();
      setSelected((prev) => (prev?.date === d.date ? null : d));
    },
    [haptics],
  );

  return (
    <View>
      {/* Month header */}
      <Text variant="caption" weight="semibold" style={{ marginBottom: 10, textAlign: 'center' }}>
        {monthLabel}
      </Text>

      {/* Weekday headers */}
      <View style={{ flexDirection: 'row', marginBottom: GAP }}>
        {WEEKDAYS.map((d) => (
          <View
            key={d}
            style={{ width: CELL_SIZE, marginRight: GAP, alignItems: 'center' }}
          >
            <Text variant="micro" muted>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* SVG grid */}
      <Svg width={svgW} height={svgH}>
        {days.map((d, idx) => {
          const cellIdx = startCol + idx;
          const col = cellIdx % 7;
          const row = Math.floor(cellIdx / 7);
          const x = col * (CELL_SIZE + GAP);
          const y = row * (CELL_SIZE + GAP);
          const fill = cellColor(d.pct);
          const isSelected = selected?.date === d.date;

          return (
            <Pressable
              key={d.date}
              onPress={() => handlePress(d)}
            >
              <Rect
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={6}
                ry={6}
                fill={fill}
                stroke={isSelected ? colors.primary : 'transparent'}
                strokeWidth={isSelected ? 1.5 : 0}
              />
              <SvgText
                x={x + CELL_SIZE / 2}
                y={y + CELL_SIZE / 2 + 4}
                fontSize={10}
                textAnchor="middle"
                fill={d.pct >= 1 ? '#fff' : colors.textMuted}
                fontFamily="PlusJakartaSans_400Regular"
              >
                {d.dayLabel}
              </SvgText>
            </Pressable>
          );
        })}
      </Svg>

      {/* Tooltip */}
      {selected ? (
        <View
          style={{
            marginTop: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: colors.surfaceElevated,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            alignSelf: 'flex-start',
          }}
        >
          <Text variant="caption" weight="semibold">
            {format(new Date(selected.date), 'EEE, d MMM')}
          </Text>
          <Text variant="micro" muted style={{ marginTop: 2 }}>
            {formatMl(selected.totalMl)} · {Math.round(selected.pct * 100)}% of goal
          </Text>
        </View>
      ) : null}
    </View>
  );
}
