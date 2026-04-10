import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text/Text';

type DateChipProps = {
  date: string;
  dateLabel: string;
  dayLabel: string;
  isDisabled: boolean;
  isSelected: boolean;
  onSelect: (date: string) => void;
};

export const DateChip = memo(function DateChip({
  date,
  dateLabel,
  dayLabel,
  isDisabled,
  isSelected,
  onSelect,
}: DateChipProps) {
  return (
    <Pressable
      disabled={isDisabled}
      onPress={() => onSelect(date)}
      style={isSelected ? styles.chipSelected : styles.chip}
    >
      <View style={styles.content}>
        <Text color={isSelected ? '$inverseColor' : '$colorMuted'}>{dayLabel}</Text>
        <Text color={isSelected ? '$inverseColor' : '$color'} fontWeight="700">
          {dateLabel}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#e2e8f0',
    borderCurve: 'continuous',
    borderRadius: 14,
    minWidth: 86,
    opacity: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: '#0f172a',
    borderCurve: 'continuous',
    borderRadius: 14,
    minWidth: 86,
    opacity: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  content: {
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
  },
});
