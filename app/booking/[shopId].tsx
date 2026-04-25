import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, LoadingScreen, StateCard, Text } from '@/components';
import { fetchActiveBarbersByShopId, fetchShopById } from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { getRtlLayout } from '@/lib/rtl';
import { useBookingStore } from '@/stores/booking-store';
import type { Database } from '@/types/database';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';

type Barber = Database['public']['Tables']['barbers']['Row'];

type BarberRowProps = {
  avatarUrl: string | null;
  barberId: string;
  bio: string | null;
  name: string;
  onSelect: (barberId: string) => void;
};

const BarberRow = memo(function BarberRow({ avatarUrl, barberId, bio, name, onSelect }: BarberRowProps) {
  const { i18n, t } = useTranslation();
  const rtlLayout = getRtlLayout(i18n.language);

  return (
    <Pressable onPress={() => onSelect(barberId)}>
      <Card>
        <View style={[styles.barberRowHeader, { flexDirection: rtlLayout.rowDirection }]}>
          {avatarUrl != null ? (
            <Image
              contentFit="cover"
              placeholder={{ blurhash: DEFAULT_BLURHASH }}
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              transition={120}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text color="$colorMuted">{name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}

          <View style={[styles.grow, { alignItems: rtlLayout.leadingAlignItems }]}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{name}</Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{bio != null && bio.trim().length > 0 ? bio : t('customer.shopDetail.missingBio')}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

export default function ShopDetailScreen() {
  const { i18n, t } = useTranslation();
  const rtlLayout = getRtlLayout(i18n.language);
  const router = useRouter();
  const setNotes = useBookingStore((state) => state.setNotes);
  const setSelectedBarberId = useBookingStore((state) => state.setSelectedBarberId);
  const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
  const setSelectedServiceIds = useBookingStore((state) => state.setSelectedServiceIds);
  const setSelectedShopId = useBookingStore((state) => state.setSelectedShopId);
  const setSelectedTime = useBookingStore((state) => state.setSelectedTime);
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
    queryKey: shopId.length > 0 ? customerQueryKeys.shopById(shopId) : ['customer', 'shop', 'unknown'],
  });
  const barbersQuery = useQuery({
    enabled: shopId.length > 0,
    queryFn: () => fetchActiveBarbersByShopId(shopId),
    queryKey: shopId.length > 0 ? customerQueryKeys.barbersByShop(shopId) : ['customer', 'barbers', 'unknown'],
  });

  const shop = shopQuery.data ?? null;
  const barbers = useMemo(() => barbersQuery.data ?? [], [barbersQuery.data]);

  const handleSelectBarber = useCallback(
    (barberId: string) => {
      setSelectedShopId(shopId);
      setSelectedBarberId(barberId);
      setSelectedServiceIds([]);
      setSelectedDate(null);
      setSelectedTime(null);
      setNotes('');
      router.push('/booking/services');
    },
    [router, setNotes, setSelectedBarberId, setSelectedDate, setSelectedServiceIds, setSelectedShopId, setSelectedTime, shopId]
  );

  const handleOpenAddress = useCallback(() => {
    if (shop == null) {
      return;
    }

    const mapQuery = encodeURIComponent(`${shop.name} ${shop.address}`);

    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mapQuery}`);
  }, [shop]);

  const handleCallShop = useCallback(() => {
    if (shop == null) {
      return;
    }

    void Linking.openURL(`tel:${shop.phone}`);
  }, [shop]);

  const renderBarber = useCallback<ListRenderItem<Barber>>(
    ({ item }) => (
      <BarberRow
        avatarUrl={item.avatar_url}
        barberId={item.id}
        bio={item.bio}
        name={item.name}
        onSelect={handleSelectBarber}
      />
    ),
    [handleSelectBarber]
  );

  if (shopId.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <StateCard description={t('customer.shopDetail.invalidShop')} variant="error" />
      </View>
    );
  }

  if (shopQuery.isPending || barbersQuery.isPending) {
    return <LoadingScreen />;
  }

  if (shopQuery.isError || barbersQuery.isError) {
    return (
      <View style={styles.errorContainer}>
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
      <View style={styles.errorContainer}>
        <StateCard description={t('customer.shopDetail.invalidShop')} variant="error" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlashList
        ListEmptyComponent={
          <StateCard description={t('customer.shopDetail.emptyBarbers')} variant="empty" />
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Card>
              <View style={styles.coverContainer}>
                {shop.cover_image_url != null ? (
                  <Image
                    contentFit="cover"
                    placeholder={{ blurhash: DEFAULT_BLURHASH }}
                    source={{ uri: shop.cover_image_url }}
                    style={styles.coverImage}
                    transition={140}
                  />
                ) : (
                  <View style={styles.coverFallback}>
                    <Text color="$colorMuted">BarberQ</Text>
                  </View>
                )}
              </View>

              <Text fontFamily="$heading" fontSize={30} fontWeight="800" lineHeight={36} textAlign={rtlLayout.textAlign}>
                {shop.name}
              </Text>
              <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{shop.description != null && shop.description.trim().length > 0 ? shop.description : t('customer.shopDetail.description')}</Text>
              <Pressable onPress={handleOpenAddress} style={styles.detailPill}>
                <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{shop.address}</Text>
              </Pressable>
              <Pressable onPress={handleCallShop} style={styles.detailPill}>
                <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{shop.phone}</Text>
              </Pressable>

              <View style={[styles.actionsRow, { flexDirection: rtlLayout.rowDirection }]}>
                <Pressable onPress={handleOpenAddress} style={styles.actionChip}>
                  <Text color="$inverseColor" textAlign="center">{t('customer.shopDetail.openInMapsButton')}</Text>
                </Pressable>
                <Pressable onPress={handleCallShop} style={styles.actionChipSecondary}>
                  <Text color="$colorMuted" textAlign="center">{t('customer.shopDetail.callShopButton')}</Text>
                </Pressable>
              </View>
            </Card>

            <Card>
              <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('customer.shopDetail.barbersTitle')}</Text>
            </Card>
          </View>
        }
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        data={barbers}

        keyExtractor={(item) => item.id}
        renderItem={renderBarber}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionChip: {
    backgroundColor: '#0f172a',
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionChipSecondary: {
    backgroundColor: '#e2e8f0',
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionsRow: {
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderCurve: 'continuous',
    borderRadius: 20,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarImage: {
    borderCurve: 'continuous',
    borderRadius: 20,
    height: 56,
    width: 56,
  },
  barberRowHeader: {
    gap: 12,
  },
  coverContainer: {
    borderCurve: 'continuous',
    borderRadius: 20,
    boxShadow: '0px 10px 26px rgba(2, 6, 23, 0.09)',
    height: 220,
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
  detailPill: {
    backgroundColor: '#f8fafc',
    borderCurve: 'continuous',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorContainer: {
    flex: 1,
    padding: 16,
  },
  grow: {
    flex: 1,
    gap: 4,
  },
  headerContent: {
    gap: 12,
  },
  listContent: {
    gap: 12,
    padding: 16,
    paddingBottom: 24,
  },
  screen: {
    flex: 1,
  },
});
