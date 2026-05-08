// iOS-style segmented control with sliding indicator. layout-driven indicator slides on selection.

import { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { radius, springs } from '@/theme';

import { Text } from './Text';

export interface Segment<T extends string = string> {
  id: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  segments: ReadonlyArray<Segment<T>>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string = string>({
  segments,
  value,
  onChange,
  className,
  style,
}: SegmentedControlProps<T>): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [w, setW] = useState(0);
  const idx = Math.max(0, segments.findIndex((s) => s.id === value));

  const indicatorX = useSharedValue(0);
  const segW = w > 0 ? (w - 8) / segments.length : 0;

  // re-sync indicator whenever index/width changes
  if (segW > 0) indicatorX.value = withSpring(idx * segW, springs.snappy);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: segW,
  }));

  const onLayout = useCallback((e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width), []);

  return (
    <View
      onLayout={onLayout}
      className={className}
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.colors.divider,
          borderRadius: radius['2xl'],
          padding: 4,
          height: 48,
          position: 'relative',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 4,
            borderRadius: radius.xl,
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 6,
            elevation: 3,
          },
          indicatorStyle,
        ]}
      />
      {segments.map((seg) => (
        <Pressable
          key={seg.id}
          onPress={() => {
            if (seg.id === value) return;
            haptics.selection();
            onChange(seg.id);
          }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 40 }}
        >
          <Text
            variant="caption"
            weight={seg.id === value ? 'semibold' : 'medium'}
            color={seg.id === value ? theme.colors.text : theme.colors.textMuted}
          >
            {seg.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
