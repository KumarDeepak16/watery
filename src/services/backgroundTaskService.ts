// background-fetch task: nudge user if behind on goal

import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import {
  BACKGROUND_TASK_NAME,
  NOTIFICATION_CHANNEL_ID,
} from '@/constants';
import { hydrationRepository } from '@/storage';
import { computeDailyGoal, useUserStore } from '@/stores/userStore';
import { hydrationMessages } from '@/utils/motivational';

const fireBehindNotification = async (): Promise<void> => {
  const msg = hydrationMessages[Math.floor(Math.random() * hydrationMessages.length)] ??
    'Time to hydrate';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'You are behind on hydration',
      body: msg,
      sound: 'aqua-drop',
      ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
};

// guard re-defines on hot reload
if (!TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)) {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    try {
      const profile = useUserStore.getState().profile;
      const goal = computeDailyGoal(profile);
      const total = hydrationRepository.getTodayTotal();
      const now = new Date();
      const hour = now.getHours();
      // expected progress proportional to hours since wake (assume 7am-10pm window)
      const expected = Math.max(0, Math.min(1, (hour - 7) / 15)) * goal;
      if (total + 200 < expected) {
        await fireBehindNotification();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
      return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export const registerBackgroundTask = async (): Promise<boolean> => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      return false;
    }
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    return true;
  } catch {
    return false;
  }
};

export const unregisterBackgroundTask = async (): Promise<void> => {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (registered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    }
  } catch {
    // ignore
  }
};

export const getBackgroundStatus = async (): Promise<{
  status: BackgroundFetch.BackgroundFetchStatus | null;
  registered: boolean;
}> => {
  const status = await BackgroundFetch.getStatusAsync();
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  return { status, registered };
};
