import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, LoadingScreen, StateCard, Text } from '@/components';
import { getRtlLayout } from '@/lib/rtl';
import { fetchShopAppointmentsByDateRange, fetchShopByOwnerId, type ShopAppointment } from '@/lib/shop-owner/api';
import { getDashboardStats, normalizeTime, toIsoDate } from '@/lib/shop-owner/appointments-helpers';
import { shopOwnerQueryKeys } from '@/lib/shop-owner/query-keys';
import { useAuthStore } from '@/stores/auth-store';

type AppointmentItemProps = {
  barberName: string;
  customerName: string;
  notes: string | null;
  rangeText: string;
  statusText: string;
};

const AppointmentItem = memo(function AppointmentItem({
  barberName,
  customerName,
  notes,
  rangeText,
  statusText,
}: AppointmentItemProps) {
  const { i18n, t } = useTranslation();
  const rtlLayout = getRtlLayout(i18n.language);

  return (
    <Card>
      <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{rangeText}</Text>
      <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.itemBarber', { barber: barberName })}</Text>
      <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.itemCustomer', { customer: customerName })}</Text>
      <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.itemStatus', { status: statusText })}</Text>
      {notes != null && notes.trim().length > 0 ? <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{notes}</Text> : null}
    </Card>
  );
});

export default function DashboardScreen() {
  const { i18n, t } = useTranslation();
  const rtlLayout = getRtlLayout(i18n.language);
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const ownerId = session?.user.id ?? null;
  const todayDate = useMemo(() => toIsoDate(new Date()), []);
  const shopQuery = useQuery({
    enabled: ownerId != null,
    queryFn: () => fetchShopByOwnerId(ownerId ?? ''),
    queryKey: ownerId != null ? shopOwnerQueryKeys.shopByOwner(ownerId) : ['shop-owner', 'shop', 'unknown'],
  });
  const shopId = shopQuery.data?.id ?? null;
  const appointmentsQuery = useQuery({
    enabled: shopId != null,
    queryFn: () =>
      fetchShopAppointmentsByDateRange({
        endDate: todayDate,
        shopId: shopId ?? '',
        startDate: todayDate,
      }),
    queryKey:
      shopId != null
        ? shopOwnerQueryKeys.appointmentsByShopAndDay(shopId, todayDate)
        : ['shop-owner', 'appointments', 'unknown', 'day', todayDate],
  });

  const appointments = useMemo(() => appointmentsQuery.data ?? [], [appointmentsQuery.data]);
  const stats = useMemo(() => getDashboardStats(appointments), [appointments]);

  const getStatusText = useCallback(
    (status: string) => {
      if (status === 'pending') {
        return t('shopOwner.appointmentStatus.pending');
      }

      if (status === 'confirmed') {
        return t('shopOwner.appointmentStatus.confirmed');
      }

      if (status === 'completed') {
        return t('shopOwner.appointmentStatus.completed');
      }

      if (status === 'cancelled') {
        return t('shopOwner.appointmentStatus.cancelled');
      }

      return status;
    },
    [t]
  );

  const renderAppointment = useCallback<ListRenderItem<ShopAppointment>>(
    ({ item }) => {
      const rangeText = `${normalizeTime(item.appointment_time)} - ${normalizeTime(item.end_time)}`;

      return (
        <AppointmentItem
          barberName={item.barber?.name ?? t('shopOwner.dashboard.unknownBarber')}
          customerName={item.customer?.full_name ?? t('shopOwner.dashboard.unknownCustomer')}
          notes={item.notes}
          rangeText={rangeText}
          statusText={getStatusText(item.status)}
        />
      );
    },
    [getStatusText, t]
  );

  if (shopQuery.isPending || (shopId != null && appointmentsQuery.isPending)) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.screen}>
      <FlashList
        ListEmptyComponent={
          shopId != null && !appointmentsQuery.isError ? (
            <StateCard description={t('shopOwner.dashboard.empty')} variant="empty" />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Card>
              <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34} textAlign={rtlLayout.textAlign}>
                {t('shopOwner.dashboard.title')}
              </Text>
              <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.description')}</Text>
            </Card>

            {shopId == null ? (
              <StateCard
                actionLabel={t('shopOwner.dashboard.goToShopButton')}
                description={t('shopOwner.dashboard.missingShopDescription')}
                onAction={() => router.push('/(shop-owner)/shop')}
                title={t('shopOwner.dashboard.missingShopTitle')}
                variant="info"
              />
            ) : null}

            {appointmentsQuery.isError ? (
              <StateCard
                actionLabel={t('shopOwner.dashboard.retryButton')}
                description={t('shopOwner.dashboard.loadError')}
                onAction={() => void appointmentsQuery.refetch()}
                variant="error"
              />
            ) : null}

            {shopId != null && !appointmentsQuery.isError ? (
              <>
                <View style={[styles.statsRow, { flexDirection: rtlLayout.rowDirection }]}>
                  <Card style={styles.statCard}>
                    <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.stats.total')}</Text>
                    <Text fontFamily="$heading" fontSize={24} fontWeight="800" lineHeight={30} textAlign={rtlLayout.textAlign}>
                      {stats.total}
                    </Text>
                  </Card>

                  <Card style={styles.statCard}>
                    <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.stats.upcoming')}</Text>
                    <Text fontFamily="$heading" fontSize={24} fontWeight="800" lineHeight={30} textAlign={rtlLayout.textAlign}>
                      {stats.upcoming}
                    </Text>
                  </Card>

                  <Card style={styles.statCard}>
                    <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.stats.cancelled')}</Text>
                    <Text fontFamily="$heading" fontSize={24} fontWeight="800" lineHeight={30} textAlign={rtlLayout.textAlign}>
                      {stats.cancelled}
                    </Text>
                  </Card>
                </View>

                <Card>
                  <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.todaySectionTitle')}</Text>
                  <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.dashboard.todaySectionSubtitle')}</Text>
                </Card>
              </>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        data={shopId != null && !appointmentsQuery.isError ? appointments : []}

        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  statCard: {
    flex: 1,
    minWidth: 96,
  },
  statsRow: {
    flexWrap: 'wrap',
    gap: 8,
  },
});
