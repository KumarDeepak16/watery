// slide-in toast for newly unlocked badges. auto-dismiss after delay.

import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { springs } from '@/theme';
import type { Badge } from '@/storage/types';

export interface AchievementToastProps {
  badge: Badge | null;
  onDismiss: () => void;
  durationMs?: number;
}

export function AchievementToast({
  badge,
  onDismiss,
  durationMs = 4200,
}: AchievementToastProps): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const ty = useSharedValue(-180);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!badge) return;
    haptics.success();
    ty.value = withSpring(0, springs.gentle);
    opacity.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    const id = setTimeout(() => {
      ty.value = withTiming(-180, { duration: 280, easing: Easing.in(Easing.cubic) });
      opacity.value = withDelay(
        80,
        withTiming(0, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onDismiss)();
        }),
      );
    }, durationMs);
    return () => clearTimeout(id);
  }, [badge, durationMs, haptics, opacity, ty, onDismiss]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: opacity.value,
  }));

  if (!badge) return <View />;

  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
    >
      <Animated.View style={[{ marginHorizontal: 14, marginTop: 8 }, animStyle]}>
        <Pressable onPress={onDismiss}>
          <GlassCard style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
                    fill="#ffffff"
                  />
                </Svg>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="caption" muted className="uppercase tracking-wider">
                  Achievement Unlocked
                </Text>
                <Text variant="h4" weight="semibold" className="mt-0.5">
                  {badge.name}
                </Text>
                {badge.description ? (
                  <Text variant="caption" muted className="mt-0.5" numberOfLines={2}>
                    {badge.description}
                  </Text>
                ) : null}
              </View>
            </View>
          </GlassCard>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}
