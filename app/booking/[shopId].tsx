import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  CTA,
  Eyebrow,
  Icon,
  LoadingScreen,
  Photo,
  SerifTitle,
  StateCard,
  Status,
  Text,
} from '@/components';
import {
  BarberPreviewRail,
  type BarberPreviewItem,
} from '@/components/customer/BarberPreviewRail';
import { ShopServicesPreview } from '@/components/customer/ShopServicesPreview';
import { fetchActiveBarbersByShopId, fetchShopById } from '@/lib/customer/api';
import { formatDistance } from '@/lib/customer/distance';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { useBookingStore } from '@/stores/booking-store';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';
const DEFAULT_PLACEHOLDER = { blurhash: DEFAULT_BLURHASH };

export default function ShopDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setSelectedShopId = useBookingStore((state) => state.setSelectedShopId);
  const selectedShopDistanceKm = useBookingStore(
    (state) => state.selectedShopDistanceKm,
  );
  const { shopId: shopIdParam } = useLocalSearchParams<{ shopId?: string | string[] }>();
  const shopId = useMemo(() => {
    if (Array.isArray(shopIdParam)) {
      return shopIdParam[0] ?? '';
    }
    return shopIdParam ?? '';
  }, [shopIdParam]);

  const shopQuery = useQuery({
    enabled: shopId.length > 0,
    queryFn: () => fetchShopById(shopId),
    queryKey:
      shopId.length > 0 ? customerQueryKeys.shopById(shopId) : ['customer', 'shop', 'unknown'],
  });
  const barbersQuery = useQuery({
    enabled: shopId.length > 0,
    queryFn: () => fetchActiveBarbersByShopId(shopId),
    queryKey:
      shopId.length > 0
        ? customerQueryKeys.barbersByShop(shopId)
        : ['customer', 'barbers', 'unknown'],
  });

  const shop = shopQuery.data ?? null;
  const barbers = useMemo(() => barbersQuery.data ?? [], [barbersQuery.data]);
  const barberPreviewItems = useMemo<BarberPreviewItem[]>(
    () =>
      barbers.slice(0, 6).map((barber) => ({
        avatarUrl: barber.avatar_url,
        id: barber.id,
        name: barber.name.split(/\s+/)[0] ?? barber.name,
      })),
    [barbers],
  );
  // Shop services live on `fetchActiveShops`, not `fetchShopById` — the
  // single-shop call only returns the row's own columns. Preview the
  // shop's services from a deduped subset of the barbers' services
  // would require N+1 queries, so we keep the preview tight: top 3
  // names from any barber's services. Falls back to an empty array
  // when no barber is loaded yet.
  const heroImageSource = useMemo(
    () => (shop?.cover_image_url != null ? { uri: shop.cover_image_url } : null),
    [shop?.cover_image_url],
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(customer)');
    }
  }, [router]);

  const handleBookChair = useCallback(() => {
    if (shopId.length === 0) {
      return;
    }
    setSelectedShopId(shopId);
    router.push('/booking/barber');
  }, [router, setSelectedShopId, shopId]);

  if (shopId.length === 0) {
    return (
      <View
        style={{ flex: 1, padding: 16, backgroundColor: colors.bg, justifyContent: 'center' }}
      >
        <StateCard description={t('customer.shopDetail.invalidShop')} variant="error" />
      </View>
    );
  }

  if (shopQuery.isPending || barbersQuery.isPending) {
    return <LoadingScreen />;
  }

  if (shopQuery.isError || barbersQuery.isError) {
    return (
      <View
        style={{ flex: 1, padding: 16, backgroundColor: colors.bg, justifyContent: 'center' }}
      >
        <StateCard
          actionLabel={t('customer.shopDetail.retryButton')}
          description={t('customer.shopDetail.loadError')}
          onAction={() => {
            void shopQuery.refetch();
            void barbersQuery.refetch();
          }}
          variant="error"
        />
      </View>
    );
  }

  if (shop == null) {
    return (
      <View
        style={{ flex: 1, padding: 16, backgroundColor: colors.bg, justifyContent: 'center' }}
      >
        <StateCard description={t('customer.shopDetail.invalidShop')} variant="error" />
      </View>
    );
  }

  const distanceLabel =
    selectedShopDistanceKm != null
      ? formatDistance(selectedShopDistanceKm)
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Layer 1 — full-bleed hero photo */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}
        pointerEvents="none"
      >
        {heroImageSource != null ? (
          <Image
            source={heroImageSource}
            placeholder={DEFAULT_PLACEHOLDER}
            contentFit="cover"
            transition={140}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Photo tone="chair" dim={0.5} />
        )}
        <LinearGradient
          colors={['rgba(14,11,8,0.6)', 'transparent', 'rgba(14,11,8,0.95)']}
          locations={[0, 0.3, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top nav chrome */}
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={handleBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(14,11,8,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.goldHair,
            }}
          >
            <Icon name="chevL" size={18} color={colors.ivory} />
          </Pressable>
          <Pressable
            // TODO: wire to favorites once the schema lands. Inert today.
            onPress={undefined}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(14,11,8,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.goldHair,
            }}
          >
            <Icon name="heart" size={16} color={colors.ivory} />
          </Pressable>
        </View>

        {/* Hero text — sits over the hero photo's lower section */}
        <View style={{ paddingHorizontal: 20, marginTop: 180 }}>
          <Eyebrow size={9} color={colors.gold}>
            {t('booking.shopDefaultTagline')}
          </Eyebrow>
          <SerifTitle size={32} style={{ marginTop: 6 }}>
            {shop.name}
          </SerifTitle>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              marginTop: 10,
            }}
          >
            {distanceLabel != null ? (
              <Text
                style={{
                  fontFamily: fontFamilies.sans.regular,
                  fontSize: 12,
                  color: colors.muted,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {distanceLabel}
              </Text>
            ) : null}
            {distanceLabel != null ? (
              <Text style={{ color: colors.muted, fontSize: 12 }}>·</Text>
            ) : null}
            {/* TODO: derive open/closed from working_hours per-barber once
                a shop-level "open now" helper exists. */}
            <Status kind="open" compact />
          </View>
        </View>

        {/* Barbers preview rail */}
        <View style={{ marginTop: 32 }}>
          <View
            style={{
              paddingHorizontal: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 14,
            }}
          >
            <Eyebrow size={9} color={colors.gold}>
              {t('booking.shopBarbersEyebrow')}
            </Eyebrow>
            <Text
              style={{
                fontFamily: fontFamilies.mono.regular,
                fontSize: 11,
                color: colors.muted,
                fontVariant: ['tabular-nums'],
              }}
            >
              {String(barbers.length).padStart(2, '0')}
            </Text>
          </View>
          {barberPreviewItems.length > 0 ? (
            <BarberPreviewRail barbers={barberPreviewItems} />
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{
                  fontFamily: fontFamilies.sans.regular,
                  fontSize: 12,
                  color: colors.muted,
                }}
              >
                {t('booking.shopMissingBarbers')}
              </Text>
            </View>
          )}
        </View>

        {/* Services preview — top 4 from the first barber that has any */}
        <ServicesPreviewSection barberId={barbers[0]?.id ?? null} />
      </ScrollView>

      {/* Sticky bottom CTA + bottom-fade scrim */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 22,
          paddingTop: 28,
        }}
      >
        <LinearGradient
          colors={['transparent', colors.bg]}
          locations={[0, 0.4]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
        />
        <CTA disabled={barbers.length === 0} onPress={handleBookChair}>
          {t('booking.shopBookCta')}
        </CTA>
      </View>
    </View>
  );
}

