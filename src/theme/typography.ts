export const fontFamilies = {
  jakartaRegular: 'PlusJakartaSans_400Regular',
  jakartaMedium: 'PlusJakartaSans_500Medium',
  jakartaSemibold: 'PlusJakartaSans_600SemiBold',
  jakartaBold: 'PlusJakartaSans_700Bold',
  groteskRegular: 'SpaceGrotesk_400Regular',
  groteskMedium: 'SpaceGrotesk_500Medium',
  groteskSemibold: 'SpaceGrotesk_600SemiBold',
  groteskBold: 'SpaceGrotesk_700Bold',
} as const;

export type TypographyToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
};

export const typography: Record<
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodyLg'
  | 'caption'
  | 'small'
  | 'micro',
  TypographyToken
> = {
  display: {
    fontFamily: fontFamilies.groteskBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fontFamilies.groteskBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamilies.jakartaSemibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fontFamilies.jakartaSemibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  h4: {
    fontFamily: fontFamilies.jakartaMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyLg: {
    fontFamily: fontFamilies.jakartaRegular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  body: {
    fontFamily: fontFamilies.jakartaRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamilies.jakartaMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  small: {
    fontFamily: fontFamilies.jakartaMedium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  micro: {
    fontFamily: fontFamilies.jakartaMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
};
