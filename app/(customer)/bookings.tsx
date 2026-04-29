import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  Eyebrow,
  LoadingScreen,
  SerifTitle,
  StateCard,
  Text,
  useToast,
} from '@/components';
import {
  AppointmentCard,
  type AppointmentStatusKind,
} from '@/components/customer/AppointmentCard';
import { DateRail } from '@/components/customer/DateRail';
import {
  cancelAppointment,
  fetchCustomerAppointments,
  type CustomerAppointment,
} from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { fontFamilies } from '@/lib/fonts';
import { notifyBookingCancelled } from '@/lib/push/notify-booking';
import { parseIsoDate } from '@/lib/shop-owner/appointments-helpers';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

type BookingListItem =
  | { type: 'header'; id: string; title: string; count: number; tone: 'gold' | 'muted' }
  | {
      type: 'appointment';
      id: string;
      appointment: CustomerAppointment;
      compact: boolean;
      canCancel: boolean;
      showCancelAction: boolean;
      dateEyebrow: string;
      startTime: string;
      servicesSummary: string;
      status: AppointmentStatusKind;
      statusLabel: string;
    };

function toAppointmentDateTime(dateValue: string, timeValue: string) {
  const parsedDate = parseIsoDate(dateValue);
  const [hoursRaw, minutesRaw] = timeValue.split(':');
  const hours = Number.parseInt(hoursRaw ?? '0', 10);
  const minutes = Number.parseInt(minutesRaw ?? '0', 10);

  parsedDate.setHours(hours, minutes, 0, 0);

  return parsedDate;
}

const formatTime = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

const next6Days = () => {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
};

