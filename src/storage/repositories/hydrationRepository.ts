import {
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  parseISO,
  subDays,
} from 'date-fns';

import { getJSON, setJSON } from '../mmkv';
import { StorageKey } from '../keys';
import type { DailyLog, HydrationEntry, HydrationLogStore } from '../types';
import { getUser } from './userRepository';

const DATE_FMT = 'yyyy-MM-dd';

const todayKey = (d: Date = new Date()): string => format(d, DATE_FMT);

const emptyStore = (): HydrationLogStore => ({ byDate: {} });

const readStore = (): HydrationLogStore =>
  getJSON<HydrationLogStore>(StorageKey.HYDRATION_LOG) ?? emptyStore();

const writeStore = (store: HydrationLogStore): void => {
  setJSON(StorageKey.HYDRATION_LOG, store);
};

const ensureDailyLog = (
  store: HydrationLogStore,
  date: string,
): DailyLog => {
  const existing = store.byDate[date];
  if (existing) return existing;
  const goalMl = getUser()?.dailyGoalMl ?? 2500;
  const log: DailyLog = {
    date,
    totalMl: 0,
    goalMl,
    entries: [],
    completed: false,
  };
  store.byDate[date] = log;
  return log;
};

const recomputeLog = (log: DailyLog): DailyLog => {
  const totalMl = log.entries.reduce((s, e) => s + e.amountMl, 0);
  return {
    ...log,
    totalMl,
    completed: totalMl >= log.goalMl,
  };
};

const makeId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const addEntry = (
  amountMl: number,
  source: HydrationEntry['source'] = 'quick',
  note?: string,
  timestamp: number = Date.now(),
): { entry: HydrationEntry; log: DailyLog } => {
  const store = readStore();
  const dateKey = format(new Date(timestamp), DATE_FMT);
  const log = ensureDailyLog(store, dateKey);
  const entry: HydrationEntry = {
    id: makeId(),
    amountMl,
    timestamp,
    source,
    note,
  };
  log.entries = [...log.entries, entry].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
  store.byDate[dateKey] = recomputeLog(log);
  writeStore(store);
  return { entry, log: store.byDate[dateKey] };
};

export const deleteEntry = (entryId: string): boolean => {
  const store = readStore();
  for (const dateKey of Object.keys(store.byDate)) {
    const log = store.byDate[dateKey];
    if (!log) continue;
    const filtered = log.entries.filter((e) => e.id !== entryId);
    if (filtered.length !== log.entries.length) {
      store.byDate[dateKey] = recomputeLog({ ...log, entries: filtered });
      writeStore(store);
      return true;
    }
  }
  return false;
};

export const getEntriesForDate = (date: Date | string): HydrationEntry[] => {
  const key = typeof date === 'string' ? date : format(date, DATE_FMT);
  return readStore().byDate[key]?.entries ?? [];
};

export const getEntriesForRange = (
  start: Date,
  end: Date,
): HydrationEntry[] => {
  const store = readStore();
  const out: HydrationEntry[] = [];
  for (const log of Object.values(store.byDate)) {
    const d = parseISO(log.date);
    if (!isBefore(d, start) && !isAfter(d, end)) {
      out.push(...log.entries);
    }
  }
  return out.sort((a, b) => a.timestamp - b.timestamp);
};

export const getDailyLog = (date: Date | string = new Date()): DailyLog => {
  const key = typeof date === 'string' ? date : format(date, DATE_FMT);
  const store = readStore();
  const existing = store.byDate[key];
  if (existing) return existing;
  // synthetic empty log -> never written until something is logged
  const goalMl = getUser()?.dailyGoalMl ?? 2500;
  return { date: key, totalMl: 0, goalMl, entries: [], completed: false };
};

export const getAllLogs = (): DailyLog[] =>
  Object.values(readStore().byDate).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );

export const getTodayTotal = (): number => getDailyLog(new Date()).totalMl;

export const getLastDrinkTime = (): number | null => {
  const today = getDailyLog(new Date());
  if (today.entries.length === 0) return null;
  return today.entries[today.entries.length - 1]!.timestamp;
};

export const getCurrentStreak = (): number => {
  const store = readStore();
  let streak = 0;
  let cursor = new Date();
  // walk backwards day-by-day while completed
  // stop on first non-completed; today not completed yet still counts streak from yesterday
  let allowedTodayMiss = true;
  while (true) {
    const key = format(cursor, DATE_FMT);
    const log = store.byDate[key];
    if (log?.completed) {
      streak += 1;
      allowedTodayMiss = false;
    } else if (allowedTodayMiss) {
      // first iteration only -> skip incomplete today
      allowedTodayMiss = false;
    } else {
      break;
    }
    cursor = subDays(cursor, 1);
    // hard cap to prevent runaway in edge cases
    if (streak > 3650) break;
  }
  return streak;
};

export const getWeeklyAverage = (endDate: Date = new Date()): number => {
  const start = subDays(endDate, 6);
  const store = readStore();
  let total = 0;
  let days = 0;
  for (let i = 0; i <= 6; i++) {
    const key = format(subDays(endDate, i), DATE_FMT);
    const log = store.byDate[key];
    if (log) {
      total += log.totalMl;
      days += 1;
    }
  }
  // include zero-entry days only if any logs exist in window
  const span = differenceInCalendarDays(endDate, start) + 1;
  return days === 0 ? 0 : Math.round(total / span);
};

export const updateDailyGoal = (date: string, goalMl: number): DailyLog => {
  const store = readStore();
  const log = ensureDailyLog(store, date);
  store.byDate[date] = recomputeLog({ ...log, goalMl });
  writeStore(store);
  return store.byDate[date]!;
};

export const hydrationRepository = {
  addEntry,
  deleteEntry,
  getEntriesForDate,
  getEntriesForRange,
  getDailyLog,
  getAllLogs,
  getTodayTotal,
  getLastDrinkTime,
  getCurrentStreak,
  getWeeklyAverage,
  updateDailyGoal,
  todayKey,
};
