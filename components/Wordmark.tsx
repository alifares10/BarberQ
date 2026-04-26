import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { Text } from '@/components/Text/Text';

export type WordmarkProps = {
  size?: number;
  color?: string;
  /** Render the wordmark in upright (no italic) form. */
  mono?: boolean;
};

/**
 * BarberQ wordmark — custom razor + comb monogram + Fraunces "BarberQ"
 * lockup with italic "Barber" and upright "Q". Source: tokens.jsx:127-143.
 */
export const Wordmark = memo(function Wordmark({
  size = 28,
  color,
  mono = false,
}: WordmarkProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.gold;
  const markSize = size;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.42 }}>
      <Svg
        width={markSize * 1.05}
        height={markSize}
        viewBox="0 0 32 30"
        fill="none"
        stroke={ink}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M6 4h8l1.5 5H4.5L6 4Z" />
        <Path d="M9.5 9v9" />
        <Path d="M5 18h9l-1 7H6l-1-7Z" />
        <Path d="M19 6h10v3H19zM19 9v8M22 17v3M25 17v3M28 17v3" />
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text
          style={{
            fontFamily: mono ? fontFamilies.serif.medium : fontFamilies.serif.mediumItalic,
            fontSize: size * 0.86,
            color: ink,
            letterSpacing: size * 0.06,
            lineHeight: size,
          }}
        >
          Barber
        </Text>
        <Text
          style={{
            fontFamily: fontFamilies.serif.semibold,
            fontSize: size * 0.86,
            color: ink,
            letterSpacing: size * 0.06,
            lineHeight: size,
          }}
        >
          Q
        </Text>
      </View>
    </View>
  );
});
