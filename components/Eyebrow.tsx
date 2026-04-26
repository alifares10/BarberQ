import { memo } from 'react';
import type { TextStyle } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type EyebrowProps = {
  children: string;
  /** Override color — defaults to `muted`. Pass `colors.gold` for accent eyebrows. */
  color?: string;
  /** 9 / 10 / 11 — design uses 9 for inline tags, 11 for section headers. */
  size?: 9 | 10 | 11 | 12;
  style?: TextStyle;
};

/**
 * Tiny mono uppercase label. Letter-spacing 2px, regular weight. Used
 * for section headings, dates, step labels, mono tags on photo cards.
 */
export const Eyebrow = memo(function Eyebrow({
  children,
  color,
  size = 11,
  style,
}: EyebrowProps) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[
        {
          fontFamily: fontFamilies.mono.regular,
          fontSize: size,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: color ?? colors.muted,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
});
