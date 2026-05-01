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

  // `alignItems: 'flex-end'` not `baseline` — the design uses CSS
  // baseline alignment, but RN's baseline alignment uses the FIRST
  // line of a multi-line column, which puts the big price's ascender
  // area above the row's measured height and iOS clips the top of
  // the digits. flex-end aligns the price's bottom with the bottom
  // of the left column, matching the design's visual intent (price
  // sits next to "Running total" label) and avoiding the clip.
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.goldBorder,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 12,
      }}
    >
      <View style={{ flexShrink: 1 }}>
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
          // Explicit lineHeight prevents iOS from cropping serif
          // ascenders/descenders on tall numerals.
          lineHeight: 38,
          color: colors.gold,
          fontVariant: ['tabular-nums'],
        }}
      >
        {t('customer.serviceSelection.priceValue', { price: totalPrice.toFixed(0) })}
      </Text>
    </View>
  );
});
