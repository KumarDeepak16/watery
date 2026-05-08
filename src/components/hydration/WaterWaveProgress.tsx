// Hero water ring — SVG + Reanimated. No Skia, works in Expo Go.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';
import { mlToLiters } from '@/utils/format';
import { clamp } from '@/utils/math';

export interface WaterWaveProgressProps {
  size?: number;
  progress: number;
  currentMl: number;
  goalMl: number;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Pure JS — runs on JS thread
function buildWavePath(w: number, h: number, fillRatio: number, amplitude: number, phase: number): string {
  const fillY = h * (1 - clamp(fillRatio, 0, 1));
  const freq = 2;
  const steps = 40;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = fillY + Math.sin((i / steps) * Math.PI * 2 * freq + phase) * amplitude;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  pts.push(`L${w},${h} L0,${h} Z`);
  return pts.join(' ');
}

export const WaterWaveProgress = React.memo(function WaterWaveProgress({
  size = 280,
  progress,
  currentMl,
  goalMl,
  glow = true,
  style,
}: WaterWaveProgressProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const safeProgress = clamp(progress, 0, 1);
  const half = size / 2;
  const radiusVal = half - 8;
  const amplitude = safeProgress > 0.85 ? size * 0.055 : size * 0.04;

  // Celebration colors when nearly/fully complete
  const isCelebrating = safeProgress >= 0.95;
  const wave1Color = isCelebrating ? '#F59E0B' : theme.colors.primary;
  const wave2Color = isCelebrating ? '#FCD34D' : theme.colors.water;

  // Cap visual fill at 0.88 so wave surface stays visible at 100%
  const visualProgress = safeProgress >= 1.0 ? 0.88 : safeProgress;

  const isEmpty = safeProgress === 0;

  // Memoize color values to prevent SVG re-renders when theme doesn't change
  const frontWaveColor = useMemo(() => theme.colors.waterDeep, [theme.colors.waterDeep]);
  const backWaveColor = useMemo(() => theme.colors.water, [theme.colors.water]);
  const primaryColor = useMemo(() => theme.colors.primary, [theme.colors.primary]);
  // Empty = soft tinted bg. Filled = surface.
  const surfaceColor = useMemo(
    () => isEmpty ? theme.colors.primaryGlow : theme.colors.surface,
    [isEmpty, theme.colors.primaryGlow, theme.colors.surface],
  );
  // Border dashed when empty to hint "fill me"
  const ringColor = isEmpty ? theme.colors.border : wave1Color;

  // Text color logic: wave fills from bottom up.
  // Center text (at 50% height) is above water when progress < ~0.55 (accounting for wave amplitude).
  // In light mode: bg is white → need dark text when not filled.
  // In dark mode: bg is dark → need light text always.
  // Threshold: wave covers center text when visualProgress >= 0.52
  const waveCoversText = visualProgress >= 0.52;
  const textOnWave = '#FFFFFF';                    // text when sitting on blue wave
  const textOnBg = isDark ? theme.colors.text : theme.colors.text;  // text when on bg (dark on light, light on dark)
  const centerTextColor = isEmpty
    ? theme.colors.primary
    : waveCoversText
      ? textOnWave
      : textOnBg;
  const centerSubColor = isEmpty
    ? theme.colors.textSubtle
    : waveCoversText
      ? 'rgba(255,255,255,0.75)'
      : theme.colors.textMuted;
  const pillBg = isEmpty
    ? theme.colors.primaryGlow
    : waveCoversText
      ? 'rgba(0,0,0,0.25)'
      : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)');
  const pillTextColor = isEmpty
    ? theme.colors.primary
    : waveCoversText
      ? '#FFFFFF'
      : theme.colors.primary;

  // JS state for SVG path strings — updated via setInterval on JS thread
  const [wave1, setWave1] = useState(() => buildWavePath(size, size, visualProgress, amplitude, 0));
  const [wave2, setWave2] = useState(() => buildWavePath(size, size, visualProgress, amplitude * 0.7, Math.PI));

  // Smooth fill ratio via Reanimated
  const fillRatio = useSharedValue(visualProgress);

  // Animate fill ratio when progress changes — isolated effect
  useEffect(() => {
    fillRatio.value = withTiming(visualProgress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [visualProgress, fillRatio]);

  // Wave animation loop — stable, only restarts if size/amplitude changes
  const phase1Ref = useRef(0);
  const phase2Ref = useRef(Math.PI);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tickWave = useCallback(() => {
    phase1Ref.current = (phase1Ref.current + 0.06) % (Math.PI * 2);
    phase2Ref.current = (phase2Ref.current - 0.045 + Math.PI * 2) % (Math.PI * 2);
    const fr = fillRatio.value;
    setWave1(buildWavePath(size, size, fr, amplitude, phase1Ref.current));
    setWave2(buildWavePath(size, size, clamp(fr - 0.02, 0, 1), amplitude * 0.7, phase2Ref.current));
  }, [size, amplitude, fillRatio]);

  useEffect(() => {
    frameRef.current = setInterval(tickWave, 50); // 20fps — smooth enough, low CPU
    return () => {
      if (frameRef.current) clearInterval(frameRef.current);
    };
  }, [tickWave]);

  const percentLabel = useMemo(() => `${Math.round(safeProgress * 100)}%`, [safeProgress]);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          ...(glow && Platform.OS === 'ios'
            ? { shadowColor: wave1Color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24 }
            : {}),
          ...(glow && Platform.OS === 'android'
            ? { elevation: 12 }
            : {}),
        },
        style,
      ]}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <ClipPath id="ringClip">
            <Circle cx={half} cy={half} r={radiusVal} />
          </ClipPath>
          <LinearGradient id="wg1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={wave1Color} stopOpacity="1" />
            <Stop offset="1" stopColor={isCelebrating ? wave1Color : frontWaveColor} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="wg2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={wave2Color} stopOpacity="0.5" />
            <Stop offset="1" stopColor={wave2Color} stopOpacity="0.5" />
          </LinearGradient>
        </Defs>

