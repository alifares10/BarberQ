import { memo } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

type TimeSlotChipProps = {
  isSelected: boolean;
  isDisabled?: boolean;
  onSelect: (time: string) => void;
  time: string;
};

/**
 * 40px hairline chip — sans tabular time, gold-fill on select.
 * Disabled variant uses `lineSoft` border + `mutedLow` text with a
 * line-through; the customer-facing slot generator only emits
 * available slots today, so the disabled visual is reserved for
 * future "near-miss" support.
 */
export const TimeSlotChip = memo(function TimeSlotChip({
  isSelected,
  isDisabled = false,
  onSelect,
  time,
}: TimeSlotChipProps) {
  const { colors } = useAppTheme();

  const borderColor = isSelected ? colors.gold : isDisabled ? colors.lineSoft : colors.line;
  const backgroundColor = isSelected ? colors.gold : 'transparent';
  const textColor = isSelected ? colors.bg : isDisabled ? colors.mutedLow : colors.ivory;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={() => onSelect(time)}
      style={{
        height: 40,
        flex: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        borderCurve: 'continuous',
      }}
    >
      <Text
        style={{
          fontFamily: isSelected ? fontFamilies.sans.semibold : fontFamilies.sans.regular,
          fontSize: 13,
          color: textColor,
          fontVariant: ['tabular-nums'],
          textDecorationLine: isDisabled ? 'line-through' : 'none',
        }}
      >
        {time}
      </Text>
    </Pressable>
  );
});
