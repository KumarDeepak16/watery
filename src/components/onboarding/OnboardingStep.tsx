import { type ReactNode, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';

export interface OnboardingStepProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  canAdvance?: boolean;
  nextLabel?: string;
  children: ReactNode;
}

export function OnboardingStep({
  title,
  subtitle,
  iconName,
  emoji,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  canAdvance = true,
  nextLabel = 'Continue',
  children,
}: OnboardingStepProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();

  const dots = useMemo(
    () => Array.from({ length: totalSteps }, (_, i) => i),
    [totalSteps],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#080D1A' : '#F8FBFE' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}>

        {/* Progress dots + back row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          {onBack && stepIndex > 0 ? (
            <Pressable
              onPress={() => { haptics.selection(); onBack(); }}
              hitSlop={10}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="chevron-back" size={16} color={theme.colors.textMuted} />
              <Text variant="caption" muted>Back</Text>
            </Pressable>
          ) : (
            <View style={{ width: 48 }} />
          )}

          {/* dots centered */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {dots.map((d) => {
              const active = d === stepIndex;
              const done = d < stepIndex;
              return (
                <View
                  key={d}
                  style={{
                    width: active ? 20 : 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: active
                      ? theme.colors.primary
                      : done
                        ? theme.colors.accent
                        : theme.colors.divider,
                  }}
                />
              );
            })}
          </View>

          <View style={{ width: 48 }} />
        </View>

        {/* Title block — compact */}
        <Animated.View entering={FadeInDown.duration(380)} style={{ marginTop: 20, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {iconName ? (
              <View style={{
                width: 34, height: 34, borderRadius: 10,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: theme.colors.primaryGlow,
              }}>
                <Ionicons name={iconName} size={18} color={theme.colors.primary} />
              </View>
            ) : emoji ? (
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
            ) : null}
            <Text variant="h2" weight="bold">{title}</Text>
          </View>
          {subtitle ? (
            <Text variant="body" muted>{subtitle}</Text>
          ) : null}
        </Animated.View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        >
          {children}
        </ScrollView>

        <Button
          title={nextLabel}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canAdvance}
          onPress={onNext}
        />
      </View>
    </SafeAreaView>
  );
}
