// themed input. animated floating label, error state, optional left/right icon.

import { type ReactNode, useCallback, useState } from 'react';
import {
  TextInput,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { radius, typography } from '@/theme';

import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  style,
  value,
  onFocus,
  onBlur,
  placeholder,
  ...rest
}: InputProps): JSX.Element {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const errorPulse = useSharedValue(0);

  const handleFocus: NonNullable<TextInputProps['onFocus']> = useCallback(
    (e) => {
      setFocused(true);
      focus.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      onFocus?.(e);
    },
    [focus, onFocus],
  );

  const handleBlur: NonNullable<TextInputProps['onBlur']> = useCallback(
    (e) => {
      setFocused(false);
      focus.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      onBlur?.(e);
    },
    [focus, onBlur],
  );

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? theme.colors.danger
      : focus.value > 0.5
        ? theme.colors.primary
        : theme.colors.border,
    shadowOpacity: focus.value * 0.35,
    shadowRadius: 4 + focus.value * 14,
  }));

  const hasValue = value != null && String(value).length > 0;

  return (
    <View className={className}>
      {label ? (
        <Text variant="caption" muted className="mb-2 ml-1 uppercase tracking-wider">
          {label}
        </Text>
      ) : null}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            height: 56,
            borderRadius: radius['2xl'],
            backgroundColor: theme.colors.surface,
            borderWidth: 1.5,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 0 },
          },
          borderStyle,
          style,
        ]}
      >
        {leftIcon ? <View style={{ marginRight: 10 }}>{leftIcon}</View> : null}
        <TextInput
          {...rest}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSubtle}
          selectionColor={theme.colors.primary}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontFamily: typography.bodyLg.fontFamily,
            fontSize: typography.bodyLg.fontSize,
            lineHeight: typography.bodyLg.lineHeight,
            includeFontPadding: false,
          }}
        />
        {rightIcon ? <View style={{ marginLeft: 10 }}>{rightIcon}</View> : null}
      </Animated.View>
      {error ? (
        <Text variant="small" tone="danger" className="ml-1 mt-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
