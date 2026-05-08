import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { LastDrinkBadge } from '@/components/hydration/LastDrinkBadge';
import { QuickAddButton } from '@/components/hydration/QuickAddButton';
import { WaterWaveProgress } from '@/components/hydration/WaterWaveProgress';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { AchievementToast } from '@/components/gamification/AchievementToast';
import { useGreeting } from '@/hooks/useGreeting';
import { useHaptics } from '@/hooks/useHaptics';
import { useHydration } from '@/hooks/useHydration';
import { useGamification } from '@/hooks/useGamification';
import { useTheme } from '@/hooks/useTheme';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { audioService } from '@/services/audioService';
import { getInsight, getMotivationalQuote } from '@/services/analyticsService';
import { DEFAULT_AMOUNTS_ML } from '@/constants/app';
import { mlToLiters } from '@/utils/format';
import { percent as pct, clamp } from '@/utils/math';

const { width: W } = Dimensions.get('window');
const RING_SIZE = Math.min(W - 80, 240);

export default function HomeScreen(): JSX.Element {
  const { colors, isDark } = useTheme();
  const haptics = useHaptics();
  const greeting = useGreeting();
  const userName = useUserStore((s) => s.profile?.name ?? 'Friend');
  const themeMode = useThemeStore((s) => s.scheme);
  const cycleTheme = useThemeStore((s) => s.cycle);

  const goalMl = useDailyGoal();
  const { todayTotalMl, lastEntry, addEntry, refresh, todayEntries } = useHydration();
  const { streak, levelUpEvent, latestUnlock, dismissLevelUp, dismissUnlock } = useGamification();

  const [refreshing, setRefreshing] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customMl, setCustomMl] = useState(300);

  const confettiRef = useRef<ConfettiCannon>(null);
  const goalHitFiredRef = useRef(false);

  const percent = useMemo(() => pct(todayTotalMl, goalMl), [todayTotalMl, goalMl]);
  const remainingMl = Math.max(0, goalMl - todayTotalMl);
  const goalDone = remainingMl <= 0;

  useEffect(() => {
    if (percent >= 100 && !goalHitFiredRef.current) {
      goalHitFiredRef.current = true;
      confettiRef.current?.start();
      haptics.success();
    }
    if (percent < 100) goalHitFiredRef.current = false;
  }, [percent, haptics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleAdd = useCallback(async (ml: number) => {
    haptics.medium();
    await audioService.playDrink();
    await addEntry(ml);
  }, [haptics, addEntry]);

  const themeIcon: keyof typeof Ionicons.glyphMap =
    themeMode === 'dark' ? 'moon-outline'
    : themeMode === 'light' ? 'sunny-outline'
    : 'phone-portrait-outline';

  const insight = useMemo(
    () => getInsight({ totalMl: todayTotalMl, goalMl, entries: todayEntries ?? [] }),
    [todayTotalMl, goalMl, todayEntries],
  );
  const quote = useMemo(() => getMotivationalQuote(percent), [percent]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(380)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 6,
          paddingBottom: 2,
        }}
      >
        <View>
          <Text variant="small" muted style={{ letterSpacing: 0.2 }}>
            {greeting}
          </Text>
          <Text variant="h3" weight="bold" style={{ marginTop: 1 }}>
            {userName}
          </Text>
        </View>

        <Pressable
          onPress={() => { haptics.selection(); cycleTheme(); }}
          hitSlop={10}
          accessibilityLabel="Toggle theme"
          accessibilityRole="button"
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name={themeIcon} size={17} color={colors.textMuted} />
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

        {/* ── Water ring hero ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(60)}
          style={{ marginTop: 12, alignItems: 'center' }}
        >
          <WaterWaveProgress
            size={RING_SIZE}
            progress={clamp(percent / 100, 0, 1)}
            currentMl={todayTotalMl}
            goalMl={goalMl}
            glow
          />
        </Animated.View>

        {/* ── Stat row ── */}
        <Animated.View
          entering={FadeInDown.duration(440).delay(140)}
          style={{
            marginTop: 18,
            marginHorizontal: 24,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          {/* Last drink */}
          <View style={[statCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="water-outline" size={15} color={colors.primary} />
            <Text variant="micro" muted style={statLabel}>Last drink</Text>
            <LastDrinkBadge
              entry={lastEntry}
              style={{ borderWidth: 0, backgroundColor: 'transparent', padding: 0 }}
            />
          </View>

          {/* Streak */}
          <View style={[statCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flame-outline" size={15} color={streak > 0 ? colors.warning : colors.textSubtle} />
            <Text variant="micro" muted style={statLabel}>Streak</Text>
            <Text variant="caption" weight="bold" color={streak > 0 ? colors.warning : colors.textMuted}>
              {streak > 0 ? `${streak}d` : '—'}
            </Text>
          </View>

          {/* Remaining */}
          <View style={[
            statCard,
            {
              flex: 1,
              backgroundColor: goalDone ? colors.primaryGlow : colors.surface,
              borderColor: goalDone ? colors.primary : colors.border,
            },
          ]}>
            <Ionicons
              name={goalDone ? 'checkmark-circle' : 'cellular-outline'}
              size={15}
              color={goalDone ? colors.primary : colors.textSubtle}
            />
            <Text variant="micro" muted style={statLabel}>{goalDone ? 'Done' : 'Left'}</Text>
            <Text variant="caption" weight="bold" color={goalDone ? colors.primary : colors.text}>
              {goalDone ? '✓' : `${(remainingMl / 1000).toFixed(1)}L`}
            </Text>
          </View>
        </Animated.View>

        {/* ── Quick add ── */}
        <Animated.View
          entering={FadeInDown.duration(440).delay(220)}
          style={{ marginTop: 20, marginHorizontal: 24 }}
        >
          <Text
            variant="micro"
            muted
            style={{ marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}
          >
            Quick Add
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {DEFAULT_AMOUNTS_ML.map((ml) => (
              <QuickAddButton key={ml} amountMl={ml} onPress={() => handleAdd(ml)} />
            ))}
            <QuickAddButton
              custom
              onPress={() => { haptics.selection(); setCustomOpen(true); }}
            />
          </View>
        </Animated.View>

        {/* ── Insight card ── */}
        <Animated.View
          entering={FadeInUp.duration(440).delay(300)}
          style={{ marginTop: 20, marginHorizontal: 24 }}
        >
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surface,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Label row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={{
                width: 26, height: 26, borderRadius: 13,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.primaryGlow,
              }}>
                <Ionicons name="bulb-outline" size={13} color={colors.primary} />
              </View>
              <Text variant="micro" muted style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Today's Insight
              </Text>
            </View>

            {/* Insight text */}
            <Text variant="body" style={{ marginTop: 10, lineHeight: 21, color: colors.text }}>
              {insight}
            </Text>

            {/* Divider + quote */}
            <View style={{ height: 1, backgroundColor: colors.divider, marginTop: 12, marginBottom: 10 }} />
            <Text
              variant="caption"
              muted
              style={{ fontStyle: 'italic', lineHeight: 18 }}
            >
              "{quote}"
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      {/* ── Confetti ── */}
      <ConfettiCannon
        ref={confettiRef}
        count={100}
        origin={{ x: W / 2, y: 0 }}
        autoStart={false}
        fadeOut
        explosionSpeed={340}
        fallSpeed={2200}
        colors={[colors.primary, colors.water, colors.accent, '#7DD3FC']}
      />

      {/* ── Custom amount sheet ── */}
      <Sheet visible={customOpen} onClose={() => setCustomOpen(false)} title="Custom amount">
        <Text variant="caption" muted style={{ marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          How much did you drink?
        </Text>
        <NumberStepper value={customMl} min={50} max={2000} step={25} unit="ml" onChange={setCustomMl} />
        <Button
          title={`Add ${customMl}ml`}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: 20 }}
          onPress={async () => { await handleAdd(customMl); setCustomOpen(false); }}
        />
      </Sheet>

      {/* ── Gamification overlays ── */}
      {levelUpEvent ? <LevelUpModal event={levelUpEvent} onClose={dismissLevelUp} /> : null}
      {latestUnlock ? <AchievementToast badge={latestUnlock} onDismiss={dismissUnlock} /> : null}

    </SafeAreaView>
  );
}

// Shared stat card base style
const statCard: import('react-native').ViewStyle = {
  height: 76,
  borderRadius: 16,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  paddingHorizontal: 4,
};

const statLabel: import('react-native').TextStyle = {
  letterSpacing: 0.3,
  marginTop: 1,
};
