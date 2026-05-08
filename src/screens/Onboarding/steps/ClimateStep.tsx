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
import type { Climate } from '@/constants/app';

export interface ClimateStepProps {
  value: Climate;
  onChange: (v: Climate) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

interface OptionDef {
  id: Climate;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  extra: string; // ml adjustment label
}

const OPTIONS: OptionDef[] = [
  { id: 'temperate', label: 'Temperate', desc: 'Mild seasons, mostly indoors', icon: 'partly-sunny-outline', extra: 'Baseline' },
  { id: 'hot',       label: 'Hot',       desc: 'Warm days, sweating often',   icon: 'sunny-outline',        extra: '+300ml' },
  { id: 'humid',     label: 'Tropical',  desc: 'Humid heat year-round',       icon: 'thermometer-outline',  extra: '+500ml' },
];

function OptionRow({ option, selected, onPress, delay }: {
  option: OptionDef; selected: boolean; onPress: () => void; delay: number;
}): JSX.Element {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {}, [selected]);

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
        <View style={{
          width: 38, height: 38, borderRadius: 12,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: selected ? colors.primaryGlow : (isDark ? 'rgba(255,255,255,0.06)' : '#F0F4F8'),
        }}>
          <Ionicons name={option.icon} size={19} color={selected ? colors.primary : colors.textMuted} />
        </View>

        <View style={{ flex: 1 }}>
          <Text variant="caption" weight="semibold" color={selected ? colors.primary : colors.text}>
            {option.label}
          </Text>
          <Text variant="micro" muted style={{ marginTop: 1 }}>{option.desc}</Text>
        </View>

        {/* Adjustment badge */}
        <View style={{
          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
          backgroundColor: selected ? colors.primaryGlow : (isDark ? 'rgba(255,255,255,0.06)' : '#F0F4F8'),
        }}>
          <Text variant="micro" weight="semibold" color={selected ? colors.primary : colors.textMuted}>
            {option.extra}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function ClimateStep({ value, onChange, onNext, onBack, stepIndex, totalSteps }: ClimateStepProps): JSX.Element {
  const haptics = useHaptics();

  return (
    <OnboardingStep
      title="Your climate"
      subtitle="Heat and humidity raise your hydration needs."
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canAdvance
      iconName="thermometer-outline"
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
