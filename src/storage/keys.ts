// MMKV storage key registry. enum gives autocomplete + grep-friendly refs.
export enum StorageKey {
  USER_PROFILE = 'user.profile',
  HYDRATION_LOG = 'hydration.log',
  SETTINGS = 'app.settings',
  GAMIFICATION = 'gamification.state',
  ONBOARDING_DONE = 'onboarding.done',
  REMINDERS = 'reminders.list',
  ACHIEVEMENTS = 'achievements.list',
  STREAK = 'gamification.streak',
  THEME_PREF = 'theme.pref',
  LAST_SYNC = 'sync.last',
}
