// themed text. variant maps to typography token. muted/color shortcuts for theme-aware tinting.

import { type ReactNode, useMemo } from 'react';
import {
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodyLg'
  | 'caption'
  | 'small'
  | 'micro';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextFont = 'jakarta' | 'grotesk';
export type TextAlign = 'left' | 'center' | 'right';
export type TextTone =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning';

export interface TextProps extends Omit<RNTextProps, 'children' | 'style'> {
  variant?: TextVariant;
  weight?: TextWeight;
  font?: TextFont;
  align?: TextAlign;
  tone?: TextTone;
  muted?: boolean;
  subtle?: boolean;
  className?: string;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
  color?: string;
}

const JAKARTA_MAP: Record<TextWeight, string> = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

const GROTESK_MAP: Record<TextWeight, string> = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
};

const fontFor = (font: TextFont, weight: TextWeight): string => {
  return font === 'grotesk' ? GROTESK_MAP[weight] : JAKARTA_MAP[weight];
};

export function Text({
  variant = 'body',
  weight,
  font,
  align,
  tone,
  muted,
  subtle,
  className,
  style,
  color,
  children,
  ...rest
}: TextProps): JSX.Element {
  const { theme } = useTheme();
  const token = typography[variant];

  const resolvedColor = useMemo<string>(() => {
    if (color) return color;
    const t: TextTone = tone ?? (subtle ? 'subtle' : muted ? 'muted' : 'default');
    switch (t) {
      case 'muted':
        return theme.colors.textMuted;
      case 'subtle':
        return theme.colors.textSubtle;
      case 'primary':
        return theme.colors.primary;
      case 'danger':
        return theme.colors.danger;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'default':
      default:
        return theme.colors.text;
    }
  }, [color, tone, muted, subtle, theme.colors]);

  const fontFamily =
    font !== undefined || weight !== undefined
      ? fontFor(font ?? 'jakarta', weight ?? 'regular')
      : token.fontFamily;

  return (
    <RNText
      {...rest}
      className={className}
      allowFontScaling
      style={[
        {
          fontFamily,
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          letterSpacing: token.letterSpacing,
          color: resolvedColor,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
