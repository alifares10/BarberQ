import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText, Card, LoadingScreen, Text } from '@/components';
import { fetchShopAppointmentsByDateRange, fetchShopByOwnerId } from '@/lib/shop-owner/api';
import {
  getRangeBounds,
  groupShopAppointmentsByDate,
  moveRangeAnchor,
  normalizeTime,
  parseIsoDate,
  startOfDay,
  toIsoDate,
  type RangeMode,
} from '@/lib/shop-owner/appointments-helpers';
import { shopOwnerQueryKeys } from '@/lib/shop-owner/query-keys';
import { useAuthStore } from '@/stores/auth-store';

type CalendarRow =
  | {
      id: string;
      label: string;
      type: 'header';
    }
  | {
      appointmentId: string;
      barberName: string;
      customerName: string;
      endTime: string;
      id: string;
      notes: string | null;
      startTime: string;
      statusText: string;
      type: 'appointment';
    };


type AppointmentRowProps = {
  barberName: string;
  customerName: string;
  notes: string | null;
  statusText: string;
  timeRangeText: string;
};

const AppointmentRow = memo(function AppointmentRow({
  barberName,
  customerName,
  notes,
  statusText,
  timeRangeText,
}: AppointmentRowProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <Text fontWeight="700">{timeRangeText}</Text>
      <Text color="$colorMuted">{t('shopOwner.calendar.itemBarber', { barber: barberName })}</Text>
      <Text color="$colorMuted">{t('shopOwner.calendar.itemCustomer', { customer: customerName })}</Text>
      <Text color="$colorMuted">{t('shopOwner.calendar.itemStatus', { status: statusText })}</Text>
      {notes != null && notes.trim().length > 0 ? <Text color="$colorMuted">{notes}</Text> : null}
    </Card>
  );
});

