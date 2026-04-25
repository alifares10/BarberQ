import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { useAppTheme } from '@/lib/theme';

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
  const { colors } = useAppTheme();

  return (
    <Pressable
      disabled={isDisabled}
      onPress={() => onSelect(date)}
      style={[
        styles.chip,
        { backgroundColor: isSelected ? colors.primary : colors.chip },
        isDisabled ? styles.disabled : null,
      ]}
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
    borderCurve: 'continuous',
    borderRadius: 14,
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  content: {
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
