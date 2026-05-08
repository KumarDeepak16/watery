import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: SW } = Dimensions.get('window');

export interface WelcomeStepProps {
  onNext: () => void;
}

// ─── Clean minimal water drop ─────────────────────────────────────────────────
function WaterDrop({ size = 140 }: { size?: number }) {
  const { theme, isDark } = useTheme();

  const floatY = useSharedValue(0);
  const eyeRy = useSharedValue(5.5);
  const cheekOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Gentle float
    floatY.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    // Blink every 3.5s
    eyeRy.value = withRepeat(
      withSequence(
        withTiming(5.5, { duration: 2800 }),
        withTiming(0.4, { duration: 70, easing: Easing.in(Easing.cubic) }),
        withTiming(5.5, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(5.5, { duration: 500 }),
      ),
      -1,
      false,
    );

    // Cheek pulse
    cheekOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const leftEyeProps = useAnimatedProps(() => ({ ry: eyeRy.value }));
  const rightEyeProps = useAnimatedProps(() => ({ ry: eyeRy.value }));
  const leftCheekProps = useAnimatedProps(() => ({ opacity: cheekOpacity.value }));
  const rightCheekProps = useAnimatedProps(() => ({ opacity: cheekOpacity.value }));

  const top = isDark ? '#7DD3FC' : '#38BDF8';
  const bot = isDark ? '#0369A1' : '#0077B6';

  return (
    <Animated.View style={floatStyle}>
      <Svg width={size} height={size * 1.15} viewBox="0 0 80 96">
        <Defs>
          <LinearGradient id="dg" x1="0.3" y1="0" x2="0.7" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bot} />
          </LinearGradient>
        </Defs>

        {/* Body */}
        <Path
          d="M40 4 C52 22 66 34 66 52 A26 26 0 1 1 14 52 C14 34 28 22 40 4 Z"
          fill="url(#dg)"
        />

        {/* Shine */}
        <Path
          d="M28 16 C25 24 23 34 26 44"
          stroke="#ffffff"
          strokeOpacity={0.4}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />

        {/* Eyes */}
        <AnimatedEllipse cx={30} cy={50} rx={4.5} fill="#ffffff" opacity={0.95} animatedProps={leftEyeProps} />
        <AnimatedEllipse cx={50} cy={50} rx={4.5} fill="#ffffff" opacity={0.95} animatedProps={rightEyeProps} />
        <Circle cx={31} cy={51} r={2.4} fill={bot} />
        <Circle cx={51} cy={51} r={2.4} fill={bot} />
        <Circle cx={31.8} cy={50} r={0.9} fill="#ffffff" opacity={0.85} />
        <Circle cx={51.8} cy={50} r={0.9} fill="#ffffff" opacity={0.85} />

        {/* Smile */}
        <Path
          d="M28 62 Q40 72 52 62"
          stroke="#ffffff"
          strokeOpacity={0.85}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheeks */}
        <AnimatedEllipse cx={18} cy={60} rx={5.5} ry={4} fill="#ffffff" animatedProps={leftCheekProps} />
        <AnimatedEllipse cx={62} cy={60} rx={5.5} ry={4} fill="#ffffff" animatedProps={rightCheekProps} />
      </Svg>
    </Animated.View>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────
export function WelcomeStep({ onNext }: WelcomeStepProps): JSX.Element {
  const haptics = useHaptics();
  const { theme, isDark } = useTheme();

  const btnScale = useSharedValue(0.88);
  useEffect(() => {
    btnScale.value = withDelay(700, withSpring(1, { damping: 18, stiffness: 140 }));
  }, [btnScale]);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#080D1A' : '#F8FBFE' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 28, paddingBottom: 32 }}>

          {/* Top: logo area */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0 }}>

            {/* Drop */}
            <Animated.View entering={FadeIn.duration(700).delay(100)}>
              <WaterDrop size={130} />
            </Animated.View>

            {/* Brand */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(320)}
              style={{ alignItems: 'center', marginTop: 4 }}
            >
              <Text
                variant="display"
                weight="bold"
                align="center"
                style={{ letterSpacing: -0.5 }}
              >
                Watery
              </Text>
              <Animated.View entering={FadeInUp.duration(420).delay(520)}>
                <Text
                  variant="caption"
                  align="center"
                  style={{
                    marginTop: 8,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: theme.colors.primary,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  Hydration Intelligence
                </Text>
              </Animated.View>
            </Animated.View>

          </View>

          {/* Bottom card */}
          <Animated.View
            entering={FadeInUp.duration(480).delay(440)}
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(56,189,248,0.18)'
                : 'rgba(0,119,182,0.10)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.40 : 0.08,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <Text
              variant="h2"
              weight="bold"
              align="center"
              style={{ lineHeight: 30 }}
            >
              Your body needs 2–3L{'\n'}of water every day.
            </Text>

            <Text
              variant="body"
              muted
              align="center"
              style={{ marginTop: 10, lineHeight: 21 }}
            >
              Track intake, build streaks and get{'\n'}smart reminders — all offline.
            </Text>

            <Animated.View style={[{ marginTop: 24 }, btnStyle]}>
              <Button
                title="Get Started"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  haptics.medium();
                  onNext();
                }}
              />
            </Animated.View>

            <Animated.View entering={FadeIn.duration(300).delay(1100)}>
              <Text
                variant="small"
                muted
                align="center"
                style={{ marginTop: 12 }}
              >
                Free forever · No account needed
              </Text>
            </Animated.View>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}
