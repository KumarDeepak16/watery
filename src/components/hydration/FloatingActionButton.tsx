// FAB at bottom right. press scale + haptic. long-press expands radial menu of common amounts.

import { useCallback, useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { DEFAULT_AMOUNTS_ML } from '@/constants/app';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { radius, springs } from '@/theme';
import { formatMl } from '@/utils/format';

export interface FloatingActionButtonProps {
  onPress: () => void;
  onQuickAdd?: (ml: number) => void;
  bottom?: number;
  right?: number;
  style?: StyleProp<ViewStyle>;
}

const SIZE = 64;

export function FloatingActionButton({
  onPress,
  onQuickAdd,
  bottom = 110,
  right = 18,
  style,
}: FloatingActionButtonProps): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const expand = useSharedValue(0);
  const rot = useSharedValue(0);

  const handlePress = useCallback(() => {
    if (expanded) {
      setExpanded(false);
      expand.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) });
      rot.value = withTiming(0, { duration: 220 });
      haptics.selection();
      return;
    }
    haptics.medium();
    onPress();
  }, [expanded, expand, rot, haptics, onPress]);

  const handleLong = useCallback(() => {
    haptics.heavy();
    setExpanded(true);
    expand.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    rot.value = withSpring(45, springs.snappy);
  }, [haptics, expand, rot]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[{ position: 'absolute', bottom, right }, style]}
    >
      {/* radial options */}
      {DEFAULT_AMOUNTS_ML.map((ml, i) => {
        const stylish = useAnimatedStyle(() => {
          const distance = 92 + i * 4;
          const angle = (90 + i * 30) * (Math.PI / 180); // up-left
          const tx = -Math.cos(angle) * distance * expand.value;
          const ty = -Math.sin(angle) * distance * expand.value;
          return {
            transform: [{ translateX: tx }, { translateY: ty }, { scale: expand.value }],
            opacity: expand.value,
          };
        });
        return (
          <Animated.View
            key={ml}
            style={[
              {
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceElevated,
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              },
              stylish,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${ml}ml`}
              onPress={() => {
                haptics.medium();
                onQuickAdd?.(ml);
                setExpanded(false);
                expand.value = withTiming(0, { duration: 220 });
                rot.value = withTiming(0, { duration: 220 });
              }}
              style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text variant="caption" weight="semibold" color={theme.colors.primary}>
                {formatMl(ml)}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}

      <Animated.View style={fabStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log water"
          onPressIn={() => (scale.value = withSpring(0.92, springs.snappy))}
          onPressOut={() => (scale.value = withSpring(1, springs.snappy))}
          onPress={handlePress}
          onLongPress={handleLong}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.55,
            shadowRadius: 18,
            elevation: 14,
          }}
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14 M5 12h14"
              stroke="#ffffff"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      </Animated.View>
    </View>
  );
}
