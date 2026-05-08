// animated water drop logo + tagline reveal. used on splash / welcome.

import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { WaterDropMascot } from '@/components/hydration/WaterDropMascot';

export interface WelcomeAnimationProps {
  brand?: string;
  tagline?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function WelcomeAnimation({
  brand = 'Watery',
  tagline = 'Track. Hydrate. Thrive.',
  size = 180,
  style,
}: WelcomeAnimationProps): JSX.Element {
  const dropY = useSharedValue(0);
  const haloS = useSharedValue(0);

  useEffect(() => {
    dropY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
    haloS.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400 }),
          withTiming(0, { duration: 1400 }),
        ),
        -1,
        false,
      ),
    );
  }, [dropY, haloS]);

  const dropStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dropY.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 - haloS.value * 0.45,
    transform: [{ scale: 0.7 + haloS.value * 0.7 }],
  }));

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <View
        style={{
          width: size + 80,
          height: size + 80,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: size + 40,
              height: size + 40,
              borderRadius: (size + 40) / 2,
              backgroundColor: 'rgba(34,211,238,0.35)',
            },
            haloStyle,
          ]}
        />
        <Animated.View style={dropStyle}>
          <WaterDropMascot size={size} expression="happy" float={false} />
        </Animated.View>
      </View>
      <Animated.View entering={FadeInUp.duration(600).delay(380)} className="mt-6 items-center">
        <Text variant="display" weight="bold" align="center">
          {brand}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.duration(600).delay(560)} className="mt-2">
        <Text variant="caption" muted align="center" className="uppercase tracking-widest">
          {tagline}
        </Text>
      </Animated.View>
    </View>
  );
}
