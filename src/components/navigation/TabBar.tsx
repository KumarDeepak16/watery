import { useCallback, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';

// Short labels — max 6 chars to avoid overflow
const TAB_SHORT: Record<string, string> = {
  home: 'Home',
  history: 'Stats',      // shortened
  reminders: 'Remind',   // shortened
  profile: 'Profile',
};

const ICON_OUTLINE: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  history: 'bar-chart-outline',
  reminders: 'notifications-outline',
  profile: 'person-outline',
};

const ICON_FILLED: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  history: 'bar-chart',
  reminders: 'notifications',
  profile: 'person',
};

export interface TabBarProps extends BottomTabBarProps {}

const TAB_H = 60;

export function TabBar({ state, navigation, descriptors }: TabBarProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  const visibleRoutes = useMemo(
    () =>
      state.routes.filter((r) => {
        const s = descriptors[r.key]?.options.tabBarStyle as { display?: string } | undefined;
        return s?.display !== 'none';
      }),
    [state.routes, descriptors],
  );

  const onPress = useCallback(
    (name: string, focused: boolean) => {
      if (focused) return;
      haptics.selection();
      navigation.navigate(name as never);
    },
    [haptics, navigation],
  );

  const useBlur = Platform.OS === 'ios';
  const bottomPad = Platform.OS === 'android' ? 8 : insets.bottom + 8;

  const bgColor = isDark ? 'rgba(8,13,26,0.92)' : 'rgba(255,255,255,0.94)';
  const borderColor = isDark ? 'rgba(56,189,248,0.18)' : 'rgba(0,0,0,0.09)';

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: bottomPad,
      }}
    >
      {/* shadow wrapper — overflow visible for shadow */}
      <View
        style={{
          borderRadius: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.45 : 0.18,
          shadowRadius: 16,
          elevation: 18,
        }}
      >
        {/* clip wrapper */}
        <View style={{ borderRadius: 28, overflow: 'hidden' }}>
          {useBlur && (
            <BlurView
              intensity={40}
              tint={isDark ? 'dark' : 'light'}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
          )}

          {/* bg overlay */}
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: bgColor,
              borderRadius: 28,
              borderWidth: 1,
              borderColor,
            }}
          />

          {/* tabs */}
          <View style={{ height: TAB_H, flexDirection: 'row' }}>
            {visibleRoutes.map((route, idx) => {
              const focused = state.index === idx;
              const label = TAB_SHORT[route.name] ?? route.name;
              const iconName = focused
                ? (ICON_FILLED[route.name] ?? 'ellipse')
                : (ICON_OUTLINE[route.name] ?? 'ellipse-outline');
              const activeColor = theme.colors.primary;
              const inactiveColor = theme.colors.textMuted;

              return (
                <Pressable
                  key={route.key}
                  onPress={() => onPress(route.name, focused)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: TAB_H,
                    paddingVertical: 8,
                    gap: 3,
                  }}
                >
                  {/* active pill covering icon + label area */}
                  {focused && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        bottom: 10,
                        left: 8,
                        right: 8,
                        borderRadius: 18,
                        backgroundColor: isDark
                          ? 'rgba(56,189,248,0.18)'
                          : 'rgba(0,119,182,0.12)',
                      }}
                    />
                  )}

                  <Ionicons
                    name={iconName}
                    size={focused ? 22 : 20}
                    color={focused ? activeColor : inactiveColor}
                  />

                  <Text
                    variant="micro"
                    weight={focused ? 'semibold' : 'regular'}
                    style={{
                      fontSize: 10,
                      letterSpacing: 0.1,
                      color: focused ? activeColor : inactiveColor,
                      opacity: focused ? 1 : 0.65,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
