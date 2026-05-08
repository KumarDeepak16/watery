import { useCallback, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { radius, springs } from '@/theme';

import { Text } from './Text';

export interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  className?: string;
}

const HOLD_INITIAL_DELAY = 380;
const HOLD_ACCELERATE_AT = 6;

// Defined outside component — avoids remount on every parent render (infinity click bug).
interface StepBtnProps {
  dir: 1 | -1;
  label: string;
  bgColor: string;
  onTick: (dir: 1 | -1) => void;
  onHoldStart: (dir: 1 | -1) => void;
  onHoldEnd: () => void;
}

function StepperBtn({ dir, label, bgColor, onTick, onHoldStart, onHoldEnd }: StepBtnProps) {
  const press = useSharedValue(1);
  const animBtn = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  return (
    <Animated.View style={animBtn}>
      <Pressable
        onPressIn={() => {
          press.value = withSpring(0.92, springs.snappy);
          onHoldStart(dir);
        }}
        onPress={() => onTick(dir)}
        onPressOut={() => {
          press.value = withSpring(1, springs.snappy);
          onHoldEnd();
        }}
        accessibilityRole="button"
        accessibilityLabel={dir > 0 ? 'Increment' : 'Decrement'}
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
          shadowColor: bgColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        <Text variant="h2" color="#ffffff" weight="bold">
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function NumberStepper({
  value,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  onChange,
}: NumberStepperProps): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const heldRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldCountRef = useRef(0);
  // Keep a ref to current value so hold loop doesn't capture stale closure
  const valueRef = useRef(value);
  valueRef.current = value;

  const valueScale = useSharedValue(1);

  useEffect(() => {
    valueScale.value = withSequence(
      withTiming(1.06, { duration: 90, easing: Easing.out(Easing.cubic) }),
      withSpring(1, springs.snappy),
    );
  }, [value, valueScale]);

  const clampFn = useCallback(
    (n: number): number => Math.min(max, Math.max(min, n)),
    [min, max],
  );

  const tick = useCallback(
    (dir: 1 | -1) => {
      const cur = valueRef.current;
      const accelerated = heldCountRef.current > HOLD_ACCELERATE_AT ? step * 5 : step;
      const next = clampFn(cur + dir * accelerated);
      if (next !== cur) {
        haptics.selection();
        onChange(next);
      }
    },
    [step, clampFn, haptics, onChange],
  );

  const endHold = useCallback(() => {
    if (heldRef.current) clearTimeout(heldRef.current);
    heldRef.current = null;
    heldCountRef.current = 0;
  }, []);

  const startHold = useCallback(
    (dir: 1 | -1) => {
      endHold();
      heldCountRef.current = 0;
      const loop = () => {
        heldCountRef.current += 1;
        tick(dir);
        const interval = heldCountRef.current > HOLD_ACCELERATE_AT ? 60 : 110;
        heldRef.current = setTimeout(loop, interval);
      };
      heldRef.current = setTimeout(loop, HOLD_INITIAL_DELAY);
    },
    [tick, endHold],
  );

  useEffect(() => () => endHold(), [endHold]);

  const valueAnim = useAnimatedStyle(() => ({ transform: [{ scale: valueScale.value }] }));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderRadius: radius['3xl'],
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <StepperBtn
        dir={-1}
        label="−"
        bgColor={theme.colors.primary}
        onTick={tick}
        onHoldStart={startHold}
        onHoldEnd={endHold}
      />
      <Animated.View style={[{ flex: 1, alignItems: 'center' }, valueAnim]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text variant="display" weight="bold" style={{ fontSize: 44, lineHeight: 48 }}>
            {value}
          </Text>
          {unit ? (
            <Text variant="h4" muted style={{ marginLeft: 6, marginBottom: 6 }}>
              {unit}
            </Text>
          ) : null}
        </View>
      </Animated.View>
      <StepperBtn
        dir={1}
        label="+"
        bgColor={theme.colors.primary}
        onTick={tick}
        onHoldStart={startHold}
        onHoldEnd={endHold}
      />
    </View>
  );
}
