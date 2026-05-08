// profile screen. avatar, stats, prefs, achievements, data.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Input } from '@/components/ui/Input';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Header } from '@/components/navigation/Header';
import { BadgeCard } from '@/components/gamification/BadgeCard';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { XpBar } from '@/components/gamification/XpBar';
import { useGamification } from '@/hooks/useGamification';
import { useHaptics } from '@/hooks/useHaptics';
import { useHydration } from '@/hooks/useHydration';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useHydrationStore } from '@/stores/useHydrationStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import {
  ACTIVITY_LEVELS,
  CLIMATE_OPTIONS,
  type ActivityLevel,
  type Climate,
} from '@/constants/app';
import { BADGES } from '@/constants/badges';
import { APP_NAME, VERSION } from '@/constants/app';
import { mlToLiters } from '@/utils/format';

const THEME_SEGMENTS = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
] as const;

function AboutRow({ icon, label, value, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 12 }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="micro" muted>{label}</Text>
        <Text variant="caption" weight={onPress ? 'semibold' : 'regular'} color={onPress ? colors.primary : colors.text} style={{ marginTop: 1 }}>
          {value}
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />}
    </Pressable>
  );
}

export default function ProfileScreen(): JSX.Element {
  const { colors } = useTheme();
  const router = useRouter();
  const haptics = useHaptics();

  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.setProfile);
  const setGoal = useUserStore((s) => s.setDailyGoal);

  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const resetHydration = useHydrationStore((s) => s.resetAll);
  const resetGamification = useGamificationStore((s) => s.resetAll);
  const resetUser = useUserStore((s) => s.resetAll);

  const { allEntries, totalMl } = useHydration();
  const { level, xp, xpForNext, streak, longestStreak, badges } = useGamification();

  // sheets
  const [editOpen, setEditOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  // edit draft
  const [draft, setDraft] = useState(() => ({
    name: profile?.name ?? '',
    weightKg: profile?.weightKg ?? 70,
    heightCm: profile?.heightCm ?? 170,
    activity: (profile?.activity ?? 'moderate') as ActivityLevel,
    climate: (profile?.climate ?? 'temperate') as Climate,
    wakeHour: profile?.wakeHour ?? 7,
    sleepHour: profile?.sleepHour ?? 22,
  }));

  const [goalDraft, setGoalDraft] = useState(profile?.dailyGoalMl ?? 2500);

  const stats = useMemo(
    () => ({
      totalL: mlToLiters(totalMl),
      daysTracked: new Set((allEntries ?? []).map((e) => e.date)).size,
      bestStreak: longestStreak,
      badgesEarned: badges.length,
    }),
    [totalMl, allEntries, longestStreak, badges.length],
  );

  const initials = useMemo(() => {
    const n = (profile?.name ?? 'U').trim();
    return n
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }, [profile?.name]);

  const openEdit = useCallback(() => {
    haptics.selection();
    setDraft({
      name: profile?.name ?? '',
      weightKg: profile?.weightKg ?? 70,
      heightCm: profile?.heightCm ?? 170,
      activity: (profile?.activity ?? 'moderate') as ActivityLevel,
      climate: (profile?.climate ?? 'temperate') as Climate,
      wakeHour: profile?.wakeHour ?? 7,
      sleepHour: profile?.sleepHour ?? 22,
    });
    setEditOpen(true);
  }, [profile, haptics]);

  const saveEdit = useCallback(async () => {
    haptics.success();
    await updateProfile({ ...profile!, ...draft });
    setEditOpen(false);
  }, [profile, draft, updateProfile, haptics]);

  const saveGoal = useCallback(async () => {
    haptics.success();
    await setGoal(goalDraft);
    setGoalOpen(false);
  }, [goalDraft, setGoal, haptics]);

  const handleExport = useCallback(async () => {
    haptics.selection();
    const payload = {
      app: APP_NAME,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      profile,
      entries: allEntries ?? [],
      gamification: { level, xp, streak, longestStreak, badges },
    };
    await Share.share({
      title: `${APP_NAME} export`,
      message: JSON.stringify(payload, null, 2),
    });
  }, [profile, allEntries, level, xp, streak, longestStreak, badges, haptics]);

  const handleReset = useCallback(async () => {
    haptics.warning();
    setResetOpen(false);
    // Reset all in-memory stores first
    await Promise.all([resetHydration(), resetGamification()]);
    await resetUser();
    // Wipe ALL AsyncStorage so rehydrate() on next mount starts fresh
    const { clearAll } = await import('@/storage/mmkv');
    await clearAll();
    // Small delay so cache flush completes before navigation re-mounts root
    await new Promise<void>((r) => setTimeout(r, 80));
    router.replace('/(onboarding)');
  }, [resetHydration, resetGamification, resetUser, router, haptics]);

  // sort badges: unlocked first
  const ownedIds = useMemo(() => new Set(badges.map((b) => b.id)), [badges]);
  const sortedBadges = useMemo(
    () =>
      [...BADGES].sort((a, b) => {
        const oa = ownedIds.has(a.id) ? 0 : 1;
        const ob = ownedIds.has(b.id) ? 0 : 1;
        return oa - ob;
      }),
    [ownedIds],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header
          left={
            <View>
              <Text variant="caption" muted>
                You
              </Text>
              <Text variant="h3" className="mt-0.5">
                Profile
              </Text>
            </View>
          }
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* identity */}
          <Animated.View entering={FadeInDown.duration(420)} className="mt-2 px-6">
            <GlassCard className="p-5">
              <View className="flex-row items-center">
                <View
                  className="h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.primaryGlow }}
                >
                  <Text variant="h2" style={{ color: colors.primary }}>
                    {initials}
                  </Text>
                </View>
                <View className="ml-4 flex-1">
                  <Text variant="h3">{profile?.name ?? 'Friend'}</Text>
                  <Text variant="caption" muted className="mt-0.5">
                    Level {level} · {xp} XP
                  </Text>
                </View>
                <StreakFlame days={streak} />
              </View>
              <View className="mt-4">
                <XpBar xp={xp} xpForNext={xpForNext} level={level} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* stats grid */}
          <Animated.View entering={FadeInDown.duration(420).delay(80)} className="mt-4 px-6">
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <StatCell label="Total intake" value={`${stats.totalL}L`} icon="water-outline" />
              <StatCell label="Days tracked" value={`${stats.daysTracked}`} icon="calendar-outline" />
              <StatCell label="Best streak" value={`${stats.bestStreak}d`} icon="flame-outline" />
              <StatCell label="Badges" value={`${stats.badgesEarned}`} icon="ribbon-outline" />
            </View>
          </Animated.View>

          {/* daily goal */}
          <Animated.View entering={FadeInDown.duration(420).delay(160)} className="mt-4 px-6">
            <GlassCard className="p-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text variant="caption" muted className="uppercase tracking-wider">
                    Daily Goal
                  </Text>
                  <Text variant="h2" className="mt-1">
                    {mlToLiters(profile?.dailyGoalMl ?? 2500)}L
                  </Text>
                </View>
                <Button
                  title="Adjust"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    haptics.selection();
                    setGoalDraft(profile?.dailyGoalMl ?? 2500);
                    setGoalOpen(true);
                  }}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* edit profile */}
          <Animated.View entering={FadeInDown.duration(420).delay(220)} className="mt-4 px-6">
            <Button
              title="Edit profile"
              variant="secondary"
              fullWidth
              icon="person-outline"
              onPress={openEdit}
            />
          </Animated.View>

          {/* theme */}
          <Animated.View entering={FadeInDown.duration(420).delay(280)} className="mt-4 px-6">
            <GlassCard className="p-5">
              <Text variant="caption" muted className="uppercase tracking-wider">
                Appearance
              </Text>
              <View className="mt-3">
                <SegmentedControl
                  segments={[...THEME_SEGMENTS]}
                  value={themeMode}
                  onChange={(id) => {
                    haptics.selection();
                    setThemeMode(id as 'system' | 'light' | 'dark');
                  }}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* achievements */}
          <Animated.View entering={FadeInDown.duration(420).delay(340)} className="mt-5">
            <View className="px-6">
              <Text variant="caption" muted className="uppercase tracking-wider">
                Achievements
              </Text>
              <Text variant="caption" muted className="mt-1">
                {badges.length} of {BADGES.length} earned
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 14, gap: 12 }}
            >
              {sortedBadges.map((b) => (
                <BadgeCard
                  key={b.id}
                  badge={b}
                  unlocked={ownedIds.has(b.id)}
                  onPress={() => haptics.light()}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* preferences */}
          <Animated.View entering={FadeInDown.duration(420).delay(420)} className="mt-2 px-6">
            <GlassCard className="p-2">
              <LinkRow
                label="Reminders"
                hint="Schedule, sounds, snooze"
                iconName="notifications-outline"
                onPress={() => {
                  haptics.selection();
                  router.push('/(tabs)/reminders');
                }}
              />
            </GlassCard>
          </Animated.View>

          {/* data */}
          <Animated.View entering={FadeInDown.duration(420).delay(500)} className="mt-4 px-6">
            <GlassCard className="p-2">
              <LinkRow label="Export data" hint="JSON via Share" iconName="share-outline" onPress={handleExport} />
              <Divider />
              <LinkRow
                label="Reset all data"
                hint="Wipe and restart onboarding"
                iconName="warning-outline"
                danger
                onPress={() => {
                  haptics.warning();
                  setResetOpen(true);
                }}
              />
            </GlassCard>
          </Animated.View>

          {/* about */}
          <Animated.View entering={FadeInDown.duration(420).delay(580)} className="mt-6 px-6 pb-4">
            <GlassCard style={{ padding: 20 }}>
              {/* app identity */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="water" size={24} color={colors.primary} />
                </View>
                <Text variant="h3" weight="bold" align="center">{APP_NAME}</Text>
                <Text variant="small" muted align="center" style={{ marginTop: 2 }}>v{VERSION} · Premium Hydration Tracker</Text>
              </View>

              {/* divider */}
              <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: 16 }} />

              {/* developer info */}
              <AboutRow icon="person-circle-outline" label="Developer" value="Deepak Kumar" />
              <AboutRow icon="mail-outline" label="Email" value="deepakkumar190803@gmail.com" onPress={() => Linking.openURL('mailto:deepakkumar190803@gmail.com')} />
              <AboutRow icon="globe-outline" label="Website" value="1619.in" onPress={() => Linking.openURL('https://1619.in')} />
              <AboutRow icon="logo-linkedin" label="LinkedIn" value="deepakkumar1916" onPress={() => Linking.openURL('https://www.linkedin.com/in/deepakkumar1916/')} />
              <AboutRow icon="logo-github" label="GitHub" value="kumardeepak16" onPress={() => Linking.openURL('https://github.com/kumardeepak16')} />

              {/* divider */}
              <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 14 }} />

              {/* support */}
              <Text variant="caption" weight="semibold" style={{ marginBottom: 8, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Support</Text>
              <AboutRow icon="mail-outline" label="Support Email" value="deepakkumar190803@gmail.com" onPress={() => Linking.openURL('mailto:deepakkumar190803@gmail.com?subject=Watery Support')} />

              {/* bottom caption */}
              <Text variant="micro" muted align="center" style={{ marginTop: 14 }}>
                Built with care for your health journey
              </Text>
            </GlassCard>
          </Animated.View>
        </ScrollView>

        {/* edit profile sheet */}
        <Sheet visible={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
          <ScrollView showsVerticalScrollIndicator={false} className="px-1">
            <Text variant="caption" muted className="mb-2 uppercase tracking-wider">
              Name
            </Text>
            <Input
              value={draft.name}
              onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
              placeholder="Your name"
              autoCapitalize="words"
            />

            <Text variant="caption" muted className="mb-2 mt-5 uppercase tracking-wider">
              Weight (kg)
            </Text>
            <NumberStepper
              value={draft.weightKg}
              min={30}
              max={250}
              step={1}
              unit="kg"
              onChange={(weightKg) => setDraft((d) => ({ ...d, weightKg }))}
            />

            <Text variant="caption" muted className="mb-2 mt-4 uppercase tracking-wider">
              Height (cm)
            </Text>
            <NumberStepper
              value={draft.heightCm}
              min={100}
              max={230}
              step={1}
              unit="cm"
              onChange={(heightCm) => setDraft((d) => ({ ...d, heightCm }))}
            />

            <Text variant="caption" muted className="mb-2 mt-5 uppercase tracking-wider">
              Activity
            </Text>
            <SegmentedControl
              segments={ACTIVITY_LEVELS.map((a) => ({ id: a.id, label: a.label }))}
              value={draft.activity}
              onChange={(id) => setDraft((d) => ({ ...d, activity: id as ActivityLevel }))}
            />

            <Text variant="caption" muted className="mb-2 mt-5 uppercase tracking-wider">
              Climate
            </Text>
            <SegmentedControl
              segments={CLIMATE_OPTIONS.map((c) => ({ id: c.id, label: c.label }))}
              value={draft.climate}
              onChange={(id) => setDraft((d) => ({ ...d, climate: id as Climate }))}
            />

            <Text variant="caption" muted className="mb-2 mt-5 uppercase tracking-wider">
              Wake hour
            </Text>
            <NumberStepper
              value={draft.wakeHour}
              min={0}
              max={23}
              step={1}
              unit="h"
              onChange={(wakeHour) => setDraft((d) => ({ ...d, wakeHour }))}
            />

            <Text variant="caption" muted className="mb-2 mt-4 uppercase tracking-wider">
              Sleep hour
            </Text>
            <NumberStepper
              value={draft.sleepHour}
              min={0}
              max={23}
              step={1}
              unit="h"
              onChange={(sleepHour) => setDraft((d) => ({ ...d, sleepHour }))}
            />

            <Button
              title="Save changes"
              variant="primary"
              size="lg"
              fullWidth
              className="mb-2 mt-7"
              onPress={saveEdit}
            />
          </ScrollView>
        </Sheet>

        {/* goal sheet */}
        <Sheet visible={goalOpen} onClose={() => setGoalOpen(false)} title="Daily goal">
          <View className="px-1 pb-2">
            <Text variant="caption" muted className="mb-3 uppercase tracking-wider">
              Adjust your target
            </Text>
            <NumberStepper
              value={goalDraft}
              min={500}
              max={6000}
              step={50}
              unit="ml"
              onChange={setGoalDraft}
            />
            <Text variant="caption" muted className="mt-3 text-center">
              {mlToLiters(goalDraft)}L per day
            </Text>
            <Button
              title="Save goal"
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              onPress={saveGoal}
            />
          </View>
        </Sheet>

        {/* reset sheet */}
        <Sheet visible={resetOpen} onClose={() => setResetOpen(false)} title="Reset all data?">
          <View className="px-1 pb-2">
            <Text variant="body" muted>
              This wipes your profile, hydration history, badges, and settings. You'll be sent back
              to onboarding. This cannot be undone.
            </Text>
            <Button
              title="Yes, reset everything"
              variant="danger"
              size="lg"
              fullWidth
              className="mt-6"
              onPress={handleReset}
            />
            <Button
              title="Cancel"
              variant="ghost"
              size="lg"
              fullWidth
              className="mt-2"
              onPress={() => setResetOpen(false)}
            />
          </View>
        </Sheet>
    </SafeAreaView>
  );
}

interface StatCellProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function StatCell({ label, value, icon }: StatCellProps): JSX.Element {
  const { colors } = useTheme();
  return (
    <GlassCard
      className="p-4"
      style={{ flexBasis: '48%', flexGrow: 1 }}
    >
      <View className="flex-row items-center">
        <View
          className="h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.primaryGlow }}
        >
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text variant="caption" muted className="ml-2 uppercase tracking-wider">
          {label}
        </Text>
      </View>
      <Text variant="h2" className="mt-2">
        {value}
      </Text>
    </GlassCard>
  );
}

interface LinkRowProps {
  label: string;
  hint?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
}

function LinkRow({ label, hint, iconName, onPress, danger }: LinkRowProps): JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl px-3 py-3 active:opacity-70"
    >
      <View className="flex-row items-center">
        <View
          className="h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: danger ? '#FEE2E2' : colors.primaryGlow }}
        >
          <Ionicons name={iconName} size={18} color={danger ? colors.danger : colors.primary} />
        </View>
        <View className="ml-3">
          <Text variant="body" style={danger ? { color: colors.danger } : undefined}>
            {label}
          </Text>
          {hint ? (
            <Text variant="caption" muted className="mt-0.5">
              {hint}
            </Text>
          ) : null}
        </View>
      </View>
      <Text variant="body" muted>
        ›
      </Text>
    </Pressable>
  );
}

function Divider(): JSX.Element {
  const { colors } = useTheme();
  return <View className="mx-3 h-px" style={{ backgroundColor: colors.divider }} />;
}
