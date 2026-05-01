import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

type ServiceItemProps = {
  duration: number;
  isSelected: boolean;
  name: string;
  onToggle: (serviceId: string) => void;
  price: number;
  serviceId: string;
};

/**
 * Multi-select service row. Left: 20px gold check-square (filled when
 * selected) + serif italic name + mono duration. Right: serif price,
 * gold when selected, else muted. 1px `lineSoft` divider underneath
 * (caller is responsible for drawing it via list separator).
 *
 * Source: screens-booking.jsx ScrServiceSelect.
 */
export const ServiceItem = memo(function ServiceItem({
  duration,
  isSelected,
  name,
  onToggle,
  price,
  serviceId,
}: ServiceItemProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => onToggle(serviceId)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineSoft,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: isSelected ? colors.gold : colors.line,
            backgroundColor: isSelected ? colors.gold : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            borderCurve: 'continuous',
          }}
        >
          {isSelected ? <Icon name="check" size={12} color={colors.bg} sw={2.5} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fontFamilies.serif.italic,
              fontSize: 16,
              color: colors.ivory,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: fontFamilies.mono.regular,
              fontSize: 11,
              color: colors.muted,
              marginTop: 2,
              fontVariant: ['tabular-nums'],
            }}
          >
            {t('customer.serviceSelection.durationMinutes', { minutes: duration })}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontFamily: fontFamilies.serif.medium,
          fontSize: 17,
          color: isSelected ? colors.gold : colors.muted,
          fontVariant: ['tabular-nums'],
        }}
      >
        {t('customer.serviceSelection.priceValue', { price: price.toFixed(0) })}
      </Text>
    </Pressable>
  );
});
