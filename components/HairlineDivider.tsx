import { memo } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { useAppTheme } from '@/lib/theme';

export type HairlineDividerProps = {
  /** `soft` (default) uses ivory@8%; `gold` uses gold hairline tone. */
  tone?: 'soft' | 'gold';
  /** Vertical inset above and below the line. */
  spacing?: number;
  style?: ViewStyle;
};

/**
 * 1px horizontal divider. Used between settings rows, list sections,
 * and as the visual ground line under headings.
 */
export const HairlineDivider = memo(function HairlineDivider({
  tone = 'soft',
  spacing = 0,
  style,
}: HairlineDividerProps) {
  const { colors } = useAppTheme();
  const color = tone === 'gold' ? colors.line : colors.lineSoft;

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: color,
          marginVertical: spacing,
        },
        style,
      ]}
    />
  );
});
