import { useColorScheme } from 'react-native';

import { appThemeColors } from '@/constants/colors';

export type AppThemeName = keyof typeof appThemeColors;
export type AppThemeColors = typeof appThemeColors.light;

export function getAppThemeColors(colorScheme: AppThemeName | null | undefined) {
  return colorScheme === 'dark' ? appThemeColors.dark : appThemeColors.light;
}

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const name: AppThemeName = colorScheme === 'dark' ? 'dark' : 'light';

  return {
    colors: appThemeColors[name],
    isDark: name === 'dark',
    name,
  };
}