export default function CustomerBookingsScreen() {
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user.id ?? null;
  const [cancelingAppointmentId, setCancelingAppointmentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dates = useMemo(() => next6Days(), []);
  const dateEyebrowFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' }),
    [i18n.language],
  );
  const compactDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { month: 'short', day: '2-digit' }),
    [i18n.language],
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
    onSuccess: async (appointment) => {
      void notifyBookingCancelled(appointment.id, 'customer');

      if (customerId != null) {
        await queryClient.invalidateQueries({
          queryKey: customerQueryKeys.customerAppointments(customerId),
        });
      }
    },
  });

  const getStatusLabel = useCallback(
    (status: string) => {
      if (status === 'pending') return t('customer.bookings.status.pending');
      if (status === 'confirmed') return t('customer.bookings.status.confirmed');
      if (status === 'completed') return t('customer.bookings.status.completed');
      if (status === 'cancelled') return t('customer.bookings.status.cancelled');
      return t('customer.bookings.status.unknown');
    },
    [t],
  );

  const { upcoming, past, countByDate } = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const now = Date.now();
    const counts: Record<string, number> = {};
    const upcomingItems: BookingListItem[] = [];
    const pastItems: BookingListItem[] = [];

    const parsed = appointments.map((appointment) => {
      const dt = toAppointmentDateTime(appointment.appointment_date, appointment.appointment_time);
      const status = appointment.status;
      const isUpcomingStatus = status === 'pending' || status === 'confirmed';
      const isUpcoming = isUpcomingStatus && dt.getTime() >= now;
      const cancellationWindow = appointment.shop?.cancellation_window_hours;
      const hoursUntil = (dt.getTime() - now) / 3_600_000;
      const canCancel =
        isUpcoming && (cancellationWindow == null || hoursUntil >= cancellationWindow);

      const serviceNames = appointment.appointment_services
        .map((link) => link.service?.name)
        .filter((name): name is string => name != null && name.length > 0);
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
        dt,
        isUpcoming,
        canCancel,
        servicesSummary,
      };
    });

    parsed.sort((a, b) => a.dt.getTime() - b.dt.getTime());

    for (const entry of parsed) {
      const statusValue: AppointmentStatusKind =
        entry.appointment.status === 'pending' ||
        entry.appointment.status === 'confirmed' ||
        entry.appointment.status === 'completed' ||
        entry.appointment.status === 'cancelled'
          ? entry.appointment.status
          : 'unknown';

      const dateEyebrow = dateEyebrowFormatter.format(entry.dt).toUpperCase();
      const startTime = formatTime(entry.dt, i18n.language);
      const isoDate = entry.appointment.appointment_date;

      if (entry.isUpcoming) {
        counts[isoDate] = (counts[isoDate] ?? 0) + 1;
        if (selectedDate != null && isoDate !== selectedDate) {
          continue;
        }
        upcomingItems.push({
          type: 'appointment',
          id: `appointment-${entry.appointment.id}`,
          appointment: entry.appointment,
          compact: false,
          canCancel: entry.canCancel,
          showCancelAction: true,
          dateEyebrow,
          startTime,
          servicesSummary: entry.servicesSummary,
          status: statusValue,
          statusLabel: getStatusLabel(entry.appointment.status),
        });
      } else {
        pastItems.push({
          type: 'appointment',
          id: `appointment-${entry.appointment.id}`,
          appointment: entry.appointment,
          compact: true,
          canCancel: false,
          showCancelAction: false,
          dateEyebrow: compactDateFormatter.format(entry.dt).toUpperCase(),
          startTime,
          servicesSummary: entry.servicesSummary,
          status: statusValue,
          statusLabel: getStatusLabel(entry.appointment.status),
        });
      }
    }

    return {
      upcoming: upcomingItems,
      past: pastItems.reverse(), // newest past first
      countByDate: counts,
    };
  }, [
    appointmentsQuery.data,
    selectedDate,
    dateEyebrowFormatter,
    compactDateFormatter,
    getStatusLabel,
    i18n.language,
    t,
  ]);

  const rows = useMemo<BookingListItem[]>(() => {
    const out: BookingListItem[] = [];
    if (upcoming.length > 0) {
      out.push({
        type: 'header',
        id: 'header-upcoming',
        title: t('customer.bookings.upcomingSection'),
        count: upcoming.length,
        tone: 'gold',
      });
      out.push(...upcoming);
    }
    if (past.length > 0) {
      out.push({
        type: 'header',
        id: 'header-past',
        title: t('customer.bookings.pastSection'),
        count: past.length,
        tone: 'muted',
      });
      out.push(...past);
    }
    return out;
  }, [upcoming, past, t]);

  const executeCancel = useCallback(
    async (appointmentId: string) => {
      setCancelingAppointmentId(appointmentId);
      try {
        await cancelMutation.mutateAsync(appointmentId);
        showToast({ message: t('toast.bookingCancelled'), type: 'success' });
      } catch {
        showToast({ message: t('customer.bookings.cancelError'), type: 'error' });
      } finally {
        setCancelingAppointmentId(null);
      }
    },
    [cancelMutation, showToast, t],
  );

  const handleCancel = useCallback(
    (appointmentId: string) => {
      Alert.alert(
        t('customer.bookings.cancelConfirmTitle'),
        t('customer.bookings.cancelConfirmMessage'),
        [
          { style: 'cancel', text: t('customer.bookings.cancelConfirmKeepButton') },
          {
            onPress: () => void executeCancel(appointmentId),
            style: 'destructive',
            text: t('customer.bookings.cancelConfirmProceedButton'),
          },
        ],
      );
    },
    [executeCancel, t],
  );

  const renderRow = useCallback<ListRenderItem<BookingListItem>>(
    ({ item }) => {
      if (item.type === 'header') {
        return (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 8,
              marginBottom: 14,
            }}
          >
            <Eyebrow
              size={9}
              color={item.tone === 'gold' ? colors.gold : colors.muted}
            >
              {item.title}
            </Eyebrow>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.lineSoft }} />
            <Text
              style={{
                fontFamily: fontFamilies.mono.regular,
                fontSize: 11,
                fontVariant: ['tabular-nums'],
                color: colors.muted,
              }}
            >
              {item.count}
            </Text>
          </View>
        );
      }

      const { appointment } = item;
      return (
        <View style={{ marginBottom: item.compact ? 0 : 12 }}>
          <AppointmentCard
            appointmentId={appointment.id}
            shopName={appointment.shop?.name ?? t('customer.bookings.unknownShop')}
            shopCoverImageUrl={appointment.shop?.cover_image_url ?? null}
            barberName={appointment.barber?.name ?? t('customer.bookings.unknownBarber')}
            servicesSummary={item.servicesSummary}
            dateEyebrow={item.dateEyebrow}
            startTime={item.startTime}
            status={item.status}
            statusLabel={item.statusLabel}
            compact={item.compact}
            canCancel={item.canCancel}
            showCancelAction={item.showCancelAction}
            isCancelling={cancelingAppointmentId === appointment.id}
            onCancel={handleCancel}
          />
        </View>
      );
    },
    [colors.gold, colors.muted, colors.lineSoft, cancelingAppointmentId, handleCancel, t],
  );

  if (customerId == null) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: colors.bg }}>
        <StateCard description={t('customer.bookings.missingSession')} variant="error" />
      </View>
    );
  }

  if (appointmentsQuery.isPending) {
    return <LoadingScreen />;
  }

  if (appointmentsQuery.isError) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: colors.bg }}>
        <StateCard
          actionLabel={t('customer.bookings.retryButton')}
          description={t('customer.bookings.loadError')}
          onAction={() => void appointmentsQuery.refetch()}
          variant="error"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <SerifTitle size={32} weight="regular">
          {t('customer.bookings.title')}
        </SerifTitle>
        <Eyebrow
          size={11}
          color={colors.gold}
          style={{ letterSpacing: 1 }}
        >
          {t('customer.bookings.newButton')}
        </Eyebrow>
      </View>

      <View style={{ marginTop: 18 }}>
        <DateRail
          dates={dates}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          countByDate={countByDate}
          locale={i18n.language}
        />
      </View>

      <View style={{ flex: 1, marginTop: 18 }}>
        <FlashList
          // Force a remount when the date filter flips. FlashList v2
          // caches per-row offsets internally and reuses them across
          // re-renders, which left phantom space above the first row
          // and pushed initial content below the fold when `data`
          // shrank from filtering.
          key={selectedDate ?? '__all__'}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 20 }}>
              <StateCard description={t('customer.bookings.empty')} variant="empty" />
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 24,
          }}
          data={rows}
          getItemType={(item) => {
            if (item.type === 'header') return 'header';
            return item.compact ? 'past' : 'upcoming';
          }}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
        />
      </View>
    </View>
  );
}
