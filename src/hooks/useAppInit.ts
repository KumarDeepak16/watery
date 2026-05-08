// bootstrap: fonts, perms, notif config, background task, sound preload

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';

import { registerBackgroundTask } from '@/services/backgroundTaskService';
import {
  configureNotifications,
  requestPermissions,
} from '@/services/notificationService';
import { preloadSounds } from '@/services/audioService';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUserStore } from '@/stores/userStore';

export interface UseAppInitResult {
  isReady: boolean;
  fontsLoaded: boolean;
  permissionsGranted: boolean;
  error: string | null;
}

export const useAppInit = (): UseAppInitResult => {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const [permissionsGranted, setPerms] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        // hydrate stores from repos before UI mounts
        useUserStore.getState().hydrateFromStorage();
        useSettingsStore.getState().hydrateFromStorage();
        useGamificationStore.getState().hydrateFromStorage();

        await configureNotifications();
        const granted = await requestPermissions();
        if (!mounted) return;
        setPerms(granted);

        await registerBackgroundTask();
        await preloadSounds();
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setBootstrapped(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (fontError) setError(fontError.message);
  }, [fontError]);

  return {
    isReady: fontsLoaded && bootstrapped,
    fontsLoaded,
    permissionsGranted,
    error,
  };
};
