import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

import { appThemeColors } from '@/constants/colors';
import { fontFamilies } from '@/lib/fonts';

export type AppThemeName = keyof typeof appThemeColors;
export type AppThemeColors = typeof appThemeColors.light;

export function getAppThemeColors(colorScheme: AppThemeName | null | undefined) {
  return colorScheme === 'dark' ? appThemeColors.dark : appThemeColors.light;
}

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const name: AppThemeName = colorScheme === 'dark' ? 'dark' : 'light';
  const { i18n } = useTranslation();
  const isHebrew = i18n.language?.startsWith('he') ?? false;

  return {
    colors: appThemeColors[name],
    isDark: name === 'dark',
    name,
    fonts: {
      // Headings flip to Frank Ruhl Libre in Hebrew, Fraunces otherwise.
      serif: isHebrew ? fontFamilies.serifHe.regular : fontFamilies.serif.regular,
      serifItalic: isHebrew ? fontFamilies.serifHe.regular : fontFamilies.serif.italic,
      serifMedium: isHebrew ? fontFamilies.serifHe.medium : fontFamilies.serif.medium,
      serifBold: isHebrew ? fontFamilies.serifHe.bold : fontFamilies.serif.bold,
      sans: isHebrew ? fontFamilies.sansHe.regular : fontFamilies.sans.regular,
      sansMedium: isHebrew ? fontFamilies.sansHe.medium : fontFamilies.sans.medium,
      sansSemibold: isHebrew ? fontFamilies.sansHe.semibold : fontFamilies.sans.semibold,
      sansBold: isHebrew ? fontFamilies.sansHe.bold : fontFamilies.sans.bold,
      mono: fontFamilies.mono.regular,
      monoMedium: fontFamilies.mono.medium,
    },
  };
}
