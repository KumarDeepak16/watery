// root layout. providers: gesture root, safe area, query client, theme. fonts via expo-font.

import 'react-native-gesture-handler';

import { useEffect, useMemo, useState } from 'react';
import { hydrateCache } from '@/storage/mmkv';
import { useUserStore } from '@/stores/useUserStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useThemeStore } from '@/stores/themeStore';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

import '../global.css';

// reanimated noisy strict-mode warnings off
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootInner(): JSX.Element {
  const { isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const isOnboarded = useUserStore((s) => s.isOnboarded);

  useEffect(() => {
    if (!segments.length) return;
    const inOnboarding = segments[0] === '(onboarding)';
    if (!isOnboarded && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (isOnboarded && inOnboarding) {
      router.replace('/(tabs)/home');
    }
  }, [isOnboarded, segments, router]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout(): JSX.Element | null {
  const [cacheReady, setCacheReady] = useState(false);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
        },
      }),
    [],
  );

  useEffect(() => {
    const bootstrap = async () => {
      await hydrateCache();
      await Promise.all([
        useUserStore.getState().rehydrate(),
        useSettingsStore.getState().rehydrate(),
        useGamificationStore.getState().rehydrate(),
        useThemeStore.getState().rehydrate(),
      ]);
      setCacheReady(true);
    };
    void bootstrap();
  }, []);

  useEffect(() => {
    if (fontsLoaded && cacheReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, cacheReady]);

  if (!fontsLoaded || !cacheReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={{ flex: 1 }}>
            <RootInner />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
