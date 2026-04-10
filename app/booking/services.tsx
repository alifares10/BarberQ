import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText, Card, LoadingScreen, ServiceItem, Text } from '@/components';
import { fetchServicesByBarberId } from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { useBookingStore } from '@/stores/booking-store';

type ServiceRow = {
  duration: number;
  id: string;
  isSelected: boolean;
  name: string;
  price: number;
};

export default function ServicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const selectedBarberId = useBookingStore((state) => state.selectedBarberId);
  const selectedServiceIdsInStore = useBookingStore((state) => state.selectedServiceIds);
  const setSelectedServiceIds = useBookingStore((state) => state.setSelectedServiceIds);
  const [selectedServiceIds, setSelectedServiceIdsLocal] = useState<string[]>(selectedServiceIdsInStore);
  const servicesQuery = useQuery({
    enabled: selectedBarberId != null,
    queryFn: () => fetchServicesByBarberId(selectedBarberId ?? ''),
    queryKey:
      selectedBarberId != null
        ? customerQueryKeys.servicesByBarber(selectedBarberId)
        : ['customer', 'services', 'unknown'],
  });

  const selectedServiceIdSet = useMemo(() => new Set(selectedServiceIds), [selectedServiceIds]);
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const rows = useMemo(
    () =>
      services.map((service) => ({
        duration: service.duration,
        id: service.id,
        isSelected: selectedServiceIdSet.has(service.id),
        name: service.name,
        price: service.price,
      })) satisfies ServiceRow[],
    [selectedServiceIdSet, services]
  );
  const totals = useMemo(() => {
    return services.reduce(
      (accumulator, service) => {
        if (!selectedServiceIdSet.has(service.id)) {
          return accumulator;
        }

        return {
          totalDuration: accumulator.totalDuration + service.duration,
          totalPrice: accumulator.totalPrice + service.price,
        };
      },
      {
        totalDuration: 0,
        totalPrice: 0,
      }
    );
  }, [selectedServiceIdSet, services]);

  const handleToggleService = useCallback((serviceId: string) => {
    setSelectedServiceIdsLocal((currentIds) => {
      if (currentIds.includes(serviceId)) {
        return currentIds.filter((id) => id !== serviceId);
      }

      return [...currentIds, serviceId];
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedServiceIds.length === 0) {
      return;
    }

    setSelectedServiceIds(selectedServiceIds);
    router.push('/booking/datetime');
  }, [router, selectedServiceIds, setSelectedServiceIds]);

  const renderService = useCallback<ListRenderItem<ServiceRow>>(
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
    [handleToggleService]
  );

  if (selectedBarberId == null) {
    return (
      <View style={styles.errorContainer}>
        <Card>
          <Text color="$error">{t('customer.serviceSelection.missingBarber')}</Text>
          <Button onPress={() => router.replace('/(customer)')}>
            <ButtonText>{t('customer.serviceSelection.backToExplore')}</ButtonText>
          </Button>
        </Card>
      </View>
    );
  }

  if (servicesQuery.isPending) {
    return <LoadingScreen />;
  }

  if (servicesQuery.isError) {
    return (
      <View style={styles.errorContainer}>
        <Card>
          <Text color="$error">{t('customer.serviceSelection.loadError')}</Text>
          <Button onPress={() => void servicesQuery.refetch()}>
            <ButtonText>{t('customer.serviceSelection.retryButton')}</ButtonText>
          </Button>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlashList
        ListEmptyComponent={
          <Card>
            <Text color="$colorMuted">{t('customer.serviceSelection.empty')}</Text>
          </Card>
        }
        ListHeaderComponent={
          <Card>
            <Text fontFamily="$heading" fontSize={28} fontWeight="800">
              {t('customer.serviceSelection.title')}
            </Text>
            <Text color="$colorMuted">{t('customer.serviceSelection.description')}</Text>
          </Card>
        }
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        data={rows}
        estimatedItemSize={104}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
      />

      <View style={styles.bottomBar}>
        <Card>
          <Text color="$colorMuted">
            {t('customer.serviceSelection.selectedCount', {
              count: selectedServiceIds.length,
            })}
          </Text>
          <Text>
            {t('customer.serviceSelection.totalDuration', {
              minutes: totals.totalDuration,
            })}
          </Text>
          <Text>
            {t('customer.serviceSelection.totalPrice', {
              price: totals.totalPrice.toFixed(2),
            })}
          </Text>

          <Button disabled={selectedServiceIds.length === 0} onPress={handleContinue}>
            <ButtonText>{t('customer.serviceSelection.nextButton')}</ButtonText>
          </Button>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    padding: 16,
    paddingTop: 10,
  },
  errorContainer: {
    flex: 1,
    padding: 16,
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
