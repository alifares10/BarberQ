import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';

type ShopCardProps = {
  address: string;
  coverImageUrl: string | null;
  distance: string | null;
  name: string;
  onPress: (shopId: string) => void;
  shopId: string;
};

export const ShopCard = memo(function ShopCard({ address, coverImageUrl, distance, name, onPress, shopId }: ShopCardProps) {
  return (
    <Pressable onPress={() => onPress(shopId)}>
      <Card>
        <View style={styles.coverContainer}>
          {coverImageUrl != null ? (
            <Image
              contentFit="cover"
              placeholder={{ blurhash: DEFAULT_BLURHASH }}
              source={{ uri: coverImageUrl }}
              style={styles.coverImage}
              transition={150}
            />
          ) : (
            <View style={styles.coverFallback}>
              <Text color="$colorMuted">BarberQ</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text fontWeight="700">{name}</Text>
          <Text color="$colorMuted">{address}</Text>
          {distance != null ? <Text color="$colorMuted">{distance}</Text> : null}
        </View>
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  content: {
    gap: 4,
  },
  coverContainer: {
    borderCurve: 'continuous',
    borderRadius: 16,
    boxShadow: '0px 8px 24px rgba(2, 6, 23, 0.08)',
    height: 132,
    overflow: 'hidden',
    width: '100%',
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    flex: 1,
    justifyContent: 'center',
  },
  coverImage: {
    height: '100%',
    width: '100%',
  },
});
