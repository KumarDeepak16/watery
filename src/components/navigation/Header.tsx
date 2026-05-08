// optional screen header. left + right slots, plus optional title.

import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';

export interface HeaderProps {
  left?: ReactNode;
  right?: ReactNode;
  title?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Header({ left, right, title, className, style }: HeaderProps): JSX.Element {
  return (
    <View
      className={className}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingVertical: 8,
          minHeight: 56,
        },
        style,
      ]}
    >
      <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center' }}>{left}</View>
      {title ? (
        <Text variant="h4" weight="semibold" align="center" style={{ flex: 1 }}>
          {title}
        </Text>
      ) : null}
      <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center' }}>{right}</View>
    </View>
  );
}
