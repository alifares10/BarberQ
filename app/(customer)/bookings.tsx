import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppointmentCard, Button, ButtonText, Card, LoadingScreen, Text } from '@/components';
import { cancelAppointment, fetchCustomerAppointments, type CustomerAppointment } from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { normalizeTime, parseIsoDate } from '@/lib/shop-owner/appointments-helpers';
import { useAuthStore } from '@/stores/auth-store';

type BookingListItem =
  | {
      id: string;
      title: string;
      type: 'header';
    }
  | {
      appointment: CustomerAppointment;
      canCancel: boolean;
      dateLabel: string;
      id: string;
      servicesSummary: string;
      showCancelAction: boolean;
      status: 'cancelled' | 'completed' | 'confirmed' | 'pending' | 'unknown';
      statusLabel: string;
      type: 'appointment';
    };

function toAppointmentDateTime(dateValue: string, timeValue: string) {
  const parsedDate = parseIsoDate(dateValue);
  const [hoursRaw, minutesRaw] = timeValue.split(':');
  const hours = Number.parseInt(hoursRaw ?? '0', 10);
  const minutes = Number.parseInt(minutesRaw ?? '0', 10);

  parsedDate.setHours(hours, minutes, 0, 0);

  return parsedDate;
}

export default function CustomerBookingsScreen() {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user.id ?? null;
  const [cancelingAppointmentId, setCancelingAppointmentId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', weekday: 'short', year: 'numeric' }),
    [i18n.language]
  );
  const appointmentsQuery = useQuery({
    enabled: customerId != null,
    queryFn: () => fetchCustomerAppointments(customerId ?? ''),
    queryKey:
      customerId != null
        ? customerQueryKeys.customerAppointments(customerId)
        : ['customer', 'appointments', 'unknown'],
  });
  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: async () => {
      if (customerId != null) {
        await queryClient.invalidateQueries({ queryKey: customerQueryKeys.customerAppointments(customerId) });
      }
    },
  });

  const getStatusLabel = useCallback(
    (status: string) => {
      if (status === 'pending') {
        return t('customer.bookings.status.pending');
      }

      if (status === 'confirmed') {
        return t('customer.bookings.status.confirmed');
      }

      if (status === 'completed') {
        return t('customer.bookings.status.completed');
      }

      if (status === 'cancelled') {
        return t('customer.bookings.status.cancelled');
      }

      return t('customer.bookings.status.unknown');
    },
    [t]
  );

  const rows = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const now = Date.now();
    const parsed = appointments.map((appointment) => {
      const appointmentDateTime = toAppointmentDateTime(appointment.appointment_date, appointment.appointment_time);
      const status = appointment.status;
      const hasUpcomingStatus = status === 'pending' || status === 'confirmed';
      const isUpcoming = hasUpcomingStatus && appointmentDateTime.getTime() >= now;
      const cancellationWindow = appointment.shop?.cancellation_window_hours;
      const hoursUntil = (appointmentDateTime.getTime() - now) / 3_600_000;
      const canCancel = isUpcoming && (cancellationWindow == null || hoursUntil >= cancellationWindow);
      const serviceNames = appointment.appointment_services
        .map((serviceLink) => serviceLink.service?.name)
        .filter((serviceName): serviceName is string => serviceName != null && serviceName.length > 0);
      const servicesSummary =
        serviceNames.length === 0
          ? t('customer.bookings.noServices')
          : serviceNames.length <= 2
            ? serviceNames.join(', ')
            : t('customer.bookings.moreServices', {
                count: serviceNames.length - 2,
                names: serviceNames.slice(0, 2).join(', '),
              });

      return {
        appointment,
        appointmentDateTime,
        canCancel,
        dateLabel: dateFormatter.format(appointmentDateTime),
        isUpcoming,
        servicesSummary,
      };
    });
    const upcoming = parsed
      .filter((item) => item.isUpcoming)
      .sort((itemA, itemB) => itemA.appointmentDateTime.getTime() - itemB.appointmentDateTime.getTime());
    const past = parsed
      .filter((item) => !item.isUpcoming)
      .sort((itemA, itemB) => itemB.appointmentDateTime.getTime() - itemA.appointmentDateTime.getTime());
    const listItems: BookingListItem[] = [];

    if (upcoming.length > 0) {
      listItems.push({
        id: 'header-upcoming',
        title: t('customer.bookings.upcomingSection'),
        type: 'header',
      });

      for (const item of upcoming) {
        const statusValue =
          item.appointment.status === 'pending' ||
          item.appointment.status === 'confirmed' ||
          item.appointment.status === 'completed' ||
          item.appointment.status === 'cancelled'
            ? item.appointment.status
            : 'unknown';

        listItems.push({
          appointment: item.appointment,
          canCancel: item.canCancel,
          dateLabel: item.dateLabel,
          id: `appointment-${item.appointment.id}`,
          servicesSummary: item.servicesSummary,
          showCancelAction: true,
          status: statusValue,
          statusLabel: getStatusLabel(item.appointment.status),
          type: 'appointment',
        });
      }
    }

    if (past.length > 0) {
      listItems.push({
        id: 'header-past',
        title: t('customer.bookings.pastSection'),
        type: 'header',
      });

      for (const item of past) {
        const statusValue =
          item.appointment.status === 'pending' ||
          item.appointment.status === 'confirmed' ||
          item.appointment.status === 'completed' ||
          item.appointment.status === 'cancelled'
            ? item.appointment.status
            : 'unknown';

        listItems.push({
          appointment: item.appointment,
          canCancel: false,
          dateLabel: item.dateLabel,
          id: `appointment-${item.appointment.id}`,
          servicesSummary: item.servicesSummary,
          showCancelAction: false,
          status: statusValue,
          statusLabel: getStatusLabel(item.appointment.status),
          type: 'appointment',
        });
      }
    }

    return listItems;
  }, [appointmentsQuery.data, dateFormatter, getStatusLabel, t]);

  const executeCancel = useCallback(
    async (appointmentId: string) => {
      setCancelError(null);
      setCancelingAppointmentId(appointmentId);

      try {
        await cancelMutation.mutateAsync(appointmentId);
      } catch {
        setCancelError(t('customer.bookings.cancelError'));
      } finally {
        setCancelingAppointmentId(null);
      }
    },
    [cancelMutation, t]
  );
  const handleCancel = useCallback(
    (appointmentId: string) => {
      Alert.alert(t('customer.bookings.cancelConfirmTitle'), t('customer.bookings.cancelConfirmMessage'), [
        {
          style: 'cancel',
          text: t('customer.bookings.cancelConfirmKeepButton'),
        },
        {
          onPress: () => {
            void executeCancel(appointmentId);
          },
          style: 'destructive',
          text: t('customer.bookings.cancelConfirmProceedButton'),
        },
      ]);
    },
    [executeCancel, t]
  );

  const renderRow = useCallback<ListRenderItem<BookingListItem>>(
    ({ item }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.sectionHeader}>
            <Text fontWeight="700">{item.title}</Text>
          </View>
        );
      }

      return (
        <AppointmentCard
          appointmentId={item.appointment.id}
          barberName={item.appointment.barber?.name ?? t('customer.bookings.unknownBarber')}
          canCancel={item.canCancel}
          date={item.dateLabel}
          endTime={normalizeTime(item.appointment.end_time)}
          isCancelling={cancelingAppointmentId === item.appointment.id}
          onCancel={handleCancel}
          servicesSummary={item.servicesSummary}
          shopName={item.appointment.shop?.name ?? t('customer.bookings.unknownShop')}
          showCancelAction={item.showCancelAction}
          startTime={normalizeTime(item.appointment.appointment_time)}
          status={item.status}
          statusLabel={item.statusLabel}
        />
      );
    },
    [cancelingAppointmentId, handleCancel, t]
  );

  if (customerId == null) {
    return (
      <View style={styles.errorContainer}>
        <Card>
          <Text color="$error">{t('customer.bookings.missingSession')}</Text>
        </Card>
      </View>
    );
  }

  if (appointmentsQuery.isPending) {
    return <LoadingScreen />;
  }

  if (appointmentsQuery.isError) {
    return (
      <View style={styles.errorContainer}>
        <Card>
          <Text color="$error">{t('customer.bookings.loadError')}</Text>
          <Button onPress={() => void appointmentsQuery.refetch()}>
            <ButtonText>{t('customer.bookings.retryButton')}</ButtonText>
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
            <Text color="$colorMuted">{t('customer.bookings.empty')}</Text>
          </Card>
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Card>
              <Text fontFamily="$heading" fontSize={28} fontWeight="800">
                {t('customer.bookings.title')}
              </Text>
              <Text color="$colorMuted">{t('customer.bookings.description')}</Text>
            </Card>

            {cancelError != null ? (
              <Card>
                <Text color="$error">{cancelError}</Text>
              </Card>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        data={rows}
        estimatedItemSize={160}
        getItemType={(item) => item.type}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    padding: 16,
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
  sectionHeader: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});
