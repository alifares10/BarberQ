import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type StatusKind =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'completed'
  | 'open'
  | 'closed';

export type StatusProps = {
  kind: StatusKind;
  /** Override the displayed label. Defaults to uppercased `kind`. */
  label?: string;
  /** Smaller variant — 5px dot, 10px label. */
  compact?: boolean;
};

/**
 * Dot + uppercase mono label. Replaces filled status pills throughout the app.
 * Source: tokens.jsx:187-204.
 */
export const Status = memo(function Status({ kind, label, compact = false }: StatusProps) {
  const { colors } = useAppTheme();

  const tone = (() => {
    switch (kind) {
      case 'confirmed':
      case 'open':
        return colors.sage;
      case 'pending':
        return colors.gold;
      case 'cancelled':
      case 'closed':
        return colors.terra;
      case 'completed':
        return colors.muted;
    }
  })();

  const dotSize = compact ? 5 : 6;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: tone,
        }}
      />
      <Text
        style={{
          fontFamily: fontFamilies.mono.regular,
          fontSize: compact ? 10 : 11,
          color: tone,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {label ?? kind}
      </Text>
    </View>
  );
});