export default function CalendarScreen() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const ownerId = session?.user.id ?? null;
  const [mode, setMode] = useState<RangeMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }),
    [i18n.language]
  );
  const rangeFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }),
    [i18n.language]
  );
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', weekday: 'long' }),
    [i18n.language]
  );
  const rangeBounds = useMemo(() => getRangeBounds(anchorDate, mode), [anchorDate, mode]);
  const startDateValue = useMemo(() => toIsoDate(rangeBounds.startDate), [rangeBounds.startDate]);
  const endDateValue = useMemo(() => toIsoDate(rangeBounds.endDate), [rangeBounds.endDate]);
  const rangeLabel = useMemo(() => {
    if (mode === 'month') {
      return monthFormatter.format(anchorDate);
    }

    return `${rangeFormatter.format(rangeBounds.startDate)} - ${rangeFormatter.format(rangeBounds.endDate)}`;
  }, [anchorDate, mode, monthFormatter, rangeBounds.endDate, rangeBounds.startDate, rangeFormatter]);
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
        endDate: endDateValue,
        shopId: shopId ?? '',
        startDate: startDateValue,
      }),
    queryKey:
      shopId != null
        ? shopOwnerQueryKeys.appointmentsByShopAndRange(shopId, startDateValue, endDateValue)
        : ['shop-owner', 'appointments', 'unknown', 'range', startDateValue, endDateValue],
  });
  const appointments = useMemo(() => appointmentsQuery.data ?? [], [appointmentsQuery.data]);

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

  const calendarRows = useMemo(() => {
    const rows: CalendarRow[] = [];

    for (const { appointments: dayAppointments, date: dateValue } of groupShopAppointmentsByDate(appointments)) {
      rows.push({
        id: `header-${dateValue}`,
        label: dayFormatter.format(parseIsoDate(dateValue)),
        type: 'header',
      });

      for (const appointment of dayAppointments) {
        rows.push({
          appointmentId: appointment.id,
          barberName: appointment.barber?.name ?? t('shopOwner.calendar.unknownBarber'),
          customerName: appointment.customer?.full_name ?? t('shopOwner.calendar.unknownCustomer'),
          endTime: normalizeTime(appointment.end_time),
          id: `appointment-${appointment.id}`,
          notes: appointment.notes,
          startTime: normalizeTime(appointment.appointment_time),
          statusText: getStatusText(appointment.status),
          type: 'appointment',
        });
      }
    }

    return rows;
  }, [appointments, dayFormatter, getStatusText, t]);

  const handleMoveRange = useCallback(
    (direction: 'next' | 'previous') => {
      setAnchorDate((currentDate) => moveRangeAnchor(currentDate, mode, direction));
    },
    [mode]
  );

  const renderRow = useCallback<ListRenderItem<CalendarRow>>(
    ({ item }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dayHeaderRow}>
            <Text fontWeight="700">{item.label}</Text>
          </View>
        );
      }

      return (
        <AppointmentRow
          barberName={item.barberName}
          customerName={item.customerName}
          notes={item.notes}
          statusText={item.statusText}
          timeRangeText={`${item.startTime} - ${item.endTime}`}
        />
      );
    },
    []
  );

  if (shopQuery.isPending || (shopId != null && appointmentsQuery.isPending)) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.screen}>
      <FlashList
        ListEmptyComponent={
          shopId != null && !appointmentsQuery.isError ? (
            <Card>
              <Text color="$colorMuted">{t('shopOwner.calendar.empty')}</Text>
            </Card>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Card>
              <Text fontFamily="$heading" fontSize={28} fontWeight="800">
                {t('shopOwner.calendar.title')}
              </Text>
              <Text color="$colorMuted">{t('shopOwner.calendar.description')}</Text>
            </Card>

            {shopId == null ? (
              <Card>
                <Text fontWeight="700">{t('shopOwner.calendar.missingShopTitle')}</Text>
                <Text color="$colorMuted">{t('shopOwner.calendar.missingShopDescription')}</Text>
                <Button onPress={() => router.push('/(shop-owner)/shop')}>
                  <ButtonText>{t('shopOwner.calendar.goToShopButton')}</ButtonText>
                </Button>
              </Card>
            ) : null}

            {appointmentsQuery.isError ? (
              <Card>
                <Text color="$error">{t('shopOwner.calendar.loadError')}</Text>
                <Button onPress={() => void appointmentsQuery.refetch()}>
                  <ButtonText>{t('shopOwner.calendar.retryButton')}</ButtonText>
                </Button>
              </Card>
            ) : null}

            {shopId != null && !appointmentsQuery.isError ? (
              <Card>
                <Text fontWeight="700">{t('shopOwner.calendar.rangeTitle')}</Text>
                <Text color="$colorMuted">{rangeLabel}</Text>

                <View style={styles.modeRow}>
                  <Pressable
                    onPress={() => setMode('week')}
                    style={[styles.modePill, mode === 'week' ? styles.modePillActive : null]}
                  >
                    <Text color={mode === 'week' ? '$inverseColor' : '$colorMuted'}>{t('shopOwner.calendar.weekMode')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMode('month')}
                    style={[styles.modePill, mode === 'month' ? styles.modePillActive : null]}
                  >
                    <Text color={mode === 'month' ? '$inverseColor' : '$colorMuted'}>{t('shopOwner.calendar.monthMode')}</Text>
                  </Pressable>
                </View>

                <View style={styles.navRow}>
                  <Button onPress={() => handleMoveRange('previous')}>
                    <ButtonText>{t('shopOwner.calendar.previousButton')}</ButtonText>
                  </Button>
                  <Button onPress={() => handleMoveRange('next')}>
                    <ButtonText>{t('shopOwner.calendar.nextButton')}</ButtonText>
                  </Button>
                </View>
              </Card>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        data={shopId != null && !appointmentsQuery.isError ? calendarRows : []}
        estimatedItemSize={120}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dayHeaderRow: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerContent: {
    gap: 12,
  },
  listContent: {
    gap: 12,
    padding: 16,
    paddingBottom: 24,
  },
  modePill: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 84,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modePillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  screen: {
    flex: 1,
  },
});
