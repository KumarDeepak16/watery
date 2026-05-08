// Horizontal bar chart showing hydration by time-of-day group.

import { useEffect, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';

export interface PeakHoursDatum {
  hour: number; // 0..23
  totalMl?: number;
  count?: number;
}

export interface PeakHoursChartProps {
  data: ReadonlyArray<PeakHoursDatum>;
  size?: number; // kept for API compat, unused
  style?: StyleProp<ViewStyle>;
}

interface GroupDef {
  label: string;
  range: [number, number]; // inclusive start, exclusive end
  extraRange?: [number, number]; // for Night wrapping 0-5
  colorKey: 'success' | 'primary' | 'accent' | 'warning' | 'textSubtle';
}

const GROUPS: GroupDef[] = [
  { label: 'Morning',     range: [6,  9],  colorKey: 'success'   },
  { label: 'Mid-Morning', range: [9,  12], colorKey: 'primary'   },
  { label: 'Afternoon',   range: [12, 15], colorKey: 'primary'   },
  { label: 'Post-Noon',   range: [15, 18], colorKey: 'accent'    },
  { label: 'Evening',     range: [18, 21], colorKey: 'warning'   },
  { label: 'Night',       range: [21, 24], extraRange: [0, 6], colorKey: 'textSubtle' },
];

const ROW_HEIGHT = 44;
const LABEL_W = 90;
const VALUE_W = 54;

interface BarRowProps {
  label: string;
  totalMl: number;
  ratio: number; // 0..1
  color: string;
  mutedColor: string;
  delay: number;
}

function BarRow({ label, totalMl, ratio, color, mutedColor, delay }: BarRowProps): JSX.Element {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(ratio, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, [ratio, delay, width]);

  const animStyle = useAnimatedStyle(() => ({
    flex: width.value,
  }));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: ROW_HEIGHT,
        gap: 8,
      }}
    >
      {/* Label */}
      <Text
        variant="micro"
        style={{ width: LABEL_W, color: mutedColor }}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Bar track */}
      <View style={{ flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' }}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Animated.View
            style={[
              { height: 10, borderRadius: 5, backgroundColor: color },
              animStyle,
            ]}
          />
          {/* spacer */}
          <View style={{ flex: Math.max(0, 1 - ratio) }} />
        </View>
      </View>

      {/* ml value */}
      <Text
        variant="micro"
        style={{ width: VALUE_W, textAlign: 'right', color: mutedColor }}
      >
        {totalMl > 0 ? `${Math.round(totalMl)}ml` : '—'}
      </Text>
    </View>
  );
}

export function PeakHoursChart({ data, style }: PeakHoursChartProps): JSX.Element {
  const { colors } = useTheme();

  const colorMap: Record<GroupDef['colorKey'], string> = {
    success:   colors.success,
    primary:   colors.primary,
    accent:    colors.accent,
    warning:   colors.warning,
    textSubtle: colors.textSubtle,
  };

  const grouped = useMemo(() => {
    return GROUPS.map((g) => {
      const totalMl = data.reduce((sum, d) => {
        const inPrimary = d.hour >= g.range[0] && d.hour < g.range[1];
        const inExtra   = g.extraRange
          ? d.hour >= g.extraRange[0] && d.hour < g.extraRange[1]
          : false;
        return inPrimary || inExtra ? sum + (d.totalMl ?? d.count ?? 0) : sum;
      }, 0);
      return { label: g.label, totalMl, colorKey: g.colorKey };
    });
  }, [data]);

  const maxMl = useMemo(
    () => Math.max(1, ...grouped.map((g) => g.totalMl)),
    [grouped],
  );

  return (
    <View style={style}>
      <Text
        variant="caption"
        weight="semibold"
        style={{ marginBottom: 4, letterSpacing: 0.6 }}
      >
        Active Hours
      </Text>
      {grouped.map((g, i) => (
        <BarRow
          key={g.label}
          label={g.label}
          totalMl={g.totalMl}
          ratio={g.totalMl / maxMl}
          color={colorMap[g.colorKey]}
          mutedColor={colors.textMuted}
          delay={i * 80}
        />
      ))}
    </View>
  );
}
