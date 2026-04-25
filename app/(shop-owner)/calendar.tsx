import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText, Card, LoadingScreen, StateCard, Text, useToast } from '@/components';
import { notifyBookingCancelled, notifyBookingConfirmed } from '@/lib/push/notify-booking';
import { getRtlLayout } from '@/lib/rtl';
import {
  fetchShopAppointmentsByDateRange,
  fetchShopByOwnerId,
  updateAppointmentStatus,
  type AppointmentStatusUpdate,
} from '@/lib/shop-owner/api';
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
import { useAppTheme } from '@/lib/theme';
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
      status: string;
      statusText: string;
      type: 'appointment';
    };


type AppointmentRowProps = {
  appointmentId: string;
  barberName: string;
  customerName: string;
  notes: string | null;
  onPress: (appointmentId: string) => void;
  statusText: string;
  timeRangeText: string;
};

const AppointmentRow = memo(function AppointmentRow({
  appointmentId,
  barberName,
  customerName,
  notes,
  onPress,
  statusText,
  timeRangeText,
}: AppointmentRowProps) {
  const { i18n, t } = useTranslation();
  const rtlLayout = getRtlLayout(i18n.language);

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(appointmentId)}>
      <Card>
        <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{timeRangeText}</Text>
        <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.calendar.itemBarber', { barber: barberName })}</Text>
        <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.calendar.itemCustomer', { customer: customerName })}</Text>
        <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.calendar.itemStatus', { status: statusText })}</Text>
        {notes != null && notes.trim().length > 0 ? <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{notes}</Text> : null}
      </Card>
    </Pressable>
  );
});

