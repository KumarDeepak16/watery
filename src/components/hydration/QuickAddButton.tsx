// Quick-add intake button. Solid filled primary style, scale spring on press.

import { useCallback } from 'react';
import { Pressable, type StyleProp, type ViewStyle, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { springs } from '@/theme';

export interface QuickAddButtonProps {
  amountMl?: number;
  custom?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const formatAmount = (ml: number): { amount: string; unit: string } => {
  if (ml >= 1000) {
    return { amount: (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1), unit: 'L' };
  }
  return { amount: String(ml), unit: 'ml' };
};

export function QuickAddButton({
  amountMl,
  custom,
  onPress,
  style,
}: QuickAddButtonProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const handle = useCallback(() => {
    haptics.medium();
    onPress();
  }, [haptics, onPress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatted = amountMl !== undefined ? formatAmount(amountMl) : null;

  // Custom button: outlined ghost style
  // Amount buttons: solid filled
  const isCustom = !!custom;
  const bgColor = isCustom
    ? 'transparent'
    : isDark
      ? 'rgba(56,189,248,0.15)'
      : 'rgba(0,119,182,0.09)';
  const borderColor = isCustom ? theme.colors.border : 'transparent';
  const textColor = isCustom ? theme.colors.textMuted : theme.colors.primary;

  return (
    <Animated.View style={[animStyle, { flex: 1, minWidth: 0 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={custom ? 'Custom amount' : `Add ${amountMl ?? 0}ml`}
        onPressIn={() => { scale.value = withSpring(0.93, springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, springs.snappy); }}
        onPress={handle}
        style={{
          height: 64,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 18,
          backgroundColor: bgColor,
          borderWidth: 1,
          borderColor,
          gap: 3,
        }}
      >
        {isCustom ? (
          <>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface,
              }}
            >
              <Ionicons name="add" size={18} color={theme.colors.textMuted} />
            </View>
            <Text
              variant="micro"
              weight="medium"
              style={{ color: theme.colors.textMuted, marginTop: 1 }}
            >
              Custom
            </Text>
          </>
        ) : (
          <>
            <Text
              variant="h4"
              weight="bold"
              style={{ color: textColor, fontSize: 17, lineHeight: 20 }}
            >
              {formatted?.amount ?? '0'}
            </Text>
            <Text
              variant="micro"
              weight="semibold"
              style={{ color: textColor, opacity: 0.7, letterSpacing: 0.3 }}
            >
              {formatted?.unit ?? 'ml'}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
