// themed hairline divider

import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface DividerProps {
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  inset?: number;
}

export function Divider({ vertical, style, className, inset = 0 }: DividerProps): JSX.Element {
  const { theme } = useTheme();
  return (
    <View
      className={className}
      style={[
        vertical
          ? { width: 1, alignSelf: 'stretch', marginHorizontal: inset }
          : { height: 1, alignSelf: 'stretch', marginVertical: inset },
        { backgroundColor: theme.colors.divider },
        style,
      ]}
    />
  );
}
