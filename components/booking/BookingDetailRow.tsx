import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

type BookingDetailRowProps = {
  /** Mono uppercase label, e.g. "WHEN", "DURATION", "SERVICES". */
  label: string;
  value: string;
};

/**
 * Two-column row used inside the Confirm sheet. Mono-uppercase label
 * on the left, sans tabular value on the right. Source:
 * screens-booking.jsx ScrConfirm detail rows.
 */
export const BookingDetailRow = memo(function BookingDetailRow({
  label,
  value,
}: BookingDetailRowProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontFamily: fontFamilies.mono.regular,
          fontSize: 9,
          color: colors.muted,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          fontFamily: fontFamilies.sans.regular,
          fontSize: 13,
          color: colors.ivory,
          fontVariant: ['tabular-nums'],
          textAlign: 'right',
          flexShrink: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
});
