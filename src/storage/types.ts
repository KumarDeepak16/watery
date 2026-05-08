export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';

export type Climate = 'cold' | 'temperate' | 'warm' | 'hot' | 'humid';

export type ThemePref = 'light' | 'dark' | 'system';

export type EntrySource = 'quick' | 'custom' | 'auto';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type AchievementType =
  | 'streak'
  | 'volume'
  | 'consistency'
  | 'milestone'
  | 'speed'
  | 'special';

export type UserProfile = {
  id?: string;
  name: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel?: ActivityLevel;
  // alias used by screens
  activity?: ActivityLevel;
  climate: Climate;
  // 'HH:mm' 24h
  wakeTime?: string;
  sleepTime?: string;
  // alias used by screens (hours, 0-23)
  wakeHour?: number;
  sleepHour?: number;
  dailyGoalMl: number;
  createdAt?: number;
  // unit system the profile was captured in
  units?: 'metric' | 'imperial';
};

export type HydrationEntry = {
  id: string;
  amountMl: number;
  // unix ms
  timestamp: number;
  source: EntrySource;
  note?: string;
  // optional 'YYYY-MM-DD' tag (some screens index by date)
  date?: string;
};

export type DailyLog = {
  // 'YYYY-MM-DD'
  date: string;
  totalMl: number;
  goalMl: number;
  entries: HydrationEntry[];
  completed: boolean;
};

export type HydrationLogStore = {
  // date -> daily log
  byDate: Record<string, DailyLog>;
};

export type Settings = {
  theme: ThemePref;
  // minutes between reminders
  reminderInterval: number;
  // alias used by some screens
  reminderIntervalMin: number;
  soundsEnabled: boolean;
  // alias used by some screens
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  silentMode: boolean;
  notificationsEnabled: boolean;
  snoozeMinutes: number;
  // alias used by some screens
  snoozeMin: number;
  // user-active hours (optional; reflects profile but stored for screens too)
  wakeHour: number;
  sleepHour: number;
  // unit system used by daily-goal calculations
  units: 'metric' | 'imperial';
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  unlockedAt: number | null;
};

export type Achievement = {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: number | null;
  rewardXp: number;
};

export type Gamification = {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalDays: number;
  badges: Badge[];
  unlockedThemes: string[];
  unlockedCups: string[];
  // 'YYYY-MM-DD' of last day a goal was hit (drives streak)
  lastStreakDate: string | null;
};

export type Reminder = {
  id: string;
  // 'HH:mm'
  time: string;
  enabled: boolean;
  message: string;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  reminderInterval: 60,
  reminderIntervalMin: 60,
  soundsEnabled: true,
  soundEnabled: true,
  hapticsEnabled: true,
  silentMode: false,
  notificationsEnabled: true,
  snoozeMinutes: 10,
  snoozeMin: 10,
  wakeHour: 7,
  sleepHour: 22,
  units: 'metric',
};

export const DEFAULT_GAMIFICATION: Gamification = {
  xp: 0,
  level: 1,
  streak: 0,
  longestStreak: 0,
  totalDays: 0,
  badges: [],
  unlockedThemes: ['default'],
  unlockedCups: ['glass'],
  lastStreakDate: null,
};
