import { memo } from 'react';
import type { TextInputProps, ViewStyle } from 'react-native';
import { I18nManager, Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type SearchBarProps = {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  onPressFilter?: () => void;
  style?: ViewStyle;
  autoFocus?: boolean;
} & Pick<TextInputProps, 'returnKeyType' | 'onSubmitEditing'>;

/**
 * Hairline-bordered 46px search row. Search icon left, optional gold filter
 * icon right. Source: tokens.jsx, screens-customer.jsx ScrExplore.
 */
export const SearchBar = memo(function SearchBar({
  value,
  onChangeText,
  placeholder,
  onPressFilter,
  style,
  autoFocus,
  returnKeyType = 'search',
  onSubmitEditing,
}: SearchBarProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          height: 46,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.line,
          borderCurve: 'continuous',
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      <Icon name="search" size={16} color={colors.muted} />
      <TextInput
        autoFocus={autoFocus}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        style={{
          flex: 1,
          fontFamily: fontFamilies.sans.regular,
          fontSize: 14,
          color: colors.ivory,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
          padding: 0,
        }}
      />
      {onPressFilter ? (
        <Pressable onPress={onPressFilter} hitSlop={8}>
          <Icon name="filter" size={16} color={colors.gold} />
        </Pressable>
      ) : null}
    </View>
  );
});
