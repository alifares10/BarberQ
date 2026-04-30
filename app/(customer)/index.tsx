import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  Eyebrow,
  ExploreMap,
  Icon,
  LoadingScreen,
  Photo,
  SerifTitle,
  ShopCard,
  StateCard,
  Text,
} from '@/components';
import { CategoryChipRow } from '@/components/customer/CategoryChipRow';
import { SearchBar } from '@/components/customer/SearchBar';
import { fontFamilies } from '@/lib/fonts';
import { calculateDistanceKm, formatDistance } from '@/lib/customer/distance';
import { fetchActiveShops, type CustomerShop } from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

const TEL_AVIV_COORDINATES = {
  latitude: 32.0853,
  longitude: 34.7818,
};

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationState = 'denied' | 'granted' | 'unknown';

type ShopDistance = {
  distanceKm: number | null;
  shop: CustomerShop;
};

type ShopRow = {
  shopId: string;
  name: string;
  address: string;
  coverImageUrl: string | null;
  distanceLabel: string | null;
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
      shopId={item.shopId}
      name={item.name}
      address={item.address}
      coverImageUrl={item.coverImageUrl}
      distance={item.distanceLabel}
      onPress={onPress}
    />
  );
});

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
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
    const unique = new Map<string, { id: string; name: string }>();
    for (const shop of shops) {
      for (const service of shop.services) {
        if (!unique.has(service.id)) {
          unique.set(service.id, { id: service.id, name: service.name });
        }
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [shops]);

  const shopsWithDistance = useMemo(() => {
    const mapped = shops.map((shop) => {
      if (userCoordinates == null) {
        return { distanceKm: null, shop } satisfies ShopDistance;
      }
      return {
        distanceKm: calculateDistanceKm(
          userCoordinates.latitude,
          userCoordinates.longitude,
          shop.latitude,
          shop.longitude,
        ),
        shop,
      } satisfies ShopDistance;
    });
    return mapped.sort((a, b) => {
      if (a.distanceKm == null || b.distanceKm == null) {
        return a.shop.created_at.localeCompare(b.shop.created_at);
      }
      return a.distanceKm - b.distanceKm;
    });
  }, [shops, userCoordinates]);

  const filteredShops = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return shopsWithDistance.filter(({ shop }) => {
      const matchesSearch =
        normalized.length === 0
          ? true
          : shop.name.toLowerCase().includes(normalized) ||
            shop.address.toLowerCase().includes(normalized);
      const matchesService =
        selectedServiceFilter == null
          ? true
          : shop.services.some((service) => service.id === selectedServiceFilter);
      return matchesSearch && matchesService;
    });
  }, [searchQuery, selectedServiceFilter, shopsWithDistance]);

  const shopRows = useMemo<ShopRow[]>(
    () =>
      filteredShops.map(({ distanceKm, shop }) => ({
        shopId: shop.id,
        name: shop.name,
        address: shop.address,
        coverImageUrl: shop.cover_image_url,
        distanceLabel:
          distanceKm == null
            ? null
            : t('customer.explore.distanceAway', { distance: formatDistance(distanceKm) }),
      })),
    [filteredShops, t],
  );

  // The map's marker list is derived from the UNFILTERED shop set on
  // purpose — chips only narrow the rail below, never the map. Filtering
  // markers on chip change caused rapid native MKMapView Marker
  // insert/remove churn, which raced with React Native's Fabric mounting
  // transaction and crashed `-[__NSArrayM insertObject:atIndex:]` (see
  // crash report on iOS 18). Keeping `mapShops` stable across chip taps
  // also matches the better UX: pan the map freely regardless of which
  // category is active.
  const mapShops = useMemo(
    () =>
      shopsWithDistance.map(({ shop }) => ({
        address: shop.address,
        id: shop.id,
        latitude: shop.latitude,
        longitude: shop.longitude,
        name: shop.name,
      })),
    [shopsWithDistance],
  );

  const mapCenter = useMemo(
    () =>
      userCoordinates ?? {
        latitude: TEL_AVIV_COORDINATES.latitude,
        longitude: TEL_AVIV_COORDINATES.longitude,
      },
    [userCoordinates],
  );

  const handleOpenShop = useCallback(
    (shopId: string) => {
      router.push({ params: { shopId }, pathname: '/booking/[shopId]' });
    },
    [router],
  );

  const renderShop = useCallback<ListRenderItem<ShopRow>>(
    ({ item }) => <ShopListItem item={item} onPress={handleOpenShop} />,
    [handleOpenShop],
  );

  if (shopsQuery.isPending) {
    return <LoadingScreen />;
  }

  const firstName = (profile?.full_name ?? '').split(/\s+/)[0] ?? '';
  const greetingName =
    firstName.length > 0 ? firstName : t('customer.explore.greetingFallback');

  const categoryOptions: { id: string | null; name: string }[] = [
    { id: null, name: t('customer.explore.allServices') },
    ...serviceOptions,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header — greeting + avatar */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Eyebrow size={9}>{t('customer.explore.greetingEyebrow')}</Eyebrow>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 6,
              marginTop: 4,
            }}
          >
            <SerifTitle size={26} weight="regular">
              {t('customer.explore.greetingPrefix')}
            </SerifTitle>
            <SerifTitle size={26} italic color={colors.gold}>
              {greetingName}
            </SerifTitle>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/(customer)/profile')}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            borderWidth: 1,
            borderColor: colors.goldBorder,
            padding: 2,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 17,
              overflow: 'hidden',
              borderCurve: 'continuous',
            }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                placeholder={{ blurhash: DEFAULT_BLURHASH }}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Photo tone="portrait" dim={0.3} />
            )}
          </View>
        </Pressable>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('customer.explore.searchPlaceholder')}
          onPressFilter={() => {
            // TODO: open a filter sheet (services, distance, hours).
          }}
        />
      </View>

      {/* Categories */}
      <View style={{ marginTop: 16 }}>
        <CategoryChipRow
          options={categoryOptions}
          selectedId={selectedServiceFilter}
          onSelect={setSelectedServiceFilter}
        />
      </View>

      {/* Map */}
      <View
        style={{
          marginTop: 16,
          height: 200,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.goldHair,
        }}
      >
        <ExploreMap center={mapCenter} onPressShop={handleOpenShop} shops={mapShops} />
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.goldBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="pin" size={16} color={colors.gold} />
        </View>
      </View>

      {/* Near you rail */}
      <View
        style={{
          flex: 1,
          paddingTop: 20,
        }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontFamily: fontFamilies.serif.italic,
              fontSize: 18,
              color: colors.ivory,
            }}
          >
            {t('customer.explore.nearYouTitle')}
          </Text>
          {locationState === 'denied' ? (
            <Text
              style={{
                fontFamily: fontFamilies.sans.regular,
                fontSize: 11,
                color: colors.muted,
              }}
            >
              {t('customer.explore.locationDenied')}
            </Text>
          ) : (
            <Eyebrow size={11} color={colors.gold}>
              {t('customer.explore.seeAll')}
            </Eyebrow>
          )}
        </View>

        {shopsQuery.isError ? (
          <View style={{ paddingHorizontal: 20 }}>
            <StateCard
              actionLabel={t('customer.explore.retryButton')}
              description={t('customer.explore.loadError')}
              onAction={() => void shopsQuery.refetch()}
              variant="error"
            />
          </View>
        ) : (
          <FlashList
            // We deliberately do NOT key on `selectedServiceFilter` —
            // a force-remount tears down every `<ShopCard>` on each chip
            // tap, which was the iOS crash trigger (rapid SVG/expo-image
            // mount cycles). FlashList's `keyExtractor` already keeps
            // rows stable across data changes; if v2 layout drift
            // surfaces here, prefer `extraData` over a key remount.
            ListEmptyComponent={
              <View style={{ paddingHorizontal: 20 }}>
                <StateCard description={t('customer.explore.noShops')} variant="empty" />
              </View>
            }
            contentContainerStyle={{
              gap: 14,
              paddingHorizontal: 20,
              paddingBottom: 24,
            }}
            data={shopRows}
            keyExtractor={(item) => item.shopId}
            renderItem={renderShop}
          />
        )}
      </View>
    </View>
  );
}
