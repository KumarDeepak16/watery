// date helpers via date-fns

import {
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  getHours,
  isSameDay as fnsIsSameDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export type DateInput = Date | number | string;

const toDate = (d: DateInput): Date => (d instanceof Date ? d : new Date(d));

export const formatDate = (d: DateInput, pattern = 'yyyy-MM-dd'): string =>
  format(toDate(d), pattern);

export const getToday = (): string => format(new Date(), 'yyyy-MM-dd');

export const getWeekRange = (d: DateInput = new Date()): { start: Date; end: Date } => ({
  start: startOfWeek(toDate(d), { weekStartsOn: 1 }),
  end: endOfWeek(toDate(d), { weekStartsOn: 1 }),
});

export const getMonthRange = (d: DateInput = new Date()): { start: Date; end: Date } => ({
  start: startOfMonth(toDate(d)),
  end: endOfMonth(toDate(d)),
});

export const isSameDay = (a: DateInput, b: DateInput): boolean => fnsIsSameDay(toDate(a), toDate(b));

export const daysBetween = (a: DateInput, b: DateInput): number =>
  Math.abs(differenceInCalendarDays(toDate(a), toDate(b)));

export const hourOfDay = (d: DateInput): number => getHours(toDate(d));
