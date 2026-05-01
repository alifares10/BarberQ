import { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

type RunningTotalBarProps = {
  count: number;
  totalMinutes: number;
  totalPrice: number;
};

/**
 * Sticky-ish footer above the Services-screen CTA. Gold-bordered top
 * hairline, mono count/duration eyebrow + serif "Running total" label
 * on the left, big serif gold price on the right.
 *
 * Source: screens-booking.jsx ScrServiceSelect.
 */
export const RunningTotalBar = memo(function RunningTotalBar({
  count,
  totalMinutes,
  totalPrice,
}: RunningTotalBarProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.goldBorder,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: fontFamilies.mono.regular,
            fontSize: 9,
            color: colors.muted,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {t('booking.servicesRunningTotalCount', { count, minutes: totalMinutes })}
        </Text>
        <Text
          style={{
            fontFamily: fontFamilies.serif.medium,
            fontSize: 14,
            color: colors.ivory,
            marginTop: 4,
          }}
        >
          {t('booking.servicesRunningTotalLabel')}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fontFamilies.serif.medium,
          fontSize: 32,
          color: colors.gold,
          fontVariant: ['tabular-nums'],
        }}
      >
        {t('customer.serviceSelection.priceValue', { price: totalPrice.toFixed(0) })}
      </Text>
    </View>
  );
});
