import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

type DateChipProps = {
  date: string;
  /** Day-of-month label, e.g. "16". */
  dateLabel: string;
  /** Day-of-week mono label, e.g. "WED" or single-letter "W". */
  dayLabel: string;
  isDisabled: boolean;
  isSelected: boolean;
  onSelect: (date: string) => void;
  /** Whether the date has any appointments — drives the gold dot indicator. */
  hasAppointments?: boolean;
};

/**
 * 7-day rail cell — hairline-bordered box, mono day-of-week + serif num.
 * Active = gold border + `goldDim` bg + gold text + small gold dot below
 * the number. Source: screens-booking.jsx ScrDateTime + screens-customer
 * Bookings rail.
 */
export const DateChip = memo(function DateChip({
  date,
  dateLabel,
  dayLabel,
  isDisabled,
  isSelected,
  onSelect,
  hasAppointments = false,
}: DateChipProps) {
  const { colors } = useAppTheme();

  const showDot = isSelected || hasAppointments;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={() => onSelect(date)}
      style={{
        flex: 1,
        height: 64,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: isSelected ? colors.gold : colors.line,
        backgroundColor: isSelected ? colors.goldDim : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        opacity: isDisabled ? 0.4 : 1,
        borderCurve: 'continuous',
        minWidth: 44,
      }}
    >
      <Text
        style={{
          fontFamily: fontFamilies.mono.regular,
          fontSize: 9,
          letterSpacing: 1.5,
          color: isSelected ? colors.gold : colors.muted,
          textTransform: 'uppercase',
        }}
      >
        {dayLabel}
      </Text>
      <Text
        style={{
          fontFamily: fontFamilies.serif.medium,
          fontSize: 18,
          color: isSelected ? colors.gold : colors.ivory,
          fontVariant: ['tabular-nums'],
        }}
      >
        {dateLabel}
      </Text>
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: showDot ? colors.gold : 'transparent',
        }}
      />
    </Pressable>
  );
});