export default function CalendarScreen() {
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const rtlLayout = getRtlLayout(i18n.language);
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const ownerId = session?.user.id ?? null;
  const [mode, setMode] = useState<RangeMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
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
  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId]
  );
  const selectedAppointmentDateLabel = useMemo(
    () => (selectedAppointment != null ? dayFormatter.format(parseIsoDate(selectedAppointment.appointment_date)) : ''),
    [dayFormatter, selectedAppointment]
  );
  const selectedAppointmentTimeRange = useMemo(
    () =>
      selectedAppointment != null
        ? `${normalizeTime(selectedAppointment.appointment_time)} - ${normalizeTime(selectedAppointment.end_time)}`
        : '',
    [selectedAppointment]
  );

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
          status: appointment.status,
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
  const handleOpenAppointment = useCallback((appointmentId: string) => {
    setStatusUpdateError(null);
    setSelectedAppointmentId(appointmentId);
  }, []);
  const handleCloseAppointment = useCallback(() => {
    setStatusUpdateError(null);
    setSelectedAppointmentId(null);
  }, []);
  const statusMutation = useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: AppointmentStatusUpdate;
    }) => updateAppointmentStatus(appointmentId, status),
    onError: () => {
      setStatusUpdateError(t('shopOwner.calendar.statusUpdateError'));
      showToast({ message: t('shopOwner.calendar.statusUpdateError'), type: 'error' });
    },
    onSuccess: async (appointment, variables) => {
      if (variables.status === 'confirmed') {
        void notifyBookingConfirmed(appointment.id);
        showToast({ message: t('toast.appointmentConfirmed'), type: 'success' });
      }

      if (variables.status === 'cancelled') {
        void notifyBookingCancelled(appointment.id, 'shop');
        showToast({ message: t('toast.appointmentCancelled'), type: 'success' });
      }

      if (shopId != null) {
        await queryClient.invalidateQueries({ queryKey: ['shop-owner', 'appointments', shopId] });
      }

      handleCloseAppointment();
    },
  });
  const handleUpdateStatus = useCallback(
    (status: AppointmentStatusUpdate) => {
      if (selectedAppointment == null) {
        return;
      }

      setStatusUpdateError(null);
      statusMutation.mutate({
        appointmentId: selectedAppointment.id,
        status,
      });
    },
    [selectedAppointment, statusMutation]
  );

  const renderRow = useCallback<ListRenderItem<CalendarRow>>(
    ({ item }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dayHeaderRow}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{item.label}</Text>
          </View>
        );
      }

      return (
        <AppointmentRow
          appointmentId={item.appointmentId}
          barberName={item.barberName}
          customerName={item.customerName}
          notes={item.notes}
          onPress={handleOpenAppointment}
          statusText={item.statusText}
          timeRangeText={`${item.startTime} - ${item.endTime}`}
        />
      );
    },
    [handleOpenAppointment, rtlLayout.textAlign]
  );

  if (shopQuery.isPending || (shopId != null && appointmentsQuery.isPending)) {
    return <LoadingScreen />;
  }

  const canConfirmSelectedAppointment = selectedAppointment?.status === 'pending';
  const canCancelSelectedAppointment =
    selectedAppointment?.status === 'pending' || selectedAppointment?.status === 'confirmed';
  const pendingStatusUpdate = statusMutation.isPending ? (statusMutation.variables?.status ?? null) : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlashList
        ListEmptyComponent={
          shopId != null && !appointmentsQuery.isError ? (
            <StateCard description={t('shopOwner.calendar.empty')} variant="empty" />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Card>
              <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34} textAlign={rtlLayout.textAlign}>
                {t('shopOwner.calendar.title')}
              </Text>
              <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.calendar.description')}</Text>
            </Card>

            {shopId == null ? (
              <StateCard
                actionLabel={t('shopOwner.calendar.goToShopButton')}
                description={t('shopOwner.calendar.missingShopDescription')}
                onAction={() => router.push('/(shop-owner)/shop')}
                title={t('shopOwner.calendar.missingShopTitle')}
                variant="info"
              />
            ) : null}

            {appointmentsQuery.isError ? (
              <StateCard
                actionLabel={t('shopOwner.calendar.retryButton')}
                description={t('shopOwner.calendar.loadError')}
                onAction={() => void appointmentsQuery.refetch()}
                variant="error"
              />
            ) : null}

            {shopId != null && !appointmentsQuery.isError ? (
              <Card>
                <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.calendar.rangeTitle')}</Text>
                <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{rangeLabel}</Text>

                <View style={[styles.modeRow, { flexDirection: rtlLayout.rowDirection }]}>
                  <Pressable
                    onPress={() => setMode('week')}
                    style={[
                      styles.modePill,
                      {
                        backgroundColor: mode === 'week' ? colors.primary : colors.surfaceMuted,
                        borderColor: mode === 'week' ? colors.primary : colors.chipBorder,
                      },
                    ]}
                  >
                    <Text color={mode === 'week' ? '$inverseColor' : '$colorMuted'} textAlign="center">{t('shopOwner.calendar.weekMode')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMode('month')}
                    style={[
                      styles.modePill,
                      {
                        backgroundColor: mode === 'month' ? colors.primary : colors.surfaceMuted,
                        borderColor: mode === 'month' ? colors.primary : colors.chipBorder,
                      },
                    ]}
                  >
                    <Text color={mode === 'month' ? '$inverseColor' : '$colorMuted'} textAlign="center">{t('shopOwner.calendar.monthMode')}</Text>
                  </Pressable>
                </View>

                <View style={[styles.navRow, { flexDirection: rtlLayout.rowDirection }]}>
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

        keyExtractor={(item) => item.id}
        renderItem={renderRow}
      />

      <Modal
        animationType="slide"
        onRequestClose={handleCloseAppointment}
        presentationStyle="formSheet"
        visible={selectedAppointment != null}
      >
        <View style={[styles.modalScreen, { backgroundColor: colors.background }]}>
          <Card>
            <Text fontFamily="$heading" fontSize={24} fontWeight="800" lineHeight={30} textAlign={rtlLayout.textAlign}>
              {t('shopOwner.calendar.appointmentDetailsTitle')}
            </Text>

            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
              {t('shopOwner.calendar.itemBarber', {
                barber: selectedAppointment?.barber?.name ?? t('shopOwner.calendar.unknownBarber'),
              })}
            </Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
              {t('shopOwner.calendar.itemCustomer', {
                customer: selectedAppointment?.customer?.full_name ?? t('shopOwner.calendar.unknownCustomer'),
              })}
            </Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{selectedAppointmentDateLabel}</Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{selectedAppointmentTimeRange}</Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
              {t('shopOwner.calendar.itemStatus', {
                status:
                  selectedAppointment != null
                    ? getStatusText(selectedAppointment.status)
                    : t('shopOwner.appointmentStatus.pending'),
              })}
            </Text>
            {selectedAppointment?.notes != null && selectedAppointment.notes.trim().length > 0 ? (
              <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{selectedAppointment.notes}</Text>
            ) : null}

            {statusUpdateError != null ? <Text color="$error" textAlign={rtlLayout.textAlign}>{statusUpdateError}</Text> : null}

            <View style={styles.modalActions}>
              {canConfirmSelectedAppointment ? (
                <Button disabled={statusMutation.isPending} onPress={() => handleUpdateStatus('confirmed')}>
                  <ButtonText>
                    {pendingStatusUpdate === 'confirmed'
                      ? t('shopOwner.calendar.confirmingButton')
                      : t('shopOwner.calendar.confirmButton')}
                  </ButtonText>
                </Button>
              ) : null}

              {canCancelSelectedAppointment ? (
                <Button disabled={statusMutation.isPending} onPress={() => handleUpdateStatus('cancelled')}>
                  <ButtonText>
                    {pendingStatusUpdate === 'cancelled'
                      ? t('shopOwner.calendar.cancellingButton')
                      : t('shopOwner.calendar.cancelButton')}
                  </ButtonText>
                </Button>
              ) : null}

              <Button disabled={statusMutation.isPending} onPress={handleCloseAppointment}>
                <ButtonText>{t('shopOwner.calendar.closeButton')}</ButtonText>
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
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
  modalActions: {
    gap: 8,
  },
  modalScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modePill: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 84,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeRow: {
    flexWrap: 'wrap',
    gap: 8,
  },
  navRow: {
    flexWrap: 'wrap',
    gap: 8,
  },
  screen: {
    flex: 1,
  },
});
