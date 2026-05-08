// body metrics step. weight + height with unit toggle.

import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { NumberStepper } from '@/components/ui/NumberStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { isValidWeightKg, isValidHeightCm } from '@/utils/validators';
import type { OnboardingDraft } from '../index';

export interface BodyMetricsStepProps {
  weightKg: number;
  heightCm: number;
  units: 'metric' | 'imperial';
  onChange: (patch: Partial<OnboardingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

const UNIT_SEGMENTS = [
  { id: 'metric', label: 'Metric' },
  { id: 'imperial', label: 'Imperial' },
] as const;

// conv helpers
const lbToKg = (lb: number) => Math.round(lb * 0.45359237);
const kgToLb = (kg: number) => Math.round(kg / 0.45359237);
const inToCm = (inch: number) => Math.round(inch * 2.54);
const cmToIn = (cm: number) => Math.round(cm / 2.54);

export function BodyMetricsStep({
  weightKg,
  heightCm,
  units,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: BodyMetricsStepProps): JSX.Element {
  const valid = isValidWeightKg(weightKg) && isValidHeightCm(heightCm);

  const display = useMemo(() => {
    if (units === 'metric') {
      return {
        weight: weightKg,
        weightUnit: 'kg',
        weightMin: 30,
        weightMax: 250,
        weightStep: 1,
        height: heightCm,
        heightUnit: 'cm',
        heightMin: 100,
        heightMax: 230,
        heightStep: 1,
      };
    }
    return {
      weight: kgToLb(weightKg),
      weightUnit: 'lb',
      weightMin: 66,
      weightMax: 550,
      weightStep: 1,
      height: cmToIn(heightCm),
      heightUnit: 'in',
      heightMin: 39,
      heightMax: 90,
      heightStep: 1,
    };
  }, [units, weightKg, heightCm]);

  return (
    <OnboardingStep
      title="Your body metrics"
      subtitle="Hydration scales with your size."
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canAdvance={valid}
      iconName="body-outline"
    >
      <Animated.View entering={FadeInUp.duration(380).delay(60)} style={{ marginTop: 14 }}>
        <SegmentedControl
          segments={[...UNIT_SEGMENTS]}
          value={units}
          onChange={(id) => onChange({ units: id as 'metric' | 'imperial' })}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(380).delay(140)} style={{ marginTop: 16 }}>
        <Text variant="micro" muted style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Weight
        </Text>
        <NumberStepper
          value={display.weight}
          min={display.weightMin}
          max={display.weightMax}
          step={display.weightStep}
          unit={display.weightUnit}
          onChange={(v) => onChange({ weightKg: units === 'metric' ? v : lbToKg(v) })}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(380).delay(220)} style={{ marginTop: 14 }}>
        <Text variant="micro" muted style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Height
        </Text>
        <NumberStepper
          value={display.height}
          min={display.heightMin}
          max={display.heightMax}
          step={display.heightStep}
          unit={display.heightUnit}
          onChange={(v) => onChange({ heightCm: units === 'metric' ? v : inToCm(v) })}
        />
      </Animated.View>
    </OnboardingStep>
  );
}
