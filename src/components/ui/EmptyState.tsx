// empty state with optional Lottie animation, title, subtitle, CTA.

import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  // optional remote/local lottie source
  lottieSource?: string | object;
  illustration?: ReactNode;
  // simple emoji rendered above the title when no illustration/lottie provided
  emoji?: string;
  // ionicon alternative to emoji
  iconName?: keyof typeof Ionicons.glyphMap;
  // compact rendering with reduced padding
  compact?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  lottieSource,
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
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: compact ? 12 : 24,
        },
        style,
      ]}
    >
      {illustration ? (
        illustration
      ) : lottieSource ? (
        <LottieView
          autoPlay
          loop
          // lottie source can be a string URI or a parsed JSON object
          source={
            (typeof lottieSource === 'string'
              ? { uri: lottieSource }
              : lottieSource) as never
          }
          style={{ width: dim, height: dim }}
        />
      ) : iconName ? (
        <Ionicons name={iconName} size={compact ? 36 : 56} color={colors.textMuted} />
      ) : emoji ? (
        <Text variant="display" align="center" style={{ fontSize: compact ? 36 : 56 }}>
          {emoji}
        </Text>
      ) : (
        <View style={{ width: dim, height: dim, opacity: 0.4 }} />
      )}
      <Text
        variant={compact ? 'h4' : 'h3'}
        weight="semibold"
        align="center"
        style={{ marginTop: compact ? 6 : 12 }}
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
