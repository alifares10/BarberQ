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
  ServiceItem,
  StateCard,
  Text,
} from '@/components';
import { ModalHeader } from '@/components/booking/ModalHeader';
import { RunningTotalBar } from '@/components/booking/RunningTotalBar';
import { fetchServicesByBarberId } from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { useBookingStore } from '@/stores/booking-store';

type ServiceRow = {
  duration: number;
  id: string;
  isSelected: boolean;
  name: string;
  price: number;
};

const STEP = 2;
const TOTAL = 4;

export default function ServicesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const selectedBarberId = useBookingStore((state) => state.selectedBarberId);
  const selectedServiceIdsInStore = useBookingStore((state) => state.selectedServiceIds);
  const setSelectedServiceIds = useBookingStore((state) => state.setSelectedServiceIds);
  const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
  const setSelectedTime = useBookingStore((state) => state.setSelectedTime);
  const [selectedServiceIds, setSelectedServiceIdsLocal] = useState<string[]>(
    selectedServiceIdsInStore,
  );
  const servicesQuery = useQuery({
    enabled: selectedBarberId != null,
    queryFn: () => fetchServicesByBarberId(selectedBarberId ?? ''),
    queryKey:
      selectedBarberId != null
        ? customerQueryKeys.servicesByBarber(selectedBarberId)
        : ['customer', 'services', 'unknown'],
  });

  const selectedServiceIdSet = useMemo(
    () => new Set(selectedServiceIds),
    [selectedServiceIds],
  );
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const rows = useMemo<ServiceRow[]>(
    () =>
      services.map((service) => ({
        duration: service.duration,
        id: service.id,
        isSelected: selectedServiceIdSet.has(service.id),
        name: service.name,
        price: service.price,
      })),
    [selectedServiceIdSet, services],
  );
  const totals = useMemo(
    () =>
      services.reduce(
        (accumulator, service) => {
          if (!selectedServiceIdSet.has(service.id)) {
            return accumulator;
          }
          return {
            totalDuration: accumulator.totalDuration + service.duration,
            totalPrice: accumulator.totalPrice + service.price,
          };
        },
        { totalDuration: 0, totalPrice: 0 },
      ),
    [selectedServiceIdSet, services],
  );

  const handleToggleService = useCallback((serviceId: string) => {
    setSelectedServiceIdsLocal((current) => {
      if (current.includes(serviceId)) {
        return current.filter((id) => id !== serviceId);
      }
      return [...current, serviceId];
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedServiceIds.length === 0) {
      return;
    }
    // If the service set changed, reset date/time — durations may have
    // changed and a previously valid slot may no longer fit.
    const previous = new Set(selectedServiceIdsInStore);
    const next = new Set(selectedServiceIds);
    const sameSet =
      previous.size === next.size &&
      [...previous].every((id) => next.has(id));
    if (!sameSet) {
      setSelectedDate(null);
      setSelectedTime(null);
    }
    setSelectedServiceIds(selectedServiceIds);
    router.push('/booking/datetime');
  }, [
    router,
    selectedServiceIds,
    selectedServiceIdsInStore,
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

  const renderRow = useCallback<ListRenderItem<ServiceRow>>(
    ({ item }) => (
      <ServiceItem
        duration={item.duration}
        isSelected={item.isSelected}
        name={item.name}
        onToggle={handleToggleService}
        price={item.price}
        serviceId={item.id}
      />
    ),
    [handleToggleService],
  );

  if (selectedBarberId == null) {
    return (
      <View
        style={{ flex: 1, padding: 16, backgroundColor: colors.bg, justifyContent: 'center' }}
      >
        <StateCard
          actionLabel={t('customer.serviceSelection.backToExplore')}
          description={t('customer.serviceSelection.missingBarber')}
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
        <SerifTitle size={28}>{t('booking.servicesHeadlineA')}</SerifTitle>
        <SerifTitle size={28} italic color={colors.gold}>
          {t('booking.servicesHeadlineB')}
        </SerifTitle>
        <Text
          style={{
            fontFamily: fontFamilies.sans.regular,
            fontSize: 12,
            color: colors.muted,
            marginTop: 8,
          }}
        >
          {t('booking.servicesSubtitle')}
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 24 }}>
        {servicesQuery.isPending ? (
          <LoadingScreen />
        ) : servicesQuery.isError ? (
          <StateCard
            actionLabel={t('customer.serviceSelection.retryButton')}
            description={t('customer.serviceSelection.loadError')}
            onAction={() => void servicesQuery.refetch()}
            variant="error"
          />
        ) : (
          <FlashList
            ListEmptyComponent={
              <StateCard description={t('customer.serviceSelection.empty')} variant="empty" />
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + 200 }}
            data={rows}
            keyExtractor={(item) => item.id}
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
          backgroundColor: colors.bg,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 22,
        }}
      >
        <RunningTotalBar
          count={selectedServiceIds.length}
          totalMinutes={totals.totalDuration}
          totalPrice={totals.totalPrice}
        />
        <CTA disabled={selectedServiceIds.length === 0} onPress={handleContinue}>
          {t('booking.servicesContinueCta')}
        </CTA>
      </View>
    </View>
  );
}
