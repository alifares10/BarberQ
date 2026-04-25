import { createFont, createTamagui, createTokens } from 'tamagui';

import { appThemeColors, colors } from '@/constants/colors';

const bodyFont = createFont({
  family: 'System',
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
});

const headingFont = createFont({
  family: 'System',
  size: {
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    true: 24,
  },
  lineHeight: {
    4: 22,
    5: 24,
    6: 30,
    7: 34,
    8: 38,
    true: 30,
  },
  weight: {
    6: '600',
    7: '700',
    8: '800',
  },
  letterSpacing: {
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
  },
});

const tokens = createTokens({
  color: {
    background: appThemeColors.light.background,
    backgroundStrong: colors.slate100,
    color: appThemeColors.light.color,
    colorMuted: appThemeColors.light.colorMuted,
    borderColor: appThemeColors.light.border,
    primary: appThemeColors.light.primary,
    primaryHover: colors.slate800,
    primaryPress: appThemeColors.light.primaryPress,
    accent: appThemeColors.light.accent,
    accentHover: colors.indigo600,
    success: colors.emerald600,
    warning: colors.amber600,
    error: colors.red600,
    card: appThemeColors.light.card,
    cardMuted: appThemeColors.light.surfaceMuted,
    shadowColor: colors.shadow,
    shadowStrong: colors.shadowStrong,
    inverseColor: colors.white,
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
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    true: 16,
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
    backgroundHover: colors.slate100,
    backgroundPress: colors.slate200,
    backgroundFocus: colors.slate100,
    color: appThemeColors.light.color,
    colorHover: colors.slate900,
    colorPress: colors.slate800,
    colorFocus: appThemeColors.light.color,
    borderColor: appThemeColors.light.border,
    borderColorHover: colors.slate300,
    borderColorPress: colors.slate300,
    borderColorFocus: colors.indigo500,
    placeholderColor: colors.slate500,
    shadowColor: colors.shadow,
    primary: appThemeColors.light.primary,
    primaryHover: colors.slate800,
    primaryPress: appThemeColors.light.primaryPress,
    accent: appThemeColors.light.accent,
    accentHover: colors.indigo600,
    accentPress: colors.violet500,
    success: colors.emerald600,
    warning: colors.amber600,
    error: colors.red600,
    card: appThemeColors.light.card,
    cardMuted: appThemeColors.light.surfaceMuted,
    inverseColor: appThemeColors.light.inverseColor,
  },
  dark: {
    background: appThemeColors.dark.background,
    backgroundHover: colors.slate900,
    backgroundPress: colors.slate800,
    backgroundFocus: colors.slate900,
    color: appThemeColors.dark.color,
    colorHover: colors.white,
    colorPress: colors.slate100,
    colorFocus: colors.white,
    borderColor: appThemeColors.dark.border,
    borderColorHover: colors.slate600,
    borderColorPress: colors.slate500,
    borderColorFocus: colors.indigo500,
    placeholderColor: colors.slate400,
    shadowColor: 'rgba(2, 6, 23, 0.5)',
    primary: appThemeColors.dark.primary,
    primaryHover: colors.slate100,
    primaryPress: appThemeColors.dark.primaryPress,
    accent: appThemeColors.dark.accent,
    accentHover: '#a78bfa',
    accentPress: '#c4b5fd',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    card: appThemeColors.dark.card,
    cardMuted: appThemeColors.dark.surfaceMuted,
    inverseColor: appThemeColors.dark.inverseColor,
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
  defaultTheme: 'light',
  fonts: {
    body: bodyFont,
    heading: headingFont,
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
