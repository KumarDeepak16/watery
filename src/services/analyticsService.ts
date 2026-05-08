// pure analytics over hydration data

import {
  addDays,
  addMonths,
  addWeeks,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';

import type {
  ActivityLevel,
  Climate,
  DailyLog,
  HydrationEntry,
  UserProfile,
} from '@/storage';
import { hydrationRepository, userRepository } from '@/storage';
import {
  climateTips,
  hydrationFacts,
  motivationalQuotes,
  seasonalTips,
  type ClimateKind,
  type Season,
} from '@/utils/motivational';
import { hourOfDay, isSameDay } from '@/utils/date';
import { clamp, mapRange, percent } from '@/utils/math';

export interface PeakHour {
  hour: number;
  count: number;
  totalMl?: number;
}

export interface WeeklyTrendPoint {
  day: string; // 'Mon'
  date: string; // 'yyyy-MM-dd'
  total: number;
  goal: number;
}

export interface HeatmapCell {
  date: string;
  intensity: number; // 0-1
  totalMl: number;
  goalMl?: number;
}

export interface StreakDay {
  date: string;
  completed: boolean;
}

export interface CalculateDailyGoalInput {
  weightKg: number;
  activityLevel?: ActivityLevel;
  // alias used by onboarding
  activity?: ActivityLevel;
  climate: Climate;
  age?: number;
  gender?: UserProfile['gender'];
}

export const calculateDailyGoal = (
  profile: CalculateDailyGoalInput,
): number =>
  userRepository.calculateDailyGoalMl(
    profile.weightKg,
    (profile.activityLevel ?? profile.activity ?? 'moderate') as ActivityLevel,
    profile.climate,
  );

export interface PeakHoursInput {
  entries: HydrationEntry[];
  days?: number;
}

const isPeakHoursInput = (
  v: HydrationEntry[] | PeakHoursInput,
): v is PeakHoursInput => !Array.isArray(v) && Array.isArray((v as PeakHoursInput).entries);

export interface PeakHoursResultExtended extends Array<PeakHour> {
  peakHour?: number;
  hours?: PeakHour[];
}

export function getPeakHours(input: PeakHoursInput): PeakHoursResultExtended;
export function getPeakHours(entries: HydrationEntry[], days?: number): PeakHoursResultExtended;
export function getPeakHours(
  arg: HydrationEntry[] | PeakHoursInput,
  daysArg = 30,
): PeakHoursResultExtended {
  const entries: HydrationEntry[] = isPeakHoursInput(arg) ? arg.entries : arg;
  const days = isPeakHoursInput(arg) ? (arg.days ?? 30) : daysArg;
  const cutoff = subDays(new Date(), days).getTime();
  const buckets = new Array(24).fill(0) as number[];
  const totals = new Array(24).fill(0) as number[];
  for (const e of entries) {
    if (e.timestamp < cutoff) continue;
    const h = hourOfDay(e.timestamp);
    buckets[h] = (buckets[h] ?? 0) + 1;
    totals[h] = (totals[h] ?? 0) + e.amountMl;
  }
  const all: PeakHour[] = buckets
    .map((count, hour) => ({ hour, count, totalMl: totals[hour] ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const result = all as PeakHoursResultExtended;
  result.peakHour = all[0]?.hour;
  result.hours = all;
  return result;
}

const formatHourRange = (hour: number): string => {
  const fmt = (h: number): string => {
    const mod = ((h % 24) + 24) % 24;
    const ampm = mod < 12 ? 'AM' : 'PM';
    const display = mod % 12 === 0 ? 12 : mod % 12;
    return `${display}${ampm}`;
  };
  return `${fmt(hour)}-${fmt(hour + 2)}`;
};

export interface GetInsightInput {
  entries: HydrationEntry[];
  totalMl?: number;
  goalMl?: number;
  logs?: DailyLog[];
}

const isInsightInput = (
  v: HydrationEntry[] | GetInsightInput,
): v is GetInsightInput => !Array.isArray(v) && Array.isArray((v as GetInsightInput).entries);

export function getInsight(input: GetInsightInput): string;
export function getInsight(entries: HydrationEntry[], logs?: DailyLog[]): string;
export function getInsight(
  arg: HydrationEntry[] | GetInsightInput,
  logsArg: DailyLog[] = [],
): string {
  const entries: HydrationEntry[] = isInsightInput(arg) ? arg.entries : arg;
  const logs: DailyLog[] = isInsightInput(arg) ? (arg.logs ?? []) : logsArg;
  if (entries.length < 5) {
    return 'Log a few more drinks and we will surface trends';
  }

  const peaks = getPeakHours(entries, 30);
  if (peaks.length > 0 && (peaks[0]?.count ?? 0) >= 3) {
    const range = formatHourRange(peaks[0]!.hour);
    return `You drink most water between ${range}`;
  }

  if (logs.length >= 14) {
    const recent7 = logs.slice(-7);
    const prior7 = logs.slice(-14, -7);
    const avg = (xs: DailyLog[]): number =>
      xs.reduce((s, l) => s + l.totalMl, 0) / Math.max(1, xs.length);
    const recent = avg(recent7);
    const prior = avg(prior7);
    if (prior > 0 && recent > prior * 1.1) {
      return 'Your hydration consistency improved this week';
    }
    if (prior > 0 && recent < prior * 0.85) {
      return 'You are slipping a bit — try a midday reminder';
    }
  }

  const lateDrinks = entries.filter((e) => hourOfDay(e.timestamp) >= 20).length;
  if (lateDrinks / entries.length > 0.4) {
    return 'Try drinking earlier in the day';
  }

  return 'Steady sips win. Keep going.';
}

export interface WeeklyTrendInput {
  entries?: HydrationEntry[];
  logs?: DailyLog[];
  goalMl?: number;
  weeks?: number;
  endDate?: Date;
}

export interface WeeklyTrendResult extends Array<WeeklyTrendPoint> {
  days: WeeklyTrendPoint[];
  totalMl: number;
  avgMl: number;
  bestMl: number;
  weeks: { week: string; avg: number; total: number }[];
}

const buildLogsFromEntries = (
  entries: HydrationEntry[],
  goalMl: number,
): DailyLog[] => {
  const byDate: Record<string, DailyLog> = {};
  for (const e of entries) {
    const key = format(new Date(e.timestamp), 'yyyy-MM-dd');
    let log = byDate[key];
    if (!log) {
      log = { date: key, totalMl: 0, goalMl, entries: [], completed: false };
      byDate[key] = log;
    }
    log.entries.push(e);
    log.totalMl += e.amountMl;
    log.completed = log.totalMl >= log.goalMl;
  }
  return Object.values(byDate);
};

const isWeeklyTrendInput = (
  v: DailyLog[] | WeeklyTrendInput,
): v is WeeklyTrendInput => !Array.isArray(v);

export function getWeeklyTrend(input: WeeklyTrendInput): WeeklyTrendResult;
export function getWeeklyTrend(
  logs: DailyLog[],
  endDate?: Date,
  goalMl?: number,
): WeeklyTrendResult;
export function getWeeklyTrend(
  arg: DailyLog[] | WeeklyTrendInput,
  endDateArg: Date = new Date(),
  goalMlArg?: number,
): WeeklyTrendResult {
  let logs: DailyLog[];
  let endDate: Date;
  let goalMl: number | undefined;
  let weeks = 1;

  if (isWeeklyTrendInput(arg)) {
    goalMl = arg.goalMl;
    endDate = arg.endDate ?? new Date();
    weeks = Math.max(1, arg.weeks ?? 1);
    logs = arg.logs ?? buildLogsFromEntries(arg.entries ?? [], goalMl ?? 2500);
  } else {
    logs = arg;
    endDate = endDateArg;
    goalMl = goalMlArg;
  }

  const totalDays = 7 * weeks;
  const points: WeeklyTrendPoint[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = subDays(startOfDay(endDate), i);
    const key = format(d, 'yyyy-MM-dd');
    const log = logs.find((l) => l.date === key);
    points.push({
      day: format(d, 'EEE'),
      date: key,
      total: log?.totalMl ?? 0,
      goal: log?.goalMl ?? goalMl ?? 2500,
    });
  }

  const totalMl = points.reduce((s, p) => s + p.total, 0);
  const avgMl = points.length > 0 ? Math.round(totalMl / points.length) : 0;
  const bestMl = points.reduce((m, p) => Math.max(m, p.total), 0);

  // weekly aggregation
  const weeksOut: { week: string; avg: number; total: number }[] = [];
  for (let w = 0; w < weeks; w++) {
    const slice = points.slice(w * 7, (w + 1) * 7);
    const sum = slice.reduce((s, p) => s + p.total, 0);
    weeksOut.push({
      week: `W${w + 1}`,
      avg: slice.length > 0 ? Math.round(sum / slice.length) : 0,
      total: sum,
    });
  }

  const result = points as WeeklyTrendResult;
  result.days = points;
  result.totalMl = totalMl;
  result.avgMl = avgMl;
  result.bestMl = bestMl;
  result.weeks = weeksOut;
  return result;
}

export interface MonthlyHeatmapInput {
  entries?: HydrationEntry[];
  logs?: DailyLog[];
  goalMl?: number;
  days?: number;
  endDate?: Date;
}

export interface MonthlyHeatmapResult extends Array<HeatmapCell> {
  cells: HeatmapCell[];
  daysHit: number;
  bestStreak: number;
  avgMl: number;
  // also surfaced for components
  goalMl?: number;
}

const isHeatmapInput = (
  v: DailyLog[] | MonthlyHeatmapInput,
): v is MonthlyHeatmapInput => !Array.isArray(v);

export function getMonthlyHeatmap(input: MonthlyHeatmapInput): MonthlyHeatmapResult;
export function getMonthlyHeatmap(
  logs: DailyLog[],
  endDate?: Date,
  days?: number,
): MonthlyHeatmapResult;
export function getMonthlyHeatmap(
  arg: DailyLog[] | MonthlyHeatmapInput,
  endDateArg: Date = new Date(),
  daysArg = 30,
): MonthlyHeatmapResult {
  let logs: DailyLog[];
  let endDate: Date;
  let days: number;
  let goalDefault = 2500;

  if (isHeatmapInput(arg)) {
    endDate = arg.endDate ?? new Date();
    days = arg.days ?? 30;
    goalDefault = arg.goalMl ?? 2500;
    logs = arg.logs ?? buildLogsFromEntries(arg.entries ?? [], goalDefault);
  } else {
    logs = arg;
    endDate = endDateArg;
    days = daysArg;
  }

  const cells: HeatmapCell[] = [];
  let daysHit = 0;
  let totalMl = 0;
  let curStreak = 0;
  let bestStreak = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(startOfDay(endDate), i);
    const key = format(d, 'yyyy-MM-dd');
    const log = logs.find((l) => l.date === key);
    const total = log?.totalMl ?? 0;
    const goal = log?.goalMl ?? goalDefault;
    const intensity = goal <= 0 ? 0 : clamp(total / goal, 0, 1);
    cells.push({ date: key, intensity, totalMl: total, goalMl: goal });
    totalMl += total;
    if (total >= goal && goal > 0) {
      daysHit++;
      curStreak++;
      if (curStreak > bestStreak) bestStreak = curStreak;
    } else {
      curStreak = 0;
    }
  }

  const result = cells as MonthlyHeatmapResult;
  result.cells = cells;
  result.daysHit = daysHit;
  result.bestStreak = bestStreak;
  result.avgMl = cells.length > 0 ? Math.round(totalMl / cells.length) : 0;
  result.goalMl = goalDefault;
  return result;
}

export interface StreakCalendarInput {
  entries?: HydrationEntry[];
  logs?: DailyLog[];
  goalMl?: number;
  days?: number;
  endDate?: Date;
}

const isStreakInput = (
  v: DailyLog[] | StreakCalendarInput,
): v is StreakCalendarInput => !Array.isArray(v);

export function getStreakCalendar(input: StreakCalendarInput): StreakDay[];
export function getStreakCalendar(
  logs: DailyLog[],
  endDate?: Date,
  days?: number,
): StreakDay[];
export function getStreakCalendar(
  arg: DailyLog[] | StreakCalendarInput,
  endDateArg: Date = new Date(),
  daysArg = 30,
): StreakDay[] {
  let logs: DailyLog[];
  let endDate: Date;
  let days: number;

  if (isStreakInput(arg)) {
    endDate = arg.endDate ?? new Date();
    days = arg.days ?? 30;
    logs = arg.logs ?? buildLogsFromEntries(arg.entries ?? [], arg.goalMl ?? 2500);
  } else {
    logs = arg;
    endDate = endDateArg;
    days = daysArg;
  }

  const out: StreakDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(startOfDay(endDate), i);
    const key = format(d, 'yyyy-MM-dd');
    const log = logs.find((l) => l.date === key);
    out.push({ date: key, completed: !!log?.completed });
  }
  return out;
}

export const getMotivationalQuote = (seed?: number): string => {
  const idx =
    seed != null ? Math.abs(Math.floor(seed)) % motivationalQuotes.length :
    Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[idx] ?? motivationalQuotes[0]!;
};

export const getRandomFact = (): string =>
  hydrationFacts[Math.floor(Math.random() * hydrationFacts.length)] ?? hydrationFacts[0]!;

export const getHydrationTip = (_season: Season, climate: ClimateKind): string => {
  const climatic = climateTips[climate];
  const pool = [...seasonalTips, climatic];
  return pool[Math.floor(Math.random() * pool.length)] ?? 'Sip steadily through the day.';
};

export const getCurrentSeason = (now: Date = new Date()): Season => {
  const m = now.getMonth();
  if (m <= 1 || m === 11) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
};

export const getConsistencyScore = (logs: DailyLog[], days = 7): number => {
  if (logs.length === 0) return 0;
  const window = logs.slice(-days);
  const completed = window.filter((l) => l.completed).length;
  return percent(completed, window.length);
};

export const getAverageDrinkSize = (entries: HydrationEntry[]): number => {
  if (entries.length === 0) return 0;
  const total = entries.reduce((s, e) => s + e.amountMl, 0);
  return Math.round(total / entries.length);
};

export const getDaysTracked = (logs: DailyLog[]): number =>
  logs.filter((l) => l.totalMl > 0).length;

export const getProgressTowardGoal = (totalMl: number, goalMl: number): number =>
  goalMl <= 0 ? 0 : mapRange(totalMl, 0, goalMl, 0, 1);

export const hasDrunkToday = (entries: HydrationEntry[]): boolean =>
  entries.some((e) => isSameDay(e.timestamp, new Date()));

export const getDaysSinceStart = (createdAt: number): number =>
  Math.max(0, differenceInDays(new Date(), new Date(createdAt)));

export const getProjectedTotal = (
  entries: HydrationEntry[],
  now: Date = new Date(),
): number => {
  // simple linear projection of today's pace through the rest of the day
  const today = entries.filter((e) => isSameDay(e.timestamp, now));
  if (today.length === 0) return 0;
  const total = today.reduce((s, e) => s + e.amountMl, 0);
  const elapsedHours = Math.max(1, hourOfDay(now) + now.getMinutes() / 60);
  const ratePerHour = total / elapsedHours;
  const remainingHours = Math.max(0, 22 - elapsedHours);
  return Math.round(total + ratePerHour * remainingHours);
};

export const projectStreakRisk = (
  log: DailyLog,
  now: Date = new Date(),
): 'safe' | 'watch' | 'risk' => {
  if (log.completed) return 'safe';
  const ratio = log.goalMl <= 0 ? 0 : log.totalMl / log.goalMl;
  const hour = hourOfDay(now);
  if (hour >= 20 && ratio < 0.85) return 'risk';
  if (hour >= 16 && ratio < 0.55) return 'watch';
  return 'safe';
};

export const getNextDayKey = (date: Date = new Date()): string =>
  format(addDays(startOfDay(date), 1), 'yyyy-MM-dd');

// ─── New analytics helpers for redesigned History screen ─────────────────────

export interface DayData {
  date: string;       // 'yyyy-MM-dd'
  dayLabel: string;   // 'Mon', 'Tue', ...
  totalMl: number;
  goalMl: number;
  pct: number;        // 0..1+
}

/** Returns 7 DayData objects for the given weekOffset (0 = current week, -1 = last, etc.) */
export function getWeekData(weekOffset: number, goalMl: number): DayData[] {
  const base = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(base, { weekStartsOn: 1 }); // Mon
  const weekEnd = endOfWeek(base, { weekStartsOn: 1 });
  const entries = hydrationRepository.getEntriesForRange(weekStart, weekEnd);

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  return days.map((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const dayEntries = entries.filter(
      (e) => format(new Date(e.timestamp), 'yyyy-MM-dd') === key,
    );
    const totalMl = dayEntries.reduce((s, e) => s + e.amountMl, 0);
    return {
      date: key,
      dayLabel: format(d, 'EEE'),
      totalMl,
      goalMl,
      pct: goalMl > 0 ? totalMl / goalMl : 0,
    };
  });
}

/** Returns DayData objects for every day of the given month (monthOffset 0 = current). */
export function getMonthData(monthOffset: number, goalMl: number): DayData[] {
  const base = addMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(base);
  const monthEnd = endOfMonth(base);
  const entries = hydrationRepository.getEntriesForRange(monthStart, monthEnd);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  return days.map((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const dayEntries = entries.filter(
      (e) => format(new Date(e.timestamp), 'yyyy-MM-dd') === key,
    );
    const totalMl = dayEntries.reduce((s, e) => s + e.amountMl, 0);
    return {
      date: key,
      dayLabel: format(d, 'd'),
      totalMl,
      goalMl,
      pct: goalMl > 0 ? totalMl / goalMl : 0,
    };
  });
}

/** Returns 2-3 insight strings for the given week. */
export function getWeekInsights(weekOffset: number, goalMl: number): string[] {
  const week = getWeekData(weekOffset, goalMl);
  const insights: string[] = [];

  const activeDays = week.filter((d) => d.totalMl > 0);
  const daysHit = week.filter((d) => d.pct >= 1).length;
  const totalMl = week.reduce((s, d) => s + d.totalMl, 0);
  const avgMl = activeDays.length > 0 ? totalMl / activeDays.length : 0;

  if (activeDays.length === 0) {
    return ['No hydration logged this week yet. Start sipping!'];
  }

  if (daysHit === 7) {
    insights.push('Perfect week — you hit your goal every single day.');
  } else if (daysHit >= 5) {
    insights.push(`Strong week: ${daysHit} of 7 days hit your goal.`);
  } else if (daysHit > 0) {
    insights.push(`You hit your goal on ${daysHit} day${daysHit > 1 ? 's' : ''} this week. Keep building the streak.`);
  } else {
    insights.push("Didn't hit your goal this week — a small daily habit gets you there.");
  }

  const best = week.reduce((m, d) => (d.totalMl > m.totalMl ? d : m), week[0]!);
  if (best.totalMl > 0) {
    const bestL = (best.totalMl / 1000).toFixed(1);
    insights.push(`Best day: ${best.dayLabel} at ${bestL}L — that's the standard to match.`);
  }

  const avgL = (avgMl / 1000).toFixed(1);
  if (avgMl > 0) {
    insights.push(`Weekly average: ${avgL}L per active day.`);
  }

  return insights.slice(0, 3);
}

/** Returns per-hour totals for the given week. */
export function getPeakHoursForWeek(
  weekOffset: number,
): { hour: number; totalMl: number }[] {
  const base = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(base, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(base, { weekStartsOn: 1 });
  const entries = hydrationRepository.getEntriesForRange(weekStart, weekEnd);

  const totals = new Array(24).fill(0) as number[];
  for (const e of entries) {
    const h = new Date(e.timestamp).getHours();
    totals[h] = (totals[h] ?? 0) + e.amountMl;
  }
  return totals
    .map((totalMl, hour) => ({ hour, totalMl }))
    .filter((x) => x.totalMl > 0);
}
