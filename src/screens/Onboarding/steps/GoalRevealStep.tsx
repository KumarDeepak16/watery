// goal reveal step. animated number, drop, CTA.

import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { WaterDropMascot } from '@/components/hydration/WaterDropMascot';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { mlToLiters } from '@/utils/format';

export interface GoalRevealStepProps {
  goalMl: number;
  name: string;
  onFinish: () => void;
}

export function GoalRevealStep({ goalMl, name, onFinish }: GoalRevealStepProps): JSX.Element {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const confettiRef = useRef<ConfettiCannon>(null);

  // animate liters number 0 → final
  const liters = useSharedValue(0);
  const dropScale = useSharedValue(0.4);
  const halo = useSharedValue(0);

  useEffect(() => {
    haptics.success();
    liters.value = withDelay(
      280,
      withTiming(goalMl / 1000, { duration: 1400, easing: Easing.out(Easing.cubic) }),
    );
    dropScale.value = withDelay(
      120,
      withSequence(
        withTiming(1.1, { duration: 480, easing: Easing.out(Easing.back(1.4)) }),
        withTiming(1, { duration: 240 }),
      ),
    );
    halo.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400 }),
          withTiming(0, { duration: 1400 }),
        ),
        -1,
        false,
      ),
    );
    const t = setTimeout(() => confettiRef.current?.start(), 320);
    return () => clearTimeout(t);
  }, [goalMl, haptics, liters, dropScale, halo]);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dropScale.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.55 - halo.value * 0.55,
    transform: [{ scale: 0.8 + halo.value * 0.6 }],
  }));

  // animated text bridge: render via derived static label, sample
  const [display, setDisplay] = [useSharedValue(0), null] as const;

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-between px-6 py-8">
        <Animated.View entering={FadeInDown.duration(420)} className="items-center pt-4">
          <Text variant="caption" muted className="uppercase tracking-widest">
            {name ? `${name},` : 'Hello,'} your goal
          </Text>
          <Text variant="h3" className="mt-1">
            is set 💧
          </Text>
        </Animated.View>

        <View className="flex-1 items-center justify-center">
          <View className="relative items-center justify-center">
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  width: 240,
                  height: 240,
                  borderRadius: 120,
                  backgroundColor: colors.primaryGlow,
                },
                haloStyle,
              ]}
            />
            <Animated.View style={dropStyle}>
              <WaterDropMascot size={160} expression="celebrate" />
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInUp.duration(700).delay(420)}
            className="mt-10 items-center"
          >
            <Text variant="caption" muted className="uppercase tracking-widest">
              Daily Hydration Goal
            </Text>
            <View className="mt-2 flex-row items-end">
              <Text
                variant="display"
                style={{ color: colors.primary, fontSize: 84, lineHeight: 88 }}
              >
                {mlToLiters(goalMl, 1)}
              </Text>
              <Text variant="h2" muted className="mb-3 ml-2">
                L
              </Text>
            </View>
            <Text variant="body" muted className="mt-2 text-center">
              That's about {Math.round(goalMl / 250)} cups of water a day.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(700)} className="mt-6 w-full">
            <GlassCard className="p-4">
              <Text variant="caption" muted className="uppercase tracking-wider">
                Why this number?
              </Text>
              <Text variant="body" className="mt-2">
                Calculated from your weight, activity, climate, and schedule. You can adjust it
                anytime from Profile.
              </Text>
            </GlassCard>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.duration(600).delay(900)} className="w-full">
          <Button
            title="Start my journey"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              haptics.success();
              onFinish();
            }}
          />
        </Animated.View>
      </View>

      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{ x: 180, y: 0 }}
        autoStart={false}
        fadeOut
        explosionSpeed={350}
        fallSpeed={2600}
        colors={[colors.primary, colors.water, colors.accent, colors.gradientStart]}
      />
    </SafeAreaView>
  );
}
