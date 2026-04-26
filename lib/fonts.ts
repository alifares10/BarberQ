import { useFonts } from 'expo-font';

// Import each weight from its subpath to avoid Metro bundling every weight in
// the @expo-google-fonts packages (saves ~5MB).
import { Fraunces_300Light } from '@expo-google-fonts/fraunces/300Light';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Fraunces_500Medium_Italic } from '@expo-google-fonts/fraunces/500Medium_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';

import { FrankRuhlLibre_400Regular } from '@expo-google-fonts/frank-ruhl-libre/400Regular';
import { FrankRuhlLibre_500Medium } from '@expo-google-fonts/frank-ruhl-libre/500Medium';
import { FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre/700Bold';

import { Heebo_300Light } from '@expo-google-fonts/heebo/300Light';
import { Heebo_400Regular } from '@expo-google-fonts/heebo/400Regular';
import { Heebo_500Medium } from '@expo-google-fonts/heebo/500Medium';
import { Heebo_600SemiBold } from '@expo-google-fonts/heebo/600SemiBold';
import { Heebo_700Bold } from '@expo-google-fonts/heebo/700Bold';

import { Inter_300Light } from '@expo-google-fonts/inter/300Light';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';

import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';

/**
 * Each weight is registered as its own family name so the renderer can pick
 * the right glyph when we set `fontFamily: 'Fraunces-Italic'` or
 * `fontFamily: 'Inter-SemiBold'`. Variable fonts would be cleaner, but the
 * Google package ships static cuts and this is the reliable cross-platform
 * approach.
 */
export const fontFamilies = {
  serif: {
    light: 'Fraunces-Light',
    regular: 'Fraunces-Regular',
    italic: 'Fraunces-Italic',
    medium: 'Fraunces-Medium',
    mediumItalic: 'Fraunces-MediumItalic',
    semibold: 'Fraunces-SemiBold',
    bold: 'Fraunces-Bold',
  },
  sans: {
    light: 'Inter-Light',
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  mono: {
    regular: 'JetBrainsMono-Regular',
    medium: 'JetBrainsMono-Medium',
  },
  serifHe: {
    regular: 'FrankRuhlLibre-Regular',
    medium: 'FrankRuhlLibre-Medium',
    bold: 'FrankRuhlLibre-Bold',
  },
  sansHe: {
    light: 'Heebo-Light',
    regular: 'Heebo-Regular',
    medium: 'Heebo-Medium',
    semibold: 'Heebo-SemiBold',
    bold: 'Heebo-Bold',
  },
} as const;

const fontMap = {
  'Fraunces-Light': Fraunces_300Light,
  'Fraunces-Regular': Fraunces_400Regular,
  'Fraunces-Italic': Fraunces_400Regular_Italic,
  'Fraunces-Medium': Fraunces_500Medium,
  'Fraunces-MediumItalic': Fraunces_500Medium_Italic,
  'Fraunces-SemiBold': Fraunces_600SemiBold,
  'Fraunces-Bold': Fraunces_700Bold,

  'Inter-Light': Inter_300Light,
  'Inter-Regular': Inter_400Regular,
  'Inter-Medium': Inter_500Medium,
  'Inter-SemiBold': Inter_600SemiBold,
  'Inter-Bold': Inter_700Bold,

  'JetBrainsMono-Regular': JetBrainsMono_400Regular,
  'JetBrainsMono-Medium': JetBrainsMono_500Medium,

  'FrankRuhlLibre-Regular': FrankRuhlLibre_400Regular,
  'FrankRuhlLibre-Medium': FrankRuhlLibre_500Medium,
  'FrankRuhlLibre-Bold': FrankRuhlLibre_700Bold,

  'Heebo-Light': Heebo_300Light,
  'Heebo-Regular': Heebo_400Regular,
  'Heebo-Medium': Heebo_500Medium,
  'Heebo-SemiBold': Heebo_600SemiBold,
  'Heebo-Bold': Heebo_700Bold,
};

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts(fontMap);
  return { fontsLoaded, fontError };
}
