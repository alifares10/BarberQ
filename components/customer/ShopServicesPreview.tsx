import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type ShopServicePreviewItem = {
  id: string;
  name: string;
};

type ShopServicesPreviewProps = {
  items: ShopServicePreviewItem[];
};

/**
 * Read-only preview of the top services on the Shop Detail screen.
 * The shop's services list (from `fetchActiveShops`) doesn't carry
 * duration/price — those live on the per-barber service rows. So
 * this preview shows just the serif italic name with a hairline
 * divider underneath; the full multi-select with prices happens on
 * `/booking/services` after the user picks a barber.
 *
 * Source: screens-booking.jsx ScrShopDetail services list (truncated).
 */
export const ShopServicesPreview = memo(function ShopServicesPreview({
  items,
}: ShopServicesPreviewProps) {
  const { colors } = useAppTheme();

  return (
    <View>
      {items.map((item) => (
        <View
          key={item.id}
          style={{
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineSoft,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fontFamilies.serif.italic,
              fontSize: 16,
              color: colors.ivory,
            }}
          >
            {item.name}
          </Text>
        </View>
      ))}
    </View>
  );
});
