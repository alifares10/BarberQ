import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText, Card, ExploreMap, Input, LoadingScreen, ShopCard, Text } from '@/components';
import { calculateDistanceKm, formatDistance } from '@/lib/customer/distance';
import { fetchActiveShops, type CustomerShop } from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';

const TEL_AVIV_COORDINATES = {
  latitude: 32.0853,
  longitude: 34.7818,
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type ServiceFilterOption = {
  id: string;
  name: string;
};

type LocationState = 'denied' | 'granted' | 'unknown';

type ShopDistance = {
  distanceKm: number | null;
  shop: CustomerShop;
};

type ShopRow = {
  address: string;
  coverImageUrl: string | null;
  distanceLabel: string | null;
  name: string;
  shopId: string;
};

const ShopListItem = memo(function ShopListItem({
  item,
  onPress,
}: {
  item: ShopRow;
  onPress: (shopId: string) => void;
}) {
  return (
    <ShopCard
      address={item.address}
      coverImageUrl={item.coverImageUrl}
      distance={item.distanceLabel}
      name={item.name}
      onPress={onPress}
      shopId={item.shopId}
    />
  );
});

export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('unknown');
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const shopsQuery = useQuery({
    queryFn: fetchActiveShops,
    queryKey: customerQueryKeys.activeShops(),
  });

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (permission.status !== 'granted') {
          setLocationState('denied');
          setUserCoordinates(null);

          return;
        }

        const position = await Location.getCurrentPositionAsync({});

        if (!isMounted) {
          return;
        }

        setLocationState('granted');
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setLocationState('denied');
        setUserCoordinates(null);
      }
    };

    void loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const shops = useMemo(() => shopsQuery.data ?? [], [shopsQuery.data]);
  const serviceOptions = useMemo(() => {
    const uniqueServices = new Map<string, ServiceFilterOption>();

    for (const shop of shops) {
      for (const service of shop.services) {
        if (!uniqueServices.has(service.id)) {
          uniqueServices.set(service.id, {
            id: service.id,
            name: service.name,
          });
        }
      }
    }

    return Array.from(uniqueServices.values()).sort((optionA, optionB) => optionA.name.localeCompare(optionB.name));
  }, [shops]);

  const shopsWithDistance = useMemo(() => {
    const mappedShops = shops.map((shop) => {
      if (userCoordinates == null) {
        return {
          distanceKm: null,
          shop,
        } satisfies ShopDistance;
      }

      return {
        distanceKm: calculateDistanceKm(userCoordinates.latitude, userCoordinates.longitude, shop.latitude, shop.longitude),
        shop,
      } satisfies ShopDistance;
    });

    return mappedShops.sort((itemA, itemB) => {
      if (itemA.distanceKm == null || itemB.distanceKm == null) {
        return itemA.shop.created_at.localeCompare(itemB.shop.created_at);
      }

      return itemA.distanceKm - itemB.distanceKm;
    });
  }, [shops, userCoordinates]);

  const filteredShops = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return shopsWithDistance.filter(({ shop }) => {
      const matchesSearch =
        normalizedQuery.length === 0
          ? true
          : shop.name.toLowerCase().includes(normalizedQuery) || shop.address.toLowerCase().includes(normalizedQuery);
      const matchesService =
        selectedServiceFilter == null ? true : shop.services.some((service) => service.id === selectedServiceFilter);

      return matchesSearch && matchesService;
    });
  }, [searchQuery, selectedServiceFilter, shopsWithDistance]);

  const shopRows = useMemo(
    () =>
      filteredShops.map(({ distanceKm, shop }) => {
        const formattedDistance = distanceKm == null ? null : t('customer.explore.distanceAway', { distance: formatDistance(distanceKm) });

        return {
          address: shop.address,
          coverImageUrl: shop.cover_image_url,
          distanceLabel: formattedDistance,
          name: shop.name,
          shopId: shop.id,
        } satisfies ShopRow;
      }),
    [filteredShops, t]
  );

  const mapCenter = useMemo(
    () =>
      userCoordinates ?? {
        latitude: TEL_AVIV_COORDINATES.latitude,
        longitude: TEL_AVIV_COORDINATES.longitude,
      },
    [userCoordinates]
  );

  const handleOpenShop = useCallback(
    (shopId: string) => {
      router.push({
        params: { shopId },
        pathname: '/booking/[shopId]',
      });
    },
    [router]
  );

  const renderShop = useCallback<ListRenderItem<ShopRow>>(
    ({ item }) => <ShopListItem item={item} onPress={handleOpenShop} />,
    [handleOpenShop]
  );

  if (shopsQuery.isPending) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.mapContainer}>
        <ExploreMap
          center={mapCenter}
          onPressShop={handleOpenShop}
          shops={filteredShops.map(({ shop }) => ({
            address: shop.address,
            id: shop.id,
            latitude: shop.latitude,
            longitude: shop.longitude,
            name: shop.name,
          }))}
        />
      </View>

      <View style={styles.controls}>
        {locationState === 'denied' ? (
          <Card style={styles.locationBanner}>
            <Text color="$colorMuted">{t('customer.explore.locationDenied')}</Text>
          </Card>
        ) : null}

        <Input onChangeText={setSearchQuery} placeholder={t('customer.explore.searchPlaceholder')} value={searchQuery} />

        <View style={styles.chipsRow}>
          <Pressable
            onPress={() => setSelectedServiceFilter(null)}
            style={selectedServiceFilter == null ? styles.chipActive : styles.chip}
          >
            <Text color={selectedServiceFilter == null ? '$inverseColor' : '$colorMuted'}>{t('customer.explore.allServices')}</Text>
          </Pressable>

          {serviceOptions.map((option) => {
            const isSelected = selectedServiceFilter === option.id;

            return (
              <Pressable
                key={option.id}
                onPress={() => setSelectedServiceFilter(option.id)}
                style={isSelected ? styles.chipActive : styles.chip}
              >
                <Text color={isSelected ? '$inverseColor' : '$colorMuted'}>{option.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {shopsQuery.isError ? (
        <View style={styles.errorContainer}>
          <Card>
            <Text color="$error">{t('customer.explore.loadError')}</Text>
            <Button onPress={() => void shopsQuery.refetch()}>
              <ButtonText>{t('customer.explore.retryButton')}</ButtonText>
            </Button>
          </Card>
        </View>
      ) : (
        <FlashList
          ListEmptyComponent={
            <Card>
              <Text color="$colorMuted">{t('customer.explore.noShops')}</Text>
            </Card>
          }
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          data={shopRows}

          keyExtractor={(item) => item.shopId}
          renderItem={renderShop}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#e2e8f0',
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#0f172a',
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controls: {
    gap: 12,
    padding: 16,
    paddingBottom: 8,
  },
  errorContainer: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  listContent: {
    gap: 12,
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  locationBanner: {
    backgroundColor: '#f8fafc',
  },
  mapContainer: {
    borderCurve: 'continuous',
    borderRadius: 20,
    height: 252,
    margin: 16,
    marginBottom: 0,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
  },
});
