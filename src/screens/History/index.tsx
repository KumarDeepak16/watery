// Analytics / History screen — premium health-app feel.

import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { DailyRhythmChart } from '@/components/charts/DailyRhythmChart';
import { MonthlyHeatmap } from '@/components/charts/MonthlyHeatmap';
import { TrendLine } from '@/components/charts/TrendLine';
import { WeeklyBarChart } from '@/components/charts/WeeklyBarChart';
import { PeakHoursChart } from '@/components/charts/PeakHoursChart';
import { useHaptics } from '@/hooks/useHaptics';
import { useHydration } from '@/hooks/useHydration';
import { useTheme } from '@/hooks/useTheme';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import {
  getWeekData,
  getWeekInsights,
  getPeakHoursForWeek,
  getMonthData,
  getWeeklyTrend,
  getMonthlyHeatmap,
} from '@/services/analyticsService';
import { formatMl } from '@/utils/format';
import { format, addWeeks, addMonths } from 'date-fns';

type TabId = 'week' | 'month' | 'alltime';

const TABS = [
  { id: 'week' as const, label: 'Week' },
  { id: 'month' as const, label: 'Month' },
  { id: 'alltime' as const, label: 'All Time' },
];

// ─── small helper: nicely formatted liters ───────────────────────────────────
const toL = (ml: number): string => {
  if (!Number.isFinite(ml) || ml <= 0) return '0L';
  const v = ml / 1000;
  return `${v < 10 ? v.toFixed(1) : Math.round(v)}L`;
};

// ─── compact stat card ────────────────────────────────────────────────────────
interface StatCardProps {
  value: string;
  label: string;
  accent?: boolean;
  sub?: string;
}

function StatCard({ value, label, accent, sub }: StatCardProps): JSX.Element {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        backgroundColor: accent ? colors.primaryGlow : colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: accent ? colors.border : colors.divider,
      }}
    >
      <Text variant="h3" weight="bold" color={accent ? colors.primary : undefined}>
        {value}
      </Text>
      <Text
        variant="micro"
        muted
        style={{ marginTop: 4, textAlign: 'center', letterSpacing: 0.5 }}
      >
        {label.toUpperCase()}
      </Text>
      {sub ? (
        <Text
          variant="micro"
          muted
          style={{ marginTop: 2, textAlign: 'center', color: colors.textSubtle }}
        >
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

// ─── week nav row ─────────────────────────────────────────────────────────────
interface WeekNavProps {
  weekOffset: number;
  onPrev: () => void;
  onNext: () => void;
}

function WeekNav({ weekOffset, onPrev, onNext }: WeekNavProps): JSX.Element {
  const { colors } = useTheme();
  const haptics = useHaptics();

  const weekLabel = format(
    addWeeks(new Date(), weekOffset),
    'MMM d',
  );
  const isCurrentWeek = weekOffset === 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
      }}
    >
      <Pressable
        onPress={() => { haptics.selection(); onPrev(); }}
        hitSlop={12}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={{ alignItems: 'center' }}>
        <Text variant="caption" weight="semibold">
          Week of {weekLabel}
        </Text>
        {isCurrentWeek ? (
          <Text variant="micro" color={colors.primary} style={{ marginTop: 1 }}>
            Current week
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => { if (!isCurrentWeek) { haptics.selection(); onNext(); } }}
        hitSlop={12}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isCurrentWeek ? colors.divider : colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isCurrentWeek ? 0.4 : 1,
        }}
      >
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

