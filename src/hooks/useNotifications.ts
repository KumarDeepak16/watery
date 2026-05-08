// notifications hook — perms + scheduling helpers

import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';

import type { Settings, UserProfile } from '@/storage';
import {
  cancelAllReminders,
  configureNotifications,
  getUpcomingToday,
  requestPermissions as requestPerms,
  scheduleHydrationReminders,
  sendTestNotification,
  snoozeReminder,
  type UpcomingReminder,
} from '@/services/notificationService';
import { hydrationMessages } from '@/utils/motivational';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface UseNotificationsResult {
  permissionsGranted: boolean | null;
  permission: PermissionStatus;
  requestPermissions: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  scheduleAll: (settings: Settings, profile: UserProfile | null) => Promise<string[]>;
  cancelAll: () => Promise<void>;
  sendTest: () => Promise<void>;
  snooze: (minutes: number) => Promise<void>;
  upcomingToday: UpcomingReminder[];
  refreshUpcoming: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsResult => {
  const [permissionsGranted, setGranted] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>('undetermined');
  const [upcomingToday, setUpcomingToday] = useState<UpcomingReminder[]>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        await configureNotifications();
        const status = await Notifications.getPermissionsAsync();
        if (!mounted) return;
        const granted =
          status.granted ||
          status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
          false;
        setGranted(granted);
        setPermission(
          granted
            ? 'granted'
            : status.canAskAgain === false
              ? 'denied'
              : 'undetermined',
        );
      } catch {
        // Expo Go blocks notifications on Android SDK 53+
        if (mounted) setPermission('denied');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const granted = await requestPerms();
    setGranted(granted);
    setPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  const refreshUpcoming = useCallback(async (): Promise<void> => {
    const list = await getUpcomingToday();
    setUpcomingToday(list);
  }, []);

  const scheduleAll = useCallback(
    async (settings: Settings, profile: UserProfile | null): Promise<string[]> => {
      if (!settings.notificationsEnabled || settings.silentMode) {
        await cancelAllReminders();
        return [];
      }
      const wakeTime = profile?.wakeTime ?? '07:00';
      const sleepTime = profile?.sleepTime ?? '22:00';
      return scheduleHydrationReminders({
        intervalMinutes: settings.reminderInterval,
        wakeTime,
        sleepTime,
        messages: hydrationMessages,
      });
    },
    [],
  );

  const cancelAll = useCallback(async (): Promise<void> => {
    await cancelAllReminders();
  }, []);

  const sendTest = useCallback(async (): Promise<void> => {
    await sendTestNotification();
  }, []);

  const snooze = useCallback(async (minutes: number): Promise<void> => {
    await snoozeReminder(minutes);
  }, []);

  return {
    permissionsGranted,
    permission,
    requestPermissions,
    requestPermission: requestPermissions,
    scheduleAll,
    cancelAll,
    sendTest,
    snooze,
    upcomingToday,
    refreshUpcoming,
  };
};
