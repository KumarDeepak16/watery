import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { NumberStepper } from '@/components/ui/NumberStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { GENDER_OPTIONS, type Gender } from '@/constants/app';
import { isValidAge } from '@/utils/validators';
import type { OnboardingDraft } from '../index';

export interface AgeGenderStepProps {
  age: number;
  gender: Gender;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

const GENDER_SEGMENTS = GENDER_OPTIONS.filter((o) => o.id !== 'prefer-not-to-say').map((o) => ({
  id: o.id,
  label: o.label,
}));

export function AgeGenderStep({
  age, gender, onChange, onNext, onBack, stepIndex, totalSteps,
}: AgeGenderStepProps): JSX.Element {
  const valid = isValidAge(age);

  return (
    <OnboardingStep
      title="About you"
      subtitle="Used to calculate your personal goal."
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canAdvance={valid}
      iconName="person-outline"
    >
      <Animated.View entering={FadeInUp.duration(380).delay(60)} style={{ marginTop: 14 }}>
        <Text variant="micro" muted style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Age
        </Text>
        <NumberStepper
          value={age}
          min={10}
          max={110}
          step={1}
          unit="years"
          onChange={(v) => onChange({ age: v })}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(380).delay(140)} style={{ marginTop: 18 }}>
        <Text variant="micro" muted style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Gender
        </Text>
        <SegmentedControl
          segments={GENDER_SEGMENTS}
          value={gender as 'male' | 'female' | 'other'}
          onChange={(id) => onChange({ gender: id as Gender })}
        />
      </Animated.View>
    </OnboardingStep>
  );
}
