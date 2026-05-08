// circular initials/image avatar.

import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Text } from './Text';

export interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  ring?: boolean;
}

const initialsFor = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
};

export function Avatar({ name, uri, size = 44, style, ring }: AvatarProps): JSX.Element {
  const { theme } = useTheme();
  const radius = size / 2;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primaryGlow,
          borderWidth: ring ? 2 : 0,
          borderColor: theme.colors.primary,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text
          variant="h4"
          weight="bold"
          color={theme.colors.primary}
          style={{ fontSize: size * 0.4, lineHeight: size * 0.45 }}
        >
          {initialsFor(name)}
        </Text>
      )}
    </View>
  );
}
