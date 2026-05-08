// schedule step. wake + sleep time pickers.

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import type { OnboardingDraft } from '../index';

export interface ScheduleStepProps {
  wakeHour: number;
  sleepHour: number;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

// hour helpers
const hourToDate = (h: number): Date => {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d;
};
const formatHour = (h: number): string => {
  const date = hourToDate(h);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

interface TimeRowProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  hour: number;
  open: boolean;
  onToggle: () => void;
  onChange: (h: number) => void;
}

function TimeRow({ label, iconName, hour, open, onToggle, onChange }: TimeRowProps): JSX.Element {
  const { colors } = useTheme();

  const handleChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') {
        if (event.type === 'set' && date) onChange(date.getHours());
        onToggle(); // close on android
      } else if (date) {
        onChange(date.getHours());
      }
    },
    [onChange, onToggle],
  );

  return (
    <GlassCard className="p-4">
      <Pressable onPress={onToggle} className="flex-row items-center">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.primaryGlow }}
        >
          <Ionicons name={iconName} size={22} color={colors.primary} />
        </View>
        <View className="ml-4 flex-1">
          <Text variant="caption" muted className="uppercase tracking-wider">
            {label}
          </Text>
          <Text variant="h3" className="mt-0.5">
            {formatHour(hour)}
          </Text>
        </View>
      </Pressable>
      {open ? (
        <View className="mt-3">
          <DateTimePicker
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            value={hourToDate(hour)}
            onChange={handleChange}
            minuteInterval={30}
          />
        </View>
      ) : null}
    </GlassCard>
  );
}

export function ScheduleStep({
  wakeHour,
  sleepHour,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: ScheduleStepProps): JSX.Element {
  const haptics = useHaptics();
  const [openId, setOpenId] = useState<'wake' | 'sleep' | null>(null);
  const valid = wakeHour < sleepHour;

  return (
    <OnboardingStep
      title="When are you awake?"
      subtitle="We'll only remind you during your day."
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canAdvance={valid}
      iconName="time-outline"
    >
      <View className="mt-4 gap-3">
        <Animated.View entering={FadeInUp.duration(380).delay(80)}>
          <TimeRow
            label="Wake time"
            iconName="sunny-outline"
            hour={wakeHour}
            open={openId === 'wake'}
            onToggle={() => {
              haptics.selection();
              setOpenId((p) => (p === 'wake' ? null : 'wake'));
            }}
            onChange={(h) => onChange({ wakeHour: h })}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(380).delay(160)}>
          <TimeRow
            label="Sleep time"
            iconName="moon-outline"
            hour={sleepHour}
            open={openId === 'sleep'}
            onToggle={() => {
              haptics.selection();
              setOpenId((p) => (p === 'sleep' ? null : 'sleep'));
            }}
            onChange={(h) => onChange({ sleepHour: h })}
          />
        </Animated.View>

        {!valid ? (
          <Animated.View entering={FadeInUp.duration(280)}>
            <Text variant="caption" className="ml-1 mt-2 text-amber-500">
              Sleep time must be after wake time.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </OnboardingStep>
  );
}
