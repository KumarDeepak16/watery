// badge card. tier glow, locked/unlocked variants. tap → onPress.

import { useCallback } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { radius, springs } from '@/theme';
import type { BadgeTier } from '@/storage/types';
import type { BadgeDefinition } from '@/constants/badges';

export interface BadgeCardProps {
  // either pass discrete fields, or a single `badge` definition
  id?: string;
  name?: string;
  description?: string;
  tier?: BadgeTier;
  badge?: BadgeDefinition;
  unlocked: boolean;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#B45309',
  silver: '#94A3B8',
  gold: '#F59E0B',
  platinum: '#22D3EE',
  diamond: '#A78BFA',
};

const STAR =
  'M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z';

export function BadgeCard({
  name,
  description,
  tier,
  badge,
  unlocked,
  onPress,
  className,
  style,
}: BadgeCardProps): JSX.Element {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const resolvedName = name ?? badge?.name ?? '';
  const resolvedDesc = description ?? badge?.description;
  const resolvedTier: BadgeTier = (tier ?? badge?.tier ?? 'bronze') as BadgeTier;
  const tierColor = TIER_COLORS[resolvedTier];

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handle = useCallback(() => {
    haptics.selection();
    onPress?.();
  }, [haptics, onPress]);

  return (
    <Pressable
      onPress={handle}
      onPressIn={() => (scale.value = withSpring(0.96, springs.snappy))}
      onPressOut={() => (scale.value = withSpring(1, springs.snappy))}
      style={{ width: 100 }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            width: 100,
            height: 128,
            overflow: 'hidden',
            padding: 14,
            borderRadius: radius['3xl'],
            backgroundColor: theme.colors.surface,
            borderWidth: 1.5,
            borderColor: unlocked ? tierColor : theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: unlocked ? tierColor : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: unlocked ? 0.55 : 0,
            shadowRadius: unlocked ? 18 : 0,
            elevation: unlocked ? 6 : 0,
            opacity: unlocked ? 1 : 0.55,
          },
          style,
        ]}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: unlocked ? tierColor : theme.colors.divider,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d={STAR}
              fill={unlocked ? '#ffffff' : theme.colors.textSubtle}
            />
          </Svg>
        </View>
        <Text variant="caption" weight="semibold" align="center" numberOfLines={1} ellipsizeMode="tail">
          {resolvedName}
        </Text>
        {resolvedDesc ? (
          <Text variant="micro" muted align="center" style={{ marginTop: 2 }} numberOfLines={2} ellipsizeMode="tail">
            {resolvedDesc}
          </Text>
        ) : null}
        {!unlocked ? (
          <Text variant="micro" subtle style={{ marginTop: 4 }}>
            Locked
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