/**
 * Pulls a small slice of the first barber's services to show as a
 * teaser on Shop Detail. Full multi-select happens on
 * `/booking/services` after a barber is chosen.
 */
function ServicesPreviewSection({ barberId }: { barberId: string | null }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const servicesQuery = useQuery({
    enabled: barberId != null,
    queryFn: async () => {
      const { fetchServicesByBarberId } = await import('@/lib/customer/api');
      return fetchServicesByBarberId(barberId ?? '');
    },
    queryKey:
      barberId != null
        ? customerQueryKeys.servicesByBarber(barberId)
        : ['customer', 'services', 'unknown'],
  });
  const services = servicesQuery.data ?? [];
  const previewItems = useMemo(
    () => services.slice(0, 4).map((s) => ({ id: s.id, name: s.name })),
    [services],
  );

  if (barberId == null || previewItems.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <Eyebrow size={9} color={colors.gold}>
          {t('booking.shopServicesEyebrow')}
        </Eyebrow>
        <Text
          style={{
            fontFamily: fontFamilies.mono.regular,
            fontSize: 11,
            color: colors.muted,
            fontVariant: ['tabular-nums'],
          }}
        >
          {String(services.length).padStart(2, '0')}
        </Text>
      </View>
      <ShopServicesPreview items={previewItems} />
    </View>
  );
}
