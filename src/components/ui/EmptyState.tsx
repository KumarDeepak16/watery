import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  illustration?: ReactNode;
  emoji?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  illustration,
  emoji,
  iconName,
  compact,
  size = 180,
  style,
}: EmptyStateProps): JSX.Element {
  const { colors } = useTheme();
  const dim = compact ? Math.min(96, size) : size;

  return (
    <View
      style={[
        { alignItems: 'center', justifyContent: 'center', padding: compact ? 12 : 24 },
        style,
      ]}
    >
      {illustration ?? (
        iconName ? (
          <View
            style={{
              width: compact ? 56 : 80, height: compact ? 56 : 80,
              borderRadius: compact ? 28 : 40,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: colors.primaryGlow,
            }}
          >
            <Ionicons name={iconName} size={compact ? 28 : 40} color={colors.primary} />
          </View>
        ) : emoji ? (
          <Text variant="display" align="center" style={{ fontSize: compact ? 36 : 56 }}>
            {emoji}
          </Text>
        ) : (
          <View style={{ width: dim, height: dim, opacity: 0.3 }} />
        )
      )}

      <Text
        variant={compact ? 'h4' : 'h3'}
        weight="semibold"
        align="center"
        style={{ marginTop: compact ? 8 : 14 }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text variant="body" muted align="center" style={{ marginTop: 6, maxWidth: 280 }}>
          {subtitle}
        </Text>
      ) : null}

      {ctaLabel && onCtaPress ? (
        <Button title={ctaLabel} variant="primary" size="md" onPress={onCtaPress} style={{ marginTop: 20 }} />
      ) : null}
    </View>
  );
}
