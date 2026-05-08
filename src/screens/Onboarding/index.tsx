// onboarding controller. 8-step state machine. slide horiz between steps.

import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { useHaptics } from '@/hooks/useHaptics';
import { useUserStore } from '@/stores/useUserStore';
import { calculateDailyGoal } from '@/services/analyticsService';
import type { ActivityLevel, Climate, Gender } from '@/constants/app';

import { ActivityStep } from './steps/ActivityStep';
import { AgeGenderStep } from './steps/AgeGenderStep';
import { BodyMetricsStep } from './steps/BodyMetricsStep';
import { ClimateStep } from './steps/ClimateStep';
import { GoalRevealStep } from './steps/GoalRevealStep';
import { NameStep } from './steps/NameStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { WelcomeStep } from './steps/WelcomeStep';

// step ids in order
const STEPS = [
  'welcome',
  'name',
  'ageGender',
  'body',
  'activity',
  'climate',
  'schedule',
  'reveal',
] as const;
type StepId = (typeof STEPS)[number];

// progress data shape
export interface OnboardingDraft {
  name: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  units: 'metric' | 'imperial';
  activity: ActivityLevel;
  climate: Climate;
  wakeHour: number;
  sleepHour: number;
  goalMl: number;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  name: '',
  age: 28,
  gender: 'prefer-not-to-say',
  weightKg: 70,
  heightCm: 170,
  units: 'metric',
  activity: 'moderate',
  climate: 'temperate',
  wakeHour: 7,
  sleepHour: 22,
  goalMl: 2500,
};

export default function OnboardingScreen(): JSX.Element {
  const router = useRouter();
  const haptics = useHaptics();
  const setProfile = useUserStore((s) => s.setProfile);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT);

  const stepId: StepId = STEPS[stepIdx];

  const update = useCallback(
    (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch })),
    [],
  );

  const next = useCallback(() => {
    haptics.selection();
    if (stepIdx >= STEPS.length - 1) return;
    // pre-compute goal at last input step before reveal
    if (STEPS[stepIdx + 1] === 'reveal') {
      const goalMl = calculateDailyGoal({
        weightKg: draft.weightKg,
        activity: draft.activity,
        climate: draft.climate,
        age: draft.age,
        gender: draft.gender,
      });
      setDraft((d) => ({ ...d, goalMl }));
    }
    setStepIdx((i) => i + 1);
  }, [stepIdx, draft, haptics]);

  const back = useCallback(() => {
    haptics.selection();
    if (stepIdx <= 0) return;
    setStepIdx((i) => i - 1);
  }, [stepIdx, haptics]);

  const finish = useCallback(async () => {
    haptics.success();
    await setProfile({
      name: draft.name.trim() || 'Friend',
      age: draft.age,
      gender: draft.gender,
      weightKg: draft.weightKg,
      heightCm: draft.heightCm,
      units: draft.units,
      activity: draft.activity,
      climate: draft.climate,
      wakeHour: draft.wakeHour,
      sleepHour: draft.sleepHour,
      dailyGoalMl: draft.goalMl,
    });
    await completeOnboarding();
    router.replace('/(tabs)/home');
  }, [draft, setProfile, completeOnboarding, router, haptics]);

  // anim presets
  const enter = useMemo(
    () => SlideInRight.duration(360).easing(Easing.out(Easing.cubic)),
    [],
  );
  const exit = useMemo(
    () => SlideOutLeft.duration(280).easing(Easing.in(Easing.cubic)),
    [],
  );

  const stepNode = useMemo(() => {
    switch (stepId) {
      case 'welcome':
        return <WelcomeStep onNext={next} />;
      case 'name':
        return (
          <NameStep
            value={draft.name}
            onChange={(name) => update({ name })}
            onNext={next}
            onBack={back}
            stepIndex={stepIdx}
            totalSteps={STEPS.length}
          />
        );
      case 'ageGender':
        return (
          <AgeGenderStep
            age={draft.age}
            gender={draft.gender}
            onChange={update}
            onNext={next}
            onBack={back}
            stepIndex={stepIdx}
            totalSteps={STEPS.length}
          />
        );
      case 'body':
        return (
          <BodyMetricsStep
            weightKg={draft.weightKg}
            heightCm={draft.heightCm}
            units={draft.units}
            onChange={update}
            onNext={next}
            onBack={back}
            stepIndex={stepIdx}
            totalSteps={STEPS.length}
          />
        );
      case 'activity':
        return (
          <ActivityStep
            value={draft.activity}
            onChange={(activity) => update({ activity })}
            onNext={next}
            onBack={back}
            stepIndex={stepIdx}
            totalSteps={STEPS.length}
          />
        );
      case 'climate':
        return (
          <ClimateStep
            value={draft.climate}
            onChange={(climate) => update({ climate })}
            onNext={next}
            onBack={back}
            stepIndex={stepIdx}
            totalSteps={STEPS.length}
          />
        );
      case 'schedule':
        return (
          <ScheduleStep
            wakeHour={draft.wakeHour}
            sleepHour={draft.sleepHour}
            onChange={update}
            onNext={next}
            onBack={back}
            stepIndex={stepIdx}
            totalSteps={STEPS.length}
          />
        );
      case 'reveal':
        return <GoalRevealStep goalMl={draft.goalMl} name={draft.name} onFinish={finish} />;
    }
  }, [stepId, draft, stepIdx, update, next, back, finish]);

  return (
    <GradientBackground>
      <View className="flex-1">
        <Animated.View
          key={stepId}
          entering={enter}
          exiting={exit}
          className="flex-1"
          style={{ width: '100%' }}
        >
          <Animated.View
            entering={FadeIn.duration(220).delay(60)}
            exiting={FadeOut.duration(120)}
            className="flex-1"
          >
            {stepNode}
          </Animated.View>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}
