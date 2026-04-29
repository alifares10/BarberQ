import type { ReactNode } from 'react';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type SettingsRowProps = {
  icon: IconName;
  label: string;
  /** Right-aligned trailing value (e.g. "On", "Dark"). */
  value?: string;
  /** Replaces `value` with a custom node (e.g. inline language toggle). */
  valueComponent?: ReactNode;
  /** Show a chevron and treat the row as pressable. */
  chev?: boolean;
  onPress?: () => void;
  /** Last row in a section — suppress the bottom hairline. */
  isLast?: boolean;
};

/**
 * Settings list row: icon + label + (value | component) + optional chev.
 * Hairline divider on the bottom unless `isLast`. Source: ScrProfile rows.
 */
export const SettingsRow = memo(function SettingsRow({
  icon,
  label,
  value,
  valueComponent,
  chev = false,
  onPress,
  isLast = false,
}: SettingsRowProps) {
  const { colors } = useAppTheme();

  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.lineSoft,
      }}
    >
      <Icon name={icon} size={18} color={colors.muted} />
      <Text
        style={{
          flex: 1,
          fontFamily: fontFamilies.sans.regular,
          fontSize: 14,
          color: colors.ivory,
        }}
      >
        {label}
      </Text>
      {valueComponent ?? (
        <>
          {value ? (
            <Text
              style={{
                fontFamily: fontFamilies.sans.regular,
                fontSize: 12,
                color: colors.muted,
                marginRight: chev ? 8 : 0,
              }}
            >
              {value}
            </Text>
          ) : null}
          {chev ? <Icon name="chev" size={14} color={colors.muted} /> : null}
        </>
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
});
