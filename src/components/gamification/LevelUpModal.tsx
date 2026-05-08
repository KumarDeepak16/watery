// fullscreen level up celebration. confetti + scale-in level number + perks list.

import { useEffect, useRef } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { springs } from '@/theme';

export interface LevelUpEvent {
  level: number;
  perks?: ReadonlyArray<string>;
}

export interface LevelUpModalProps {
  event: LevelUpEvent | null;
  onClose: () => void;
}

export function LevelUpModal({ event, onClose }: LevelUpModalProps): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const confettiRef = useRef<ConfettiCannon>(null);
  const scale = useSharedValue(0.5);
  const halo = useSharedValue(0);
  const visible = !!event;

  useEffect(() => {
    if (!visible) return;
    haptics.success();
    scale.value = withSequence(
      withSpring(1.15, { ...springs.bouncy, mass: 0.8 }),
      withSpring(1, springs.snappy),
    );
    halo.value = withDelay(
      120,
      withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }),
    );
    const t = setTimeout(() => confettiRef.current?.start(), 200);
    return () => clearTimeout(t);
  }, [visible, haptics, scale, halo]);

  const numStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.55 - halo.value * 0.55,
    transform: [{ scale: 0.7 + halo.value * 0.7 }],
  }));

  if (!visible || !event) return <View />;

  const { width, height } = Dimensions.get('window');

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(180)}
        style={{ flex: 1, backgroundColor: 'rgba(5,12,24,0.74)' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    width: 240,
                    height: 240,
                    borderRadius: 120,
                    backgroundColor: theme.colors.primaryGlow,
                  },
                  haloStyle,
                ]}
              />
              <Animated.View style={numStyle}>
                <Text
                  variant="display"
                  weight="bold"
                  align="center"
                  style={{ fontSize: 120, lineHeight: 128, color: theme.colors.primary }}
                >
                  {event.level}
                </Text>
              </Animated.View>
              <Text variant="caption" muted align="center" className="mt-2 uppercase tracking-widest">
                Level Up
              </Text>
            </View>

            <GlassCard className="mt-8 p-5" style={{ width: '100%' }}>
              <Text variant="h3" weight="semibold" align="center">
                You reached Level {event.level}!
              </Text>
              {event.perks && event.perks.length > 0 ? (
                <View style={{ marginTop: 12, gap: 6 }}>
                  {event.perks.map((p) => (
                    <Text key={p} variant="body" align="center">
                      ✦ {p}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text variant="body" muted align="center" style={{ marginTop: 6 }}>
                  Keep flowing — bigger goals ahead.
                </Text>
              )}
            </GlassCard>

            <Button
              title="Continue"
              variant="primary"
              size="lg"
              fullWidth
              onPress={onClose}
              style={{ marginTop: 24 }}
            />
          </View>
        </Pressable>

        <ConfettiCannon
          ref={confettiRef}
          count={140}
          origin={{ x: width / 2, y: 0 }}
          autoStart={false}
          fadeOut
          explosionSpeed={380}
          fallSpeed={2800}
          colors={[theme.colors.primary, theme.colors.water, theme.colors.accent, theme.colors.gradientStart]}
        />
      </Animated.View>
    </Modal>
  );
}
