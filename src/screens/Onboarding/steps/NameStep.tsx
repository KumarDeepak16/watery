// name input step.

import { useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { isValidName } from '@/utils/validators';

export interface NameStepProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function NameStep({
  value,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: NameStepProps): JSX.Element {
  const valid = isValidName(value);

  const handleSubmit = useCallback(() => {
    if (valid) onNext();
  }, [valid, onNext]);

  return (
    <OnboardingStep
      title="What should we call you?"
      subtitle="A friendly name keeps things personal."
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canAdvance={valid}
      iconName="hand-left-outline"
    >
      <Animated.View entering={FadeInUp.duration(420).delay(120)}>
        <View className="mt-2">
          <Text variant="caption" muted className="mb-2 ml-1 uppercase tracking-wider">
            Your Name
          </Text>
          <Input
            value={value}
            onChangeText={onChange}
            placeholder="e.g. Deepak"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            maxLength={32}
            autoFocus
          />
        </View>
      </Animated.View>
    </OnboardingStep>
  );
}
