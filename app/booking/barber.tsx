import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  CTA,
  LoadingScreen,
  ProgressBar,
  SerifTitle,
  StateCard,
  Text,
} from '@/components';
import { BarberSelectRow } from '@/components/booking/BarberSelectRow';
import { ModalHeader } from '@/components/booking/ModalHeader';
import { fetchActiveBarbersByShopId } from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { useBookingStore } from '@/stores/booking-store';
import type { Database } from '@/types/database';

type Barber = Database['public']['Tables']['barbers']['Row'];

type BarberRow = {
  avatarUrl: string | null;
  barberId: string;
  bio: string | null;
  isSelected: boolean;
  name: string;
};

const STEP = 1;
const TOTAL = 4;

export default function BarberSelectScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const selectedShopId = useBookingStore((state) => state.selectedShopId);
  const selectedBarberIdInStore = useBookingStore((state) => state.selectedBarberId);
  const setSelectedBarberId = useBookingStore((state) => state.setSelectedBarberId);
  const setSelectedServiceIds = useBookingStore((state) => state.setSelectedServiceIds);
  const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
  const setSelectedTime = useBookingStore((state) => state.setSelectedTime);
  const [selectedBarberId, setSelectedBarberIdLocal] = useState<string | null>(
    selectedBarberIdInStore,
  );

  const barbersQuery = useQuery({
    enabled: selectedShopId != null && selectedShopId.length > 0,
    queryFn: () => fetchActiveBarbersByShopId(selectedShopId ?? ''),
    queryKey:
      selectedShopId != null && selectedShopId.length > 0
        ? customerQueryKeys.barbersByShop(selectedShopId)
        : ['customer', 'barbers', 'unknown'],
  });

  const barbers = useMemo<Barber[]>(() => barbersQuery.data ?? [], [barbersQuery.data]);
  const rows = useMemo<BarberRow[]>(
    () =>
      barbers.map((barber) => ({
        avatarUrl: barber.avatar_url,
        barberId: barber.id,
        bio: barber.bio,
        isSelected: selectedBarberId === barber.id,
        name: barber.name,
      })),
    [barbers, selectedBarberId],
  );

  const handleSelect = useCallback((barberId: string) => {
    setSelectedBarberIdLocal((current) => (current === barberId ? null : barberId));
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedBarberId == null) {
      return;
    }
    // Switching barbers invalidates downstream selections — services
    // and slots are scoped to a single barber, so reset them when the
    // user lands here from a previous attempt.
    if (selectedBarberId !== selectedBarberIdInStore) {
      setSelectedServiceIds([]);
      setSelectedDate(null);
      setSelectedTime(null);
    }
    setSelectedBarberId(selectedBarberId);
    router.push('/booking/services');
  }, [
    router,
    selectedBarberId,
    selectedBarberIdInStore,
    setSelectedBarberId,
    setSelectedDate,
    setSelectedServiceIds,
    setSelectedTime,
  ]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const handleClose = useCallback(() => {
    router.replace('/(customer)');
  }, [router]);

  const renderRow = useCallback<ListRenderItem<BarberRow>>(
    ({ item }) => (
      <BarberSelectRow
        avatarUrl={item.avatarUrl}
        barberId={item.barberId}
        bio={item.bio}
        isSelected={item.isSelected}
        name={item.name}
        onSelect={handleSelect}
      />
    ),
    [handleSelect],
  );

  if (selectedShopId == null || selectedShopId.length === 0) {
    return (
      <View
        style={{ flex: 1, padding: 16, backgroundColor: colors.bg, justifyContent: 'center' }}
      >
        <StateCard
          actionLabel={t('customer.shopDetail.retryButton')}
          description={t('booking.barberMissingShop')}
          onAction={() => router.replace('/(customer)')}
          variant="error"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top, gap: 12 }}>
        <ProgressBar step={STEP} total={TOTAL} />
        <ModalHeader
          title={t('booking.stepLabel')}
          step={STEP}
          total={TOTAL}
          onBack={handleBack}
          onClose={handleClose}
        />
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <SerifTitle size={28}>{t('booking.barberHeadlineA')}</SerifTitle>
        <SerifTitle size={28} italic color={colors.gold}>
          {t('booking.barberHeadlineB')}
        </SerifTitle>
        <Text
          style={{
            fontFamily: fontFamilies.sans.regular,
            fontSize: 12,
            color: colors.muted,
            marginTop: 8,
          }}
        >
          {t('booking.barberSubtitle')}
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 24 }}>
        {barbersQuery.isPending ? (
          <LoadingScreen />
        ) : barbersQuery.isError ? (
          <StateCard
            actionLabel={t('customer.shopDetail.retryButton')}
            description={t('booking.barberLoadError')}
            onAction={() => void barbersQuery.refetch()}
            variant="error"
          />
        ) : (
          <FlashList
            ListEmptyComponent={
              <StateCard description={t('booking.barberEmpty')} variant="empty" />
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
            data={rows}
            keyExtractor={(item) => item.barberId}
            renderItem={renderRow}
          />
        )}
      </View>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 22,
          paddingTop: 28,
          backgroundColor: colors.bg,
        }}
      >
        <CTA disabled={selectedBarberId == null} onPress={handleContinue}>
          {t('booking.barberContinueCta')}
        </CTA>
      </View>
    </View>
  );
}
