import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/Text/Text';

type TimeSlotChipProps = {
  isSelected: boolean;
  onSelect: (time: string) => void;
  time: string;
};

export const TimeSlotChip = memo(function TimeSlotChip({ isSelected, onSelect, time }: TimeSlotChipProps) {
  return (
    <Pressable onPress={() => onSelect(time)} style={isSelected ? styles.chipSelected : styles.chip}>
      <Text color={isSelected ? '$inverseColor' : '$color'} fontWeight="700" textAlign="center">
        {time}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});
