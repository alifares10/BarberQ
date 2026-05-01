import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

type MonthStripProps = {
  /** Already-formatted "April 2026" string from the consumer's i18n date formatter. */
  label: string;
  /** Disabled when the previous window would dip into the past. */
  canGoPrev?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
};

/**
 * chevL · serif italic month/year · chev navigator above the Date rail.
 * Pressing the chevs shifts the visible 7-day window by ±7 days; the
 * label reflects whichever month the start of the window falls in.
 *
 * Source: screens-booking.jsx ScrDateTime month strip.
 */
export const MonthStrip = memo(function MonthStrip({
  label,
  canGoPrev = true,
  onPrev,
  onNext,
}: MonthStripProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Pressable
        hitSlop={12}
        onPress={onPrev}
        disabled={!canGoPrev || onPrev == null}
        style={{ opacity: canGoPrev && onPrev != null ? 1 : 0.4 }}
      >
        <Icon name="chevL" size={16} color={colors.muted} />
      </Pressable>
      <Text
        style={{
          fontFamily: fontFamilies.serif.italic,
          fontSize: 17,
          color: colors.ivory,
        }}
      >
        {label}
      </Text>
      <Pressable hitSlop={12} onPress={onNext} disabled={onNext == null}>
        <Icon name="chev" size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
});
