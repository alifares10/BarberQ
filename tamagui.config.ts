import { createFont, createTamagui, createTokens } from 'tamagui';

import { appThemeColors, palette } from '@/constants/colors';
import { fontFamilies } from '@/lib/fonts';

// Inter — body sans. Inter has a wide UI rhythm; we map weight tokens to
// distinct cuts so `<SizableText fontWeight="600">` actually picks the
// SemiBold file.
const bodyFont = createFont({
  family: fontFamilies.sans.regular,
  size: {
    1: 12,
    2: 13,
    3: 14,
    4: 16,
    5: 18,
    6: 20,
    7: 24,
    true: 16,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 20,
    4: 24,
    5: 26,
    6: 28,
    7: 32,
    true: 24,
  },
  weight: {
    3: '300',
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
  letterSpacing: {
    4: 0,
    5: 0,
    6: 0,
    7: 0,
  },
  face: {
    300: { normal: fontFamilies.sans.light },
    400: { normal: fontFamilies.sans.regular },
    500: { normal: fontFamilies.sans.medium },
    600: { normal: fontFamilies.sans.semibold },
    700: { normal: fontFamilies.sans.bold },
  },
});

// Fraunces — serif display. Headings, italic accent words ("waiting.").
const headingFont = createFont({
  family: fontFamilies.serif.regular,
  size: {
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 38,
    true: 24,
  },
  lineHeight: {
    4: 22,
    5: 24,
    6: 30,
    7: 34,
    8: 38,
    9: 42,
    true: 30,
  },
  weight: {
    3: '300',
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
  letterSpacing: {
    4: -0.3,
    5: -0.3,
    6: -0.4,
    7: -0.4,
    8: -0.5,
  },
  face: {
    300: { normal: fontFamilies.serif.light },
    400: { normal: fontFamilies.serif.regular, italic: fontFamilies.serif.italic },
    500: { normal: fontFamilies.serif.medium, italic: fontFamilies.serif.mediumItalic },
    600: { normal: fontFamilies.serif.semibold },
    700: { normal: fontFamilies.serif.bold },
  },
});

// JetBrains Mono — eyebrows, step indicators, dates, numerics.
const monoFont = createFont({
  family: fontFamilies.mono.regular,
  size: {
    1: 9,
    2: 10,
    3: 11,
    4: 12,
    5: 13,
    true: 11,
  },
  lineHeight: {
    1: 12,
    2: 14,
    3: 15,
    4: 16,
    5: 18,
    true: 15,
  },
  weight: {
    4: '400',
    5: '500',
  },
  letterSpacing: {
    1: 1.5,
    2: 2,
    3: 2,
    4: 1.5,
    5: 1,
  },
  face: {
    400: { normal: fontFamilies.mono.regular },
    500: { normal: fontFamilies.mono.medium },
  },
});

// Frank Ruhl Libre — Hebrew serif, paired with Fraunces in RTL screens.
const serifHeFont = createFont({
  family: fontFamilies.serifHe.regular,
  size: headingFont.size,
  lineHeight: headingFont.lineHeight,
  weight: { 4: '400', 5: '500', 7: '700' },
  letterSpacing: headingFont.letterSpacing,
  face: {
    400: { normal: fontFamilies.serifHe.regular },
    500: { normal: fontFamilies.serifHe.medium },
    700: { normal: fontFamilies.serifHe.bold },
  },
});

// Heebo — Hebrew sans, paired with Inter in RTL screens.
const sansHeFont = createFont({
  family: fontFamilies.sansHe.regular,
  size: bodyFont.size,
  lineHeight: bodyFont.lineHeight,
  weight: { 3: '300', 4: '400', 5: '500', 6: '600', 7: '700' },
  letterSpacing: bodyFont.letterSpacing,
  face: {
    300: { normal: fontFamilies.sansHe.light },
    400: { normal: fontFamilies.sansHe.regular },
    500: { normal: fontFamilies.sansHe.medium },
    600: { normal: fontFamilies.sansHe.semibold },
    700: { normal: fontFamilies.sansHe.bold },
  },
});

const tokens = createTokens({
  color: {
    background: appThemeColors.dark.background,
    backgroundStrong: appThemeColors.dark.elevated,
    color: appThemeColors.dark.color,
    colorMuted: appThemeColors.dark.colorMuted,
    borderColor: appThemeColors.dark.border,
    primary: appThemeColors.dark.primary,
    primaryHover: palette.gold,
    primaryPress: appThemeColors.dark.primaryPress,
    accent: appThemeColors.dark.accent,
    accentHover: palette.gold,
    success: appThemeColors.dark.success,
    warning: appThemeColors.dark.statusPending,
    error: appThemeColors.dark.danger,
    card: appThemeColors.dark.card,
    cardMuted: appThemeColors.dark.surfaceMuted,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowStrong: 'rgba(0,0,0,0.7)',
    inverseColor: appThemeColors.dark.inverseColor,
    gold: palette.gold,
    goldDim: palette.goldDim,
    goldBorder: palette.goldBorder,
    goldHair: palette.goldHair,
    ivory: palette.ivory,
    sage: palette.sage,
    terra: palette.terra,
    line: palette.line,
    lineSoft: palette.lineSoft,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
    true: 16,
  },
  size: {
    0: 0,
    1: 28,
    2: 32,
    3: 36,
    4: 44,
    5: 52,
    6: 60,
    7: 72,
    true: 44,
  },
  radius: {
    0: 0,
    1: 6,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    true: 12,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
});

const themes = {
  light: {
    background: appThemeColors.light.background,
    backgroundHover: appThemeColors.light.surface,
    backgroundPress: appThemeColors.light.elevated,
    backgroundFocus: appThemeColors.light.surface,
    color: appThemeColors.light.color,
    colorHover: appThemeColors.light.color,
    colorPress: appThemeColors.light.colorMuted,
    colorFocus: appThemeColors.light.color,
    borderColor: appThemeColors.light.border,
    borderColorHover: appThemeColors.light.chipBorder,
    borderColorPress: appThemeColors.light.chipBorder,
    borderColorFocus: appThemeColors.light.gold,
    placeholderColor: appThemeColors.light.colorMuted,
    shadowColor: 'rgba(26,20,16,0.20)',
    primary: appThemeColors.light.primary,
    primaryHover: appThemeColors.light.primary,
    primaryPress: appThemeColors.light.primaryPress,
    accent: appThemeColors.light.accent,
    accentHover: appThemeColors.light.accent,
    accentPress: appThemeColors.light.primaryPress,
    success: appThemeColors.light.success,
    warning: appThemeColors.light.statusPending,
    error: appThemeColors.light.danger,
    card: appThemeColors.light.card,
    cardMuted: appThemeColors.light.surfaceMuted,
    inverseColor: appThemeColors.light.inverseColor,
    gold: appThemeColors.light.gold,
    goldDim: appThemeColors.light.goldDim,
    goldBorder: appThemeColors.light.goldBorder,
    goldHair: appThemeColors.light.goldHair,
    ivory: appThemeColors.light.ivory,
    sage: appThemeColors.light.sage,
    terra: appThemeColors.light.terra,
    line: appThemeColors.light.line,
    lineSoft: appThemeColors.light.lineSoft,
  },
  dark: {
    background: appThemeColors.dark.background,
    backgroundHover: appThemeColors.dark.surface,
    backgroundPress: appThemeColors.dark.elevated,
    backgroundFocus: appThemeColors.dark.surface,
    color: appThemeColors.dark.color,
    colorHover: appThemeColors.dark.color,
    colorPress: appThemeColors.dark.colorMuted,
    colorFocus: appThemeColors.dark.color,
    borderColor: appThemeColors.dark.border,
    borderColorHover: appThemeColors.dark.chipBorder,
    borderColorPress: appThemeColors.dark.chipBorder,
    borderColorFocus: appThemeColors.dark.gold,
    placeholderColor: appThemeColors.dark.colorMuted,
    shadowColor: 'rgba(0,0,0,0.5)',
    primary: appThemeColors.dark.primary,
    primaryHover: appThemeColors.dark.primary,
    primaryPress: appThemeColors.dark.primaryPress,
    accent: appThemeColors.dark.accent,
    accentHover: appThemeColors.dark.accent,
    accentPress: appThemeColors.dark.primaryPress,
    success: appThemeColors.dark.success,
    warning: appThemeColors.dark.statusPending,
    error: appThemeColors.dark.danger,
    card: appThemeColors.dark.card,
    cardMuted: appThemeColors.dark.surfaceMuted,
    inverseColor: appThemeColors.dark.inverseColor,
    gold: appThemeColors.dark.gold,
    goldDim: appThemeColors.dark.goldDim,
    goldBorder: appThemeColors.dark.goldBorder,
    goldHair: appThemeColors.dark.goldHair,
    ivory: appThemeColors.dark.ivory,
    sage: appThemeColors.dark.sage,
    terra: appThemeColors.dark.terra,
    line: appThemeColors.dark.line,
    lineSoft: appThemeColors.dark.lineSoft,
  },
} as const;

const media = {
  xs: { maxWidth: 480 },
  sm: { maxWidth: 768 },
  md: { maxWidth: 1024 },
  gtSm: { minWidth: 769 },
  short: { maxHeight: 820 },
  tall: { minHeight: 821 },
};

const config = createTamagui({
  defaultTheme: 'dark',
  fonts: {
    body: bodyFont,
    heading: headingFont,
    mono: monoFont,
    serifHe: serifHeFont,
    sansHe: sansHeFont,
  },
  media,
  shouldAddPrefersColorThemes: true,
  themes,
  tokens,
});

export type AppTamaguiConfig = typeof config;

declare module 'tamagui' {
  // Tamagui uses module augmentation to wire the generated config types.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default config;
