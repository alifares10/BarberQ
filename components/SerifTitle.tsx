import { memo } from 'react';
import type { TextStyle } from 'react-native';

import { Text } from '@/components/Text/Text';
import { useAppTheme } from '@/lib/theme';

export type SerifTitleProps = {
  children: React.ReactNode;
  /** Display size — 28 default, 36 for hero, 22 for sub-titles. */
  size?: number;
  /** Render in italic for accent words / display headlines. */
  italic?: boolean;
  /** Tone — defaults to ivory; pass `gold` for accent words. */
  color?: string;
  /** Weight — light (300) / regular / medium / semibold / bold. */
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  style?: TextStyle;
};

/**
 * Fraunces (or Frank Ruhl Libre in HE) serif title. The redesign relies on
 * mixing italic and upright serif within a single headline, so consumers
 * compose two SerifTitles inline rather than pass a single string.
 */
export const SerifTitle = memo(function SerifTitle({
  children,
  size = 28,
  italic = false,
  color,
  weight = 'medium',
  style,
}: SerifTitleProps) {
  const { colors, fonts } = useAppTheme();

  const family = (() => {
    if (italic) {
      // We only have a single italic cut wired up — Fraunces 500 italic /
      // Frank Ruhl Libre regular for HE. Use it for all italic weights.
      return weight === 'medium' || weight === 'semibold' || weight === 'bold'
        ? fonts.serifItalic
        : fonts.serifItalic;
    }
    switch (weight) {
      case 'light':
      case 'regular':
        return fonts.serif;
      case 'medium':
        return fonts.serifMedium;
      case 'semibold':
      case 'bold':
        return fonts.serifBold;
    }
  })();

  return (
    <Text
      style={[
        {
          fontFamily: family,
          fontSize: size,
          lineHeight: size * 1.12,
          letterSpacing: -0.3,
          color: color ?? colors.ivory,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
});
