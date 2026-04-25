import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/Text/Text';
import { useAppTheme } from '@/lib/theme';

type TimeSlotChipProps = {
  isSelected: boolean;
  onSelect: (time: string) => void;
  time: string;
};

export const TimeSlotChip = memo(function TimeSlotChip({ isSelected, onSelect, time }: TimeSlotChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => onSelect(time)}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primary : colors.chip,
          borderColor: isSelected ? colors.primary : colors.chipBorder,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      <Text color={isSelected ? '$inverseColor' : '$color'} fontWeight="700" textAlign="center">
        {time}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    borderCurve: 'continuous',
    borderRadius: 12,
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});