// ─── insight row ──────────────────────────────────────────────────────────────
function InsightRow({ text }: { text: string }): JSX.Element {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 4,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primary,
          marginTop: 7,
          flexShrink: 0,
        }}
      />
      <Text variant="body" style={{ flex: 1, lineHeight: 22 }}>
        {text}
      </Text>
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────
export default function HistoryScreen(): JSX.Element {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const goalMl = useDailyGoal();
  const { allEntries, lifetimeMl, streak, refresh } = useHydration();

  const [tab, setTab] = useState<TabId>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // ── Week view data ───────────────────────────────────────────────────────
  const weekDays = useMemo(
    () => getWeekData(weekOffset, goalMl),
    [weekOffset, goalMl],
  );

  const weekInsights = useMemo(
    () => getWeekInsights(weekOffset, goalMl),
    [weekOffset, goalMl],
  );

  const peakHours = useMemo(
    () => getPeakHoursForWeek(weekOffset),
    [weekOffset],
  );

  const weekAvgMl = useMemo(() => {
    const active = weekDays.filter((d) => d.totalMl > 0);
    return active.length > 0
      ? Math.round(active.reduce((s, d) => s + d.totalMl, 0) / active.length)
      : 0;
  }, [weekDays]);

  const weekBestMl = useMemo(
    () => Math.max(0, ...weekDays.map((d) => d.totalMl)),
    [weekDays],
  );

  const weekDaysHit = useMemo(
    () => weekDays.filter((d) => d.pct >= 1).length,
    [weekDays],
  );

  // ── Hydration Score ──────────────────────────────────────────────────────
  const hydrationScore = useMemo(() => {
    const consistencyPart = (weekDaysHit / 7) * 40;
    const avgPart = goalMl > 0 ? Math.min(1, weekAvgMl / goalMl) * 40 : 0;
    const streakPart = streak > 0 ? 20 : 0;
    return Math.round(Math.min(100, Math.max(0, consistencyPart + avgPart + streakPart)));
  }, [weekDaysHit, weekAvgMl, goalMl, streak]);

  const scoreColor = useMemo(() => {
    if (hydrationScore >= 70) return colors.success;
    if (hydrationScore >= 40) return colors.warning;
    return colors.danger;
  }, [hydrationScore, colors]);

  // ── Month view data ──────────────────────────────────────────────────────
  const monthDays = useMemo(
    () => getMonthData(monthOffset, goalMl),
    [monthOffset, goalMl],
  );

  const monthTotalMl = useMemo(
    () => monthDays.reduce((s, d) => s + d.totalMl, 0),
    [monthDays],
  );

  const monthDaysTracked = useMemo(
    () => monthDays.filter((d) => d.totalMl > 0).length,
    [monthDays],
  );

  const monthGoalPct = useMemo(() => {
    const hit = monthDays.filter((d) => d.pct >= 1).length;
    return monthDays.length > 0 ? Math.round((hit / monthDays.length) * 100) : 0;
  }, [monthDays]);

  const monthlyHeatmapResult = useMemo(
    () => getMonthlyHeatmap({ entries: allEntries ?? [], goalMl }),
    [allEntries, goalMl],
  );

  const bestStreak = monthlyHeatmapResult.bestStreak ?? 0;

  // ── All Time data ────────────────────────────────────────────────────────
  const allTimeTrend = useMemo(
    () => getWeeklyTrend({ entries: allEntries ?? [], goalMl, weeks: 12 }),
    [allEntries, goalMl],
  );

  const allTimeDaysTracked = useMemo(
    () => (allEntries ?? []).length > 0
      ? new Set((allEntries ?? []).map((e) => {
          const d = new Date(e.timestamp);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })).size
      : 0,
    [allEntries],
  );

  const allTimeBestDayMl = useMemo(
    () => allTimeTrend.days.reduce((m, p) => Math.max(m, p.total), 0),
    [allTimeTrend],
  );

  const allTimeConsistencyPct = useMemo(() => {
    const hit = allTimeTrend.days.filter((p) => p.total >= goalMl).length;
    const total = allTimeTrend.days.filter((p) => p.total > 0).length;
    return total > 0 ? Math.round((hit / total) * 100) : 0;
  }, [allTimeTrend, goalMl]);

  const isEmpty = !allEntries || allEntries.length === 0;

  // Today's date for header
  const todayLabel = format(new Date(), 'EEE, MMM d');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(380)}
        style={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text variant="h2" weight="bold">
          Analytics
        </Text>
        <Text variant="micro" muted>
          {todayLabel}
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Segmented Control */}
        <Animated.View
          entering={FadeInDown.duration(420).delay(60)}
          style={{ marginTop: 12, paddingHorizontal: 24 }}
        >
          <SegmentedControl
            segments={TABS}
            value={tab}
            onChange={(id) => {
              haptics.selection();
              setTab(id as TabId);
            }}
          />
        </Animated.View>

        {isEmpty ? (
          <Animated.View
            entering={FadeInDown.duration(420).delay(100)}
            style={{ marginTop: 48, paddingHorizontal: 24 }}
          >
            <EmptyState
              iconName="bar-chart-outline"
              title="No history yet"
              subtitle="Log a few drinks and your stats will appear here."
            />
          </Animated.View>
        ) : (
          <>
            {/* ─── WEEK VIEW ─────────────────────────────────────────── */}
            {tab === 'week' ? (
              <>
                {/* Week nav */}
                <Animated.View entering={FadeInDown.duration(420).delay(100)}>
                  <WeekNav
                    weekOffset={weekOffset}
                    onPrev={() => setWeekOffset((w) => w - 1)}
                    onNext={() => setWeekOffset((w) => Math.min(w + 1, 0))}
                  />
                </Animated.View>

                {/* Summary cards */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(140)}
                  style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 4 }}
                >
                  <StatCard value={toL(weekAvgMl)} label="Avg Daily" />
                  <StatCard value={toL(weekBestMl)} label="Best Day" accent />
                  <StatCard value={`${weekDaysHit}/7`} label="Goal Days" />
                </Animated.View>

                {/* Daily Rhythm at a glance */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(180)}
                  style={{ marginTop: 16, paddingHorizontal: 20 }}
                >
                  <GlassCard>
                    <View style={{ padding: 20 }}>
                      <Text variant="caption" muted style={{ letterSpacing: 0.8 }}>
                        THIS WEEK AT A GLANCE
                      </Text>
                      <View style={{ marginTop: 16 }}>
                        <DailyRhythmChart weekOffset={weekOffset} goalMl={goalMl} height={100} />
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>

                {/* Bar chart */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(220)}
                  style={{ marginTop: 12, paddingHorizontal: 20 }}
                >
                  <GlassCard>
                    <View style={{ padding: 20 }}>
                      <Text variant="caption" muted style={{ letterSpacing: 0.8 }}>
                        DAILY INTAKE
                      </Text>
                      <View style={{ marginTop: 16 }}>
                        <WeeklyBarChart weekOffset={weekOffset} goalMl={goalMl} height={180} />
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>

                {/* Hydration Score */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(260)}
                  style={{ marginTop: 12, paddingHorizontal: 20 }}
                >
                  <GlassCard>
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text
                        variant="display"
                        weight="bold"
                        color={scoreColor}
                      >
                        {hydrationScore}
                      </Text>
                      <Text variant="caption" weight="semibold" style={{ marginTop: 2 }}>
                        Weekly Score
                      </Text>
                      <Text
                        variant="micro"
                        muted
                        style={{ marginTop: 6, textAlign: 'center', lineHeight: 16 }}
                      >
                        Based on consistency, average intake and streak.
                      </Text>
                    </View>
                  </GlassCard>
                </Animated.View>

                {/* Peak hours */}
                {peakHours.length > 0 ? (
                  <Animated.View
                    entering={FadeInDown.duration(420).delay(300)}
                    style={{ marginTop: 12, paddingHorizontal: 20 }}
                  >
                    <GlassCard>
                      <View style={{ padding: 20 }}>
                        <Text variant="caption" muted style={{ letterSpacing: 0.8 }}>
                          MOST ACTIVE TIME
                        </Text>
                        <View style={{ marginTop: 12 }}>
                          <PeakHoursChart data={peakHours} />
                        </View>
                      </View>
                    </GlassCard>
                  </Animated.View>
                ) : null}

                {/* Insights */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(380)}
                  style={{ marginTop: 12, paddingHorizontal: 20 }}
                >
                  <GlassCard>
                    <View style={{ padding: 20 }}>
                      <Text variant="caption" muted style={{ letterSpacing: 0.8 }}>
                        INSIGHTS
                      </Text>
                      <View style={{ marginTop: 12, gap: 8 }}>
                        {weekInsights.map((line, i) => (
                          <InsightRow key={i} text={line} />
                        ))}
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              </>
            ) : null}

            {/* ─── MONTH VIEW ────────────────────────────────────────── */}
            {tab === 'month' ? (
              <>
                {/* Month summary */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(100)}
                  style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 16 }}
                >
                  <StatCard value={toL(monthTotalMl)} label="Total" />
                  <StatCard value={`${monthDaysTracked}d`} label="Tracked" accent />
                  <StatCard value={`${monthGoalPct}%`} label="Goal Hit" />
                </Animated.View>

                {/* Heatmap */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(180)}
                  style={{ marginTop: 16, paddingHorizontal: 20 }}
                >
                  <GlassCard>
                    <View style={{ padding: 20 }}>
                      <MonthlyHeatmap monthOffset={monthOffset} />
                    </View>
                  </GlassCard>
                </Animated.View>

                {/* Best streak pill */}
                {bestStreak > 0 ? (
                  <Animated.View
                    entering={FadeInDown.duration(420).delay(260)}
                    style={{ marginTop: 12, paddingHorizontal: 20 }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingVertical: 12,
                        paddingHorizontal: 18,
                        backgroundColor: colors.primaryGlow,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Ionicons name="flame" size={16} color={colors.warning} />
                      <Text variant="caption" weight="semibold">
                        Best streak this month: {bestStreak} day{bestStreak !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </Animated.View>
                ) : null}
              </>
            ) : null}

            {/* ─── ALL TIME VIEW ─────────────────────────────────────── */}
            {tab === 'alltime' ? (
              <>
                {/* Lifetime total */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(100)}
                  style={{ paddingHorizontal: 20, marginTop: 20, alignItems: 'center' }}
                >
                  <Text variant="micro" muted style={{ letterSpacing: 1 }}>
                    LIFETIME INTAKE
                  </Text>
                  <Text
                    variant="display"
                    weight="bold"
                    color={colors.primary}
                    style={{ marginTop: 4 }}
                  >
                    {toL(lifetimeMl)}
                  </Text>
                  <Text variant="caption" muted>
                    across {allTimeDaysTracked} day{allTimeDaysTracked !== 1 ? 's' : ''} tracked
                  </Text>
                </Animated.View>

                {/* Trend line */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(180)}
                  style={{ marginTop: 20, paddingHorizontal: 20 }}
                >
                  <GlassCard>
                    <View style={{ padding: 20 }}>
                      <Text variant="caption" muted style={{ letterSpacing: 0.8 }}>
                        WEEKLY AVERAGE — LAST 12 WEEKS
                      </Text>
                      <View style={{ marginTop: 16 }}>
                        <TrendLine weeks={allTimeTrend.weeks} goalMl={goalMl} height={160} />
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>

                {/* Top stats grid */}
                <Animated.View
                  entering={FadeInDown.duration(420).delay(260)}
                  style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 12 }}
                >
                  <StatCard value={toL(allTimeBestDayMl)} label="Best Day" accent />
                  <StatCard value={toL(allTimeTrend.avgMl * 7)} label="Avg Weekly" />
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.duration(420).delay(300)}
                  style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 8 }}
                >
                  <StatCard value={`${streak}d`} label="Longest Streak" />
                  <StatCard value={`${allTimeConsistencyPct}%`} label="Consistency" />
                </Animated.View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
