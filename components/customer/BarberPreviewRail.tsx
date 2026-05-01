import { Image } from 'expo-image';
import { memo } from 'react';
import { ScrollView, View } from 'react-native';

import { Photo } from '@/components/Photo';
import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';
const DEFAULT_PLACEHOLDER = { blurhash: DEFAULT_BLURHASH };

export type BarberPreviewItem = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type BarberPreviewRailProps = {
  barbers: BarberPreviewItem[];
};

/**
 * Read-only horizontal rail of 64×64 portraits for the Shop Detail
 * screen. The first portrait gets a gold ring + gold name as a soft
 * accent; everyone else is hairline + ivory. Tap is intentionally
 * disabled — the only way forward is the bottom CTA. Source:
 * screens-booking.jsx ScrShopDetail "The Barbers" rail.
 */
export const BarberPreviewRail = memo(function BarberPreviewRail({
  barbers,
}: BarberPreviewRailProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
    >
      {barbers.map((barber, index) => {
        const isAccent = index === 0;
        return (
          <View key={barber.id} style={{ width: 64, alignItems: 'center' }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: isAccent ? colors.gold : colors.goldHair,
                padding: 2,
              }}
            >
              <View style={{ flex: 1, borderRadius: 28, overflow: 'hidden' }}>
                {barber.avatarUrl != null ? (
                  <Image
                    source={{ uri: barber.avatarUrl }}
                    placeholder={DEFAULT_PLACEHOLDER}
                    contentFit="cover"
                    transition={120}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Photo tone={index % 2 === 0 ? 'portrait' : 'mirror'} />
                )}
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fontFamilies.sans.regular,
                fontSize: 11,
                color: isAccent ? colors.gold : colors.ivory,
                marginTop: 8,
                maxWidth: 64,
              }}
            >
              {barber.name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
});
