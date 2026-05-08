import { useEffect, useMemo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';
import type { HydrationEntry } from '@/storage';

export interface LastDrinkBadgeProps {
  entry?: HydrationEntry | { timestamp: number } | null;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const formatAgo = (ms: number): string => {
  if (ms < 0 || !Number.isFinite(ms)) return 'Just now';
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ago`;
};

export function LastDrinkBadge({ entry, className, style }: LastDrinkBadgeProps): JSX.Element {
  const { theme } = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const label = useMemo(() => {
    if (!entry) return 'No drinks yet';
    return formatAgo(now - entry.timestamp);
  }, [entry, now]);

  return (
    <View
      className={className}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 5,
        },
        style,
      ]}
    >
      <Ionicons name="water-outline" size={13} color={theme.colors.primary} />
      <Text variant="caption" weight="semibold" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
