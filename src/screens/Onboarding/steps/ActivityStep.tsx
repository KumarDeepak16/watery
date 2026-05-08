import { Pressable, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import type { ActivityLevel } from '@/constants/app';

export interface ActivityStepProps {
  value: ActivityLevel;
  onChange: (v: ActivityLevel) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

interface OptionDef {
  id: ActivityLevel;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPTIONS: OptionDef[] = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Mostly sitting', icon: 'laptop-outline' },
  { id: 'light',     label: 'Light',     desc: 'Walks & light chores', icon: 'walk-outline' },
  { id: 'active',    label: 'Active',    desc: 'Workouts 3–5×/week', icon: 'bicycle-outline' },
  { id: 'athlete',   label: 'Athlete',   desc: 'Daily intense training', icon: 'barbell-outline' },
];

function OptionRow({ option, selected, onPress, delay }: {
  option: OptionDef; selected: boolean; onPress: () => void; delay: number;
}): JSX.Element {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    borderOpacity.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, borderOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.duration(320).delay(delay)} style={animStyle}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.97, { damping: 20 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 20 }))}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 13,
          paddingHorizontal: 16,
          borderRadius: 16,
          backgroundColor: selected
            ? (isDark ? 'rgba(56,189,248,0.12)' : 'rgba(0,119,182,0.07)')
            : (isDark ? '#111827' : '#FFFFFF'),
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.primary : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'),
        }}
      >
        {/* Icon */}
        <View style={{
          width: 38, height: 38, borderRadius: 12,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: selected ? colors.primaryGlow : (isDark ? 'rgba(255,255,255,0.06)' : '#F0F4F8'),
        }}>
          <Ionicons name={option.icon} size={19} color={selected ? colors.primary : colors.textMuted} />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text variant="caption" weight="semibold" color={selected ? colors.primary : colors.text}>
            {option.label}
          </Text>
          <Text variant="micro" muted style={{ marginTop: 1 }}>{option.desc}</Text>
        </View>

        {/* Check */}
        {selected ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.divider }} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export function ActivityStep({ value, onChange, onNext, onBack, stepIndex, totalSteps }: ActivityStepProps): JSX.Element {
  const haptics = useHaptics();

  return (
    <OnboardingStep
      title="How active are you?"
      subtitle="More movement = more water needed."
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canAdvance
      iconName="fitness-outline"
    >
      <View style={{ gap: 8, marginTop: 12 }}>
        {OPTIONS.map((opt, i) => (
          <OptionRow
            key={opt.id}
            option={opt}
            selected={value === opt.id}
            delay={60 * i}
            onPress={() => { haptics.light(); onChange(opt.id); }}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
