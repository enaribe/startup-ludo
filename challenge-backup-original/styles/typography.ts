import { TextStyle } from 'react-native';

export const FONTS = {
  title: 'LuckiestGuy_400Regular',
  heading: 'LuckiestGuy_400Regular',
  body: 'OpenSans_400Regular',
  bodyMedium: 'OpenSans_500Medium',
  bodySemiBold: 'OpenSans_600SemiBold',
  bodyBold: 'OpenSans_700Bold',
  mono: 'SpaceMono_400Regular',
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const LETTER_SPACING = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Pre-defined text styles
export const TEXT_STYLES: Record<string, TextStyle> = {
  // Headings (LuckiestGuy)
  h1: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['4xl'],
    lineHeight: FONT_SIZES['4xl'] * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
  h2: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    lineHeight: FONT_SIZES['3xl'] * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
  h3: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    lineHeight: FONT_SIZES['2xl'] * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.normal,
  },
  h4: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.normal,
  },

  // Body text (OpenSans)
  bodyLarge: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  bodySmall: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },

  // Labels
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wider,
    textTransform: 'uppercase',
  },

  // Button text
  button: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
  buttonSmall: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
  },

  // Caption
  caption: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
  },
} as const;

export type FontKey = keyof typeof FONTS;
export type FontSizeKey = keyof typeof FONT_SIZES;
export type TextStyleKey = keyof typeof TEXT_STYLES;
