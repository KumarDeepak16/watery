// smooth line chart of weekly average. Catmull-Rom-like via bezier midpoints.
// Includes goal line, X-axis labels, and data-point dots.

import { useMemo } from 'react';
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';

export interface TrendPoint {
  label?: string;
  value?: number;
  // alternate field names accepted from analytics shapes
  week?: string;
  avg?: number;
  total?: number;
  totalMl?: number;
}

export interface TrendLineProps {
  data?: ReadonlyArray<TrendPoint>;
  // alias accepted by screens
  weeks?: ReadonlyArray<TrendPoint>;
  goalMl?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

// build smooth path from numeric points
const buildSmoothPath = (
  pts: { x: number; y: number }[],
): { line: string; area: string; baseY: number } => {
  if (pts.length === 0) return { line: '', area: '', baseY: 0 };
  if (pts.length === 1) return { line: `M ${pts[0]!.x} ${pts[0]!.y}`, area: '', baseY: pts[0]!.y };
  let line = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]!;
    const p1 = pts[i + 1]!;
    const cx = (p0.x + p1.x) / 2;
    line += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const baseY = Math.max(...pts.map((p) => p.y)) + 30;
  const area =
    line +
    ` L ${pts[pts.length - 1]!.x} ${baseY}` +
    ` L ${pts[0]!.x} ${baseY} Z`;
  return { line, area, baseY };
};

const trendValue = (p: TrendPoint): number =>
  p.value ?? p.avg ?? p.totalMl ?? p.total ?? 0;

const trendLabel = (p: TrendPoint, i: number): string =>
  p.label ?? p.week ?? `W${i + 1}`;

const X_LABELS_H = 18;

export function TrendLine({
  data,
  weeks,
  width: widthProp,
  height = 160,
  goalMl = 0,
  style,
}: TrendLineProps): JSX.Element {
  const { theme } = useTheme();
  const { width: windowW } = useWindowDimensions();

  const width = widthProp ?? windowW - 48;

  const pad = 16;
  const innerW = width - pad * 2;
  const chartH = height - X_LABELS_H;
  const innerH = chartH - pad * 2;

  const series: ReadonlyArray<TrendPoint> = data ?? weeks ?? [];

  const { line, area, points, goalLineY } = useMemo(() => {
    if (series.length === 0) return { line: '', area: '', points: [], goalLineY: null };
    const values = series.map(trendValue);
    const dataMax = Math.max(1, ...values);
    const effectiveMax = goalMl > 0 ? Math.max(dataMax, goalMl * 1.1) : dataMax;
    const min = Math.min(0, ...values);
    const span = Math.max(1, effectiveMax - min);
    const stepX = series.length === 1 ? 0 : innerW / (series.length - 1);
    const pts = series.map((d, i) => ({
      x: pad + i * stepX,
      y: pad + innerH - ((trendValue(d) - min) / span) * innerH,
    }));
    const { line: l, area: a } = buildSmoothPath(pts);

    const gLineY = goalMl > 0
      ? pad + innerH - ((goalMl - min) / span) * innerH
      : null;

    return { line: l, area: a, points: pts, goalLineY: gLineY };
  }, [series, innerH, innerW, goalMl, pad]);

  return (
    <View style={style}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity={0.45} />
            <Stop offset="1" stopColor={theme.colors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* gradient fill */}
        {area ? <Path d={area} fill="url(#trendFill)" /> : null}

        {/* goal line — dashed */}
        {goalLineY !== null ? (
          <Line
            x1={pad}
            y1={goalLineY}
            x2={pad + innerW}
            y2={goalLineY}
            stroke={theme.colors.success}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.65}
          />
        ) : null}

        {/* smooth line */}
        {line ? (
          <Path
            d={line}
            stroke={theme.colors.primary}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}

        {/* dots at each data point */}
        {points.map((pt, i) => (
          <Circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill={theme.colors.primary}
          />
        ))}

        {/* X-axis labels — every other point */}
        {series.map((p, i) => {
          if (i % 2 !== 0) return null;
          const pt = points[i];
          if (!pt) return null;
          return (
            <SvgText
              key={i}
              x={pt.x}
              y={chartH + X_LABELS_H - 2}
              fontSize={9}
              textAnchor="middle"
              fill={theme.colors.textSubtle}
              fontFamily="PlusJakartaSans_400Regular"
            >
              {trendLabel(p, i)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
