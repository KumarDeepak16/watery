// expo-notifications wrapper — gracefully degrades in Expo Go

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Expo Go removed push notifications in SDK 53. All calls wrapped in try/catch.

import { NOTIFICATION_CHANNEL_ID } from '@/constants';
import { hydrationMessages } from '@/utils/motivational';

// re-export rotating messages
export { hydrationMessages } from '@/utils/motivational';

let configured = false;

export const configureNotifications = async (): Promise<void> => {
  if (configured) return;
  try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Hydration Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'aqua-drop',
      vibrationPattern: [0, 200, 80, 200],
      lightColor: '#22D3EE',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
    });
  }

  configured = true;
  } catch {
    // Expo Go doesn't support push notifications — non-fatal
  }
};

export const requestPermissions = async (): Promise<boolean> => {
  try {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const result = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: true,
    },
  });
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL || false;
  } catch {
    return false;
  }
};

const pickMessage = (i: number, messages: readonly string[]): string => {
  if (messages.length === 0) return 'Time to hydrate';
  return messages[i % messages.length] ?? messages[0]!;
};

export interface ReminderScheduleInput {
  intervalMinutes: number;
  // 'HH:mm' 24h
  wakeTime: string;
  sleepTime: string;
  messages?: readonly string[];
}

const parseHm = (s: string): { hour: number; minute: number } => {
  const [h, m] = s.split(':');
  return {
    hour: Math.min(23, Math.max(0, parseInt(h ?? '7', 10) || 0)),
    minute: Math.min(59, Math.max(0, parseInt(m ?? '0', 10) || 0)),
  };
};

export const scheduleHydrationReminders = async ({
  intervalMinutes,
  wakeTime,
  sleepTime,
  messages = hydrationMessages,
}: ReminderScheduleInput): Promise<string[]> => {
  try {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (intervalMinutes <= 0) return [];

  const wake = parseHm(wakeTime);
  const sleep = parseHm(sleepTime);
  const wakeMins = wake.hour * 60 + wake.minute;
  const sleepMins = sleep.hour * 60 + sleep.minute;
  if (sleepMins <= wakeMins) return [];

  const ids: string[] = [];
  let cursor = wakeMins;
  let i = 0;
  while (cursor <= sleepMins) {
    const hour = Math.floor(cursor / 60);
    const minute = cursor % 60;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Watery',
        body: pickMessage(i, messages),
        sound: 'aqua-drop',
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
    ids.push(id);
    cursor += intervalMinutes;
    i += 1;
  }
  return ids;
  } catch {
    return [];
  }
};

export const cancelAllReminders = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch { /* Expo Go */ }
};

export const sendTestNotification = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const perms = await Notifications.getPermissionsAsync();
    if (!perms.granted) {
      const req = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: true },
      });
      if (!req.granted) {
        return { success: false, error: 'Notification permission denied. Enable in Settings.' };
      }
    }
    const messages = [
      'Watery is watching out for you 💧',
      'Your reminders are live and ready',
      'Stay hydrated — we\'ll nudge you when it\'s time',
    ];
    const body = messages[Math.floor(Date.now() / 1000) % messages.length] ?? messages[0]!;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Notifications working',
        body,
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, repeats: false },
    });
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Expo Go doesn't support push on Android SDK 53+
    if (msg.includes('Expo Go') || msg.includes('development build')) {
      return { success: false, error: 'Notifications require a development build, not Expo Go.' };
    }
    return { success: false, error: msg };
  }
};

export const snoozeReminder = async (minutes: number): Promise<string> => {
  const seconds = Math.max(60, Math.round(minutes * 60));
  try { return await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Watery',
      body: pickMessage(Math.floor(Date.now() / 60000), hydrationMessages),
      sound: 'aqua-drop',
      ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  }); } catch { return ''; }
};

export const getScheduledReminderIds = async (): Promise<string[]> => {
  const list = await Notifications.getAllScheduledNotificationsAsync();
  return list.map((n) => n.identifier);
};

export interface UpcomingReminder {
  id: string;
  label: string;
  time: string;
}

const pad2 = (n: number): string => `${n}`.padStart(2, '0');

export const getUpcomingToday = async (): Promise<UpcomingReminder[]> => {
  try {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    const out: UpcomingReminder[] = [];
    for (const n of list) {
      const trigger = (n as { trigger?: unknown }).trigger as
        | { hour?: number; minute?: number }
        | null
        | undefined;
      if (!trigger || trigger.hour == null || trigger.minute == null) continue;
      const hour = trigger.hour;
      const minute = trigger.minute;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const display = hour % 12 === 0 ? 12 : hour % 12;
      out.push({
        id: n.identifier,
        label:
          typeof n.content?.title === 'string' && n.content.title.length > 0
            ? n.content.title
            : 'Hydration reminder',
        time: `${display}:${pad2(minute)} ${ampm}`,
      });
    }
    return out;
  } catch {
    return [];
  }
};

// flexible scheduler used by reminders screen (legacy hour-based shape)
export interface LegacyScheduleInput {
  intervalMin?: number;
  intervalMinutes?: number;
  wakeHour?: number;
  sleepHour?: number;
  wakeTime?: string;
  sleepTime?: string;
  silent?: boolean;
  sound?: boolean;
  messages?: readonly string[];
}

const hourToTime = (h: number): string => `${pad2(h)}:00`;

const scheduleHydrationRemindersLoose = async (
  input: LegacyScheduleInput,
): Promise<string[]> => {
  const intervalMinutes =
    input.intervalMinutes ?? input.intervalMin ?? 60;
  const wakeTime =
    input.wakeTime ??
    (input.wakeHour != null ? hourToTime(input.wakeHour) : '07:00');
  const sleepTime =
    input.sleepTime ??
    (input.sleepHour != null ? hourToTime(input.sleepHour) : '22:00');
  return scheduleHydrationReminders({
    intervalMinutes,
    wakeTime,
    sleepTime,
    messages: input.messages ?? hydrationMessages,
  });
};

// namespace export so screens can do `notificationService.xxx`
export const notificationService = {
  configureNotifications,
  requestPermissions,
  scheduleHydrationReminders: scheduleHydrationRemindersLoose,
  cancelAllReminders,
  cancelAll: cancelAllReminders,
  sendTestNotification,
  sendTest: sendTestNotification,
  snoozeReminder,
  getScheduledReminderIds,
  getUpcomingToday,
};