        {/* bg circle — surface color */}
        <Circle cx={half} cy={half} r={radiusVal} fill={surfaceColor} />

        {/* back wave */}
        <Path d={wave2} fill="url(#wg2)" clipPath="url(#ringClip)" />

        {/* front wave */}
        <Path d={wave1} fill="url(#wg1)" clipPath="url(#ringClip)" />

        {/* border ring — dashed when empty */}
        <Circle
          cx={half} cy={half} r={radiusVal}
          stroke={ringColor}
          strokeWidth={isEmpty ? 1.5 : 2}
          strokeDasharray={isEmpty ? '8 6' : undefined}
          fill="none"
          opacity={isEmpty ? 0.5 : 0.7}
        />
      </Svg>

      {/* center text — colors adapt based on wave fill level vs text position */}
      <View pointerEvents="none" style={{ alignItems: 'center' }}>
        <Text
          variant="caption"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 2,
            fontSize: 10,
            color: centerSubColor,
          }}
        >
          {isEmpty ? 'Tap to add' : 'Today'}
        </Text>
        <Text
          variant="display"
          weight="bold"
          style={{
            fontSize: size * 0.2,
            lineHeight: size * 0.24,
            color: centerTextColor,
            textShadowColor: waveCoversText && !isEmpty ? 'rgba(0,0,0,0.22)' : 'transparent',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: waveCoversText && !isEmpty ? 4 : 0,
          }}
        >
          {isEmpty ? `${(goalMl / 1000).toFixed(1)}L` : `${mlToLiters(currentMl, 1)}L`}
        </Text>
        <Text variant="caption" style={{ color: centerSubColor }}>
          {isEmpty ? 'goal for today' : `of ${mlToLiters(goalMl, 1)}L`}
        </Text>
        <View
          style={{
            marginTop: 6,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: pillBg,
          }}
        >
          <Text variant="caption" weight="semibold" style={{ color: pillTextColor, fontSize: 11 }}>
            {percentLabel}
          </Text>
        </View>
      </View>
    </View>
  );
});
