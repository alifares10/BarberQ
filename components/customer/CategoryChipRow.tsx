import { memo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type CategoryChipOption = {
  /** `null` is allowed for an "All" sentinel. */
  id: string | null;
  name: string;
};

export type CategoryChipRowProps = {
  options: CategoryChipOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Outer horizontal padding to align the row with content margins. */
  paddingHorizontal?: number;
};

/**
 * Horizontal-scrolling pill chips. Active = gold border + goldDim bg + gold
 * label, inactive = line border + muted label. Source: tokens.jsx,
 * ScrExplore (cats row).
 */
export const CategoryChipRow = memo(function CategoryChipRow({
  options,
  selectedId,
  onSelect,
  paddingHorizontal = 20,
}: CategoryChipRowProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal, gap: 8 }}
    >
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        return (
          <Pressable key={option.id ?? '__all__'} onPress={() => onSelect(option.id)}>
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isSelected ? colors.gold : colors.line,
                backgroundColor: isSelected ? colors.goldDim : 'transparent',
                borderCurve: 'continuous',
              }}
            >
              <Text
                style={{
                  fontFamily: fontFamilies.sans.medium,
                  fontSize: 12,
                  letterSpacing: 0.4,
                  color: isSelected ? colors.gold : colors.muted,
                }}
              >
                {option.name}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});
