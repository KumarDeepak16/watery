// github-style year heatmap. cells colored by daily completion ratio.

import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';

export interface StreakCell {
  date: string; // yyyy-MM-dd
  ratio?: number; // 0..1
  completed?: boolean;
}

export interface StreakCalendarProps {
  cells?: ReadonlyArray<StreakCell>;
  // alias accepted by screens
  data?: ReadonlyArray<StreakCell>;
  cellSize?: number;
  gap?: number;
  weeksToShow?: number;
  style?: StyleProp<ViewStyle>;
}

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function StreakCalendar({
  cells,
  data,
  cellSize = 11,
  gap = 3,
  weeksToShow = 26,
  style,
}: StreakCalendarProps): JSX.Element {
  const { theme } = useTheme();

  const flatCells = cells ?? data ?? [];

  // arrange cells into 7-row grid by week
  const grid = useMemo(() => {
    const cols: StreakCell[][] = [];
    const last = flatCells.slice(-weeksToShow * 7);
    for (let i = 0; i < last.length; i += 7) {
      cols.push([...last.slice(i, i + 7)]);
    }
    return cols;
  }, [flatCells, weeksToShow]);

  return (
    <View style={style}>
      <View style={{ flexDirection: 'row' }}>
        {grid.map((week, wi) => (
          <View key={wi} style={{ marginRight: gap }}>
            {Array.from({ length: 7 }).map((_, di) => {
              const cell = week[di];
              const r = cell?.ratio ?? (cell?.completed ? 1 : 0);
              return (
                <View
                  key={di}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    marginBottom: gap,
                    borderRadius: 3,
                    backgroundColor: cell ? theme.colors.primary : theme.colors.divider,
                    opacity: cell ? 0.18 + r * 0.82 : 0.4,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      {/* legend */}
      <View
        style={{
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
        }}
      >
        <Text variant="micro" muted>
          Less
        </Text>
        {[0.2, 0.45, 0.7, 1].map((v) => (
          <View
            key={v}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 3,
              backgroundColor: theme.colors.primary,
              opacity: v,
            }}
          />
        ))}
        <Text variant="micro" muted>
          More
        </Text>
      </View>
    </View>
  );
}
