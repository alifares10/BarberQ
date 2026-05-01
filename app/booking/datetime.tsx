import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  CTA,
  LoadingScreen,
  Photo,
  ProgressBar,
  SerifTitle,
  StateCard,
  Text,
  useToast,
} from '@/components';
import { ModalHeader } from '@/components/booking/ModalHeader';
import { BookingDetailRow } from '@/components/booking/BookingDetailRow';
import { DateChip } from '@/components/customer/DateChip';
import { MonthStrip } from '@/components/customer/MonthStrip';
import { TimeSlotChip } from '@/components/customer/TimeSlotChip';
import {
  createAppointment,
  createAppointmentServices,
  fetchActiveBarbersByShopId,
  fetchBarberBookingsByDate,
  fetchBarberUnavailableByDate,
  fetchServicesByBarberId,
  fetchShopById,
  fetchShopClosureByDate,
  fetchWorkingHoursByBarberAndDay,
} from '@/lib/customer/api';
import { customerQueryKeys } from '@/lib/customer/query-keys';
import { generateAvailableSlots, minutesToTime, timeToMinutes } from '@/lib/customer/slot-helpers';
import { notifyNewBooking } from '@/lib/push/notify-booking';
import { useAppTheme } from '@/lib/theme';
import { addDays, parseIsoDate, toIsoDate } from '@/lib/shop-owner/appointments-helpers';
import { fontFamilies } from '@/lib/fonts';
import { useAuthStore } from '@/stores/auth-store';
import { useBookingStore } from '@/stores/booking-store';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';
const DEFAULT_PLACEHOLDER = { blurhash: DEFAULT_BLURHASH };

const STEP = 3;
const TOTAL = 4;
const DATE_WINDOW_SIZE = 7;

type DateOption = {
  dateIso: string;
  dateLabel: string;
  dayLabel: string;
  isPast: boolean;
};

function getErrorCode(error: unknown) {
  if (typeof error !== 'object' || error == null || !('code' in error)) {
    return null;
  }
  const { code } = error as { code?: unknown };
  return typeof code === 'string' ? code : null;
}

/** Format minutes-since-midnight as a localized clock string ("3:30 PM"). */
function formatTimeLabel(time: string, formatter: Intl.DateTimeFormat) {
  try {
    const [h, m] = time.split(':').map((n) => Number.parseInt(n, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) {
      return time;
    }
    const stub = new Date();
    stub.setHours(h, m, 0, 0);
    return formatter.format(stub);
  } catch {
    return time;
  }
}

export default function BookingDateTimeScreen() {
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user.id ?? null;
  const notes = useBookingStore((state) => state.notes);
  const resetBooking = useBookingStore((state) => state.reset);
  const selectedBarberId = useBookingStore((state) => state.selectedBarberId);
  const selectedDate = useBookingStore((state) => state.selectedDate);
  const selectedServiceIds = useBookingStore((state) => state.selectedServiceIds);
  const selectedShopId = useBookingStore((state) => state.selectedShopId);
  const selectedTime = useBookingStore((state) => state.selectedTime);
  const setNotes = useBookingStore((state) => state.setNotes);
  const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
  const setSelectedTime = useBookingStore((state) => state.setSelectedTime);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [windowStart, setWindowStart] = useState(() => new Date());

  const hasContext =
    selectedBarberId != null &&
    selectedShopId != null &&
    selectedServiceIds.length > 0 &&
    customerId != null;

  // ── Formatters ────────────────────────────────────────────────────
  const dayShortFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }),
    [i18n.language],
  );
  const dayLongFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }),
    [i18n.language],
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }),
    [i18n.language],
  );
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }),
    [i18n.language],
  );
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }),
    [i18n.language],
  );
  const dayInRail = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }),
    [i18n.language],
  );

  // ── Date window (7 days) ──────────────────────────────────────────
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const dateOptions = useMemo<DateOption[]>(() => {
    const start = new Date(windowStart);
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: DATE_WINDOW_SIZE }, (_, index) => {
      const value = addDays(start, index);
      return {
        dateIso: toIsoDate(value),
        dateLabel: String(value.getDate()),
        dayLabel: dayInRail.format(value),
        isPast: value.getTime() < today.getTime(),
      };
    });
  }, [dayInRail, today, windowStart]);
  const monthLabel = monthFormatter.format(windowStart);
  const canGoPrev = useMemo(() => {
    const earlier = addDays(windowStart, -DATE_WINDOW_SIZE);
    earlier.setHours(0, 0, 0, 0);
    return addDays(earlier, DATE_WINDOW_SIZE - 1).getTime() >= today.getTime();
  }, [today, windowStart]);

  // ── Queries (logic preserved from previous screen) ────────────────
  const selectedDateDayOfWeek = useMemo(
    () => (selectedDate != null ? parseIsoDate(selectedDate).getDay() : null),
    [selectedDate],
  );
  const shopQuery = useQuery({
    enabled: selectedShopId != null,
    queryFn: () => fetchShopById(selectedShopId ?? ''),
    queryKey:
      selectedShopId != null
        ? customerQueryKeys.shopById(selectedShopId)
        : ['customer', 'shop', 'unknown'],
  });
  const barbersQuery = useQuery({
    enabled: selectedShopId != null,
    queryFn: () => fetchActiveBarbersByShopId(selectedShopId ?? ''),
    queryKey:
      selectedShopId != null
        ? customerQueryKeys.barbersByShop(selectedShopId)
        : ['customer', 'barbers', 'unknown'],
  });
  const servicesQuery = useQuery({
    enabled: selectedBarberId != null,
    queryFn: () => fetchServicesByBarberId(selectedBarberId ?? ''),
    queryKey:
      selectedBarberId != null
        ? customerQueryKeys.servicesByBarber(selectedBarberId)
        : ['customer', 'services', 'unknown'],
  });
  const shopClosureQuery = useQuery({
    enabled: selectedDate != null && selectedShopId != null,
    queryFn: () => fetchShopClosureByDate(selectedShopId ?? '', selectedDate ?? ''),
    queryKey:
      selectedDate != null && selectedShopId != null
        ? customerQueryKeys.shopClosure(selectedShopId, selectedDate)
        : ['customer', 'shop-closure', 'unknown', 'unknown'],
  });
  const barberUnavailableQuery = useQuery({
    enabled: selectedDate != null && selectedBarberId != null,
    queryFn: () => fetchBarberUnavailableByDate(selectedBarberId ?? '', selectedDate ?? ''),
    queryKey:
      selectedDate != null && selectedBarberId != null
        ? customerQueryKeys.barberUnavailable(selectedBarberId, selectedDate)
        : ['customer', 'barber-unavailable', 'unknown', 'unknown'],
  });
  const workingHoursQuery = useQuery({
    enabled: selectedDateDayOfWeek != null && selectedBarberId != null,
    queryFn: () => fetchWorkingHoursByBarberAndDay(selectedBarberId ?? '', selectedDateDayOfWeek ?? 0),
    queryKey:
      selectedDateDayOfWeek != null && selectedBarberId != null
        ? customerQueryKeys.workingHours(selectedBarberId, selectedDateDayOfWeek)
        : ['customer', 'working-hours', 'unknown', -1],
  });
  const barberBookingsQuery = useQuery({
    enabled: selectedDate != null && selectedBarberId != null,
    queryFn: () => fetchBarberBookingsByDate(selectedBarberId ?? '', selectedDate ?? ''),
    queryKey:
      selectedDate != null && selectedBarberId != null
        ? customerQueryKeys.barberBookings(selectedBarberId, selectedDate)
        : ['customer', 'barber-bookings', 'unknown', 'unknown'],
  });

  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const selectedServiceSet = useMemo(
    () => new Set(selectedServiceIds),
    [selectedServiceIds],
  );
  const selectedServices = useMemo(
    () =>
      services.filter((service) => selectedServiceSet.has(service.id)).map((service) => ({
        duration: service.duration,
        id: service.id,
        name: service.name,
        price: service.price,
      })),
    [selectedServiceSet, services],
  );
  const totals = useMemo(
    () =>
      selectedServices.reduce(
        (accumulator, service) => ({
          totalDurationMinutes: accumulator.totalDurationMinutes + service.duration,
          totalPrice: accumulator.totalPrice + service.price,
        }),
        { totalDurationMinutes: 0, totalPrice: 0 },
      ),
    [selectedServices],
  );

  const shopName = shopQuery.data?.name ?? t('customer.datetime.unknownShop');
  const barberName = useMemo(() => {
    const matched = (barbersQuery.data ?? []).find((b) => b.id === selectedBarberId);
    return matched?.name ?? t('customer.datetime.unknownBarber');
  }, [barbersQuery.data, selectedBarberId, t]);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const availableSlots = useMemo(() => {
    if (selectedDate == null || totals.totalDurationMinutes <= 0) {
      return [];
    }
    if (shopClosureQuery.data != null || barberUnavailableQuery.data != null) {
      return [];
    }
    const workingWindows = (workingHoursQuery.data ?? []).flatMap((hour) => {
      try {
        return [
          {
            endMinutes: timeToMinutes(hour.end_time),
            startMinutes: timeToMinutes(hour.start_time),
          },
        ];
      } catch {
        return [];
      }
    });
    const existingBookings = (barberBookingsQuery.data ?? []).flatMap((booking) => {
      try {
        return [
          {
            endMinutes: timeToMinutes(booking.end_time),
            startMinutes: timeToMinutes(booking.appointment_time),
          },
        ];
      } catch {
        return [];
      }
    });
    const now = new Date();
    return generateAvailableSlots({
      bufferMinutes: shopQuery.data?.buffer_minutes ?? 0,
      existingBookings,
      isToday: selectedDate === todayIso,
      nowMinutes: now.getHours() * 60 + now.getMinutes(),
      totalDurationMinutes: totals.totalDurationMinutes,
      workingWindows,
    });
  }, [
    barberBookingsQuery.data,
    barberUnavailableQuery.data,
    selectedDate,
    shopClosureQuery.data,
    shopQuery.data?.buffer_minutes,
    todayIso,
    totals.totalDurationMinutes,
    workingHoursQuery.data,
  ]);

  // Split slots into morning / afternoon at the 12:00 boundary
  // (inclusive — 12:00 lands in afternoon).
  const morningSlots = useMemo(
    () => availableSlots.filter((time) => Number.parseInt(time.split(':')[0] ?? '0', 10) < 12),
    [availableSlots],
  );
  const afternoonSlots = useMemo(
    () => availableSlots.filter((time) => Number.parseInt(time.split(':')[0] ?? '0', 10) >= 12),
    [availableSlots],
  );

  const isLoadingBaseData =
    servicesQuery.isPending || shopQuery.isPending || barbersQuery.isPending;
  const isBaseDataError =
    servicesQuery.isError || shopQuery.isError || barbersQuery.isError;
  const isLoadingAvailability =
    selectedDate != null &&
    (shopClosureQuery.isPending ||
      barberUnavailableQuery.isPending ||
      workingHoursQuery.isPending ||
      barberBookingsQuery.isPending);
  const hasAvailabilityError =
    selectedDate != null &&
    (shopClosureQuery.isError ||
      barberUnavailableQuery.isError ||
      workingHoursQuery.isError ||
      barberBookingsQuery.isError);
  const canReview =
    selectedDate != null && selectedTime != null && selectedServices.length > 0;

  useEffect(() => {
    if (selectedTime == null || selectedDate == null || isLoadingAvailability) {
      return;
    }
    if (!availableSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [availableSlots, isLoadingAvailability, selectedDate, selectedTime, setSelectedTime]);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (
        customerId == null ||
        selectedBarberId == null ||
        selectedShopId == null ||
        selectedDate == null ||
        selectedTime == null
      ) {
        throw new Error(t('customer.datetime.errors.missingContext'));
      }
      const endTime = minutesToTime(timeToMinutes(selectedTime) + totals.totalDurationMinutes);
      const appointment = await createAppointment({
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        barber_id: selectedBarberId,
        customer_id: customerId,
        end_time: endTime,
        notes: notes.trim().length > 0 ? notes.trim() : null,
        shop_id: selectedShopId,
        status: 'pending',
      });
      await createAppointmentServices(appointment.id, selectedServiceIds);
      return appointment;
    },
    onError: (error) => {
      const errorCode = getErrorCode(error);
      if (errorCode === '23P01') {
        setSubmissionError(t('customer.datetime.errors.slotTaken'));
        return;
      }
      setSubmissionError(t('customer.datetime.errors.createFailed'));
    },
    onSuccess: async (appointment) => {
      void notifyNewBooking(appointment.id);
      if (customerId != null) {
        await queryClient.invalidateQueries({
          queryKey: customerQueryKeys.customerAppointments(customerId),
        });
      }
      setSubmissionError(null);
      showToast({ message: t('toast.bookingCreated'), type: 'success' });
      setReviewModalVisible(false);
      resetBooking();
      router.replace('/(customer)/bookings');
    },
  });

  const handleSelectDate = useCallback(
    (date: string) => {
      if (selectedDate === date) {
        setSelectedDate(null);
        setSelectedTime(null);
        return;
      }
      setSelectedDate(date);
      setSelectedTime(null);
    },
    [selectedDate, setSelectedDate, setSelectedTime],
  );
  const handleSelectTime = useCallback(
    (time: string) => {
      if (selectedTime === time) {
        setSelectedTime(null);
        return;
      }
      setSelectedTime(time);
    },
    [selectedTime, setSelectedTime],
  );
  const handleReviewBooking = useCallback(() => {
    if (!canReview) {
      return;
    }
    setSubmissionError(null);
    setReviewModalVisible(true);
  }, [canReview]);
  const handleConfirmBooking = useCallback(() => {
    setSubmissionError(null);
    createBookingMutation.mutate();
  }, [createBookingMutation]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);
  const handleClose = useCallback(() => {
    router.replace('/(customer)');
  }, [router]);

  const handlePrevWindow = useCallback(() => {
    setWindowStart((current) => {
      const earlier = addDays(current, -DATE_WINDOW_SIZE);
      earlier.setHours(0, 0, 0, 0);
      // Don't roll back past today — find the latest "snap" that keeps
      // today inside the window if the user reaches the boundary.
      if (earlier.getTime() < today.getTime()) {
        return today;
      }
      return earlier;
    });
  }, [today]);
  const handleNextWindow = useCallback(() => {
    setWindowStart((current) => addDays(current, DATE_WINDOW_SIZE));
  }, []);

  if (!hasContext) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          backgroundColor: colors.bg,
          justifyContent: 'center',
        }}
      >
        <StateCard
          actionLabel={t('customer.datetime.backToExplore')}
          description={t('customer.datetime.errors.missingContext')}
          onAction={() => router.replace('/(customer)')}
          variant="error"
        />
      </View>
    );
  }

  if (isLoadingBaseData) {
    return <LoadingScreen />;
  }

  if (isBaseDataError) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          backgroundColor: colors.bg,
          justifyContent: 'center',
        }}
      >
        <StateCard
          actionLabel={t('customer.datetime.retryButton')}
          description={t('customer.datetime.errors.loadFailed')}
          onAction={() => {
            void shopQuery.refetch();
            void barbersQuery.refetch();
            void servicesQuery.refetch();
          }}
          variant="error"
        />
      </View>
    );
  }

  const continueLabel = (() => {
    if (selectedDate == null || selectedTime == null) {
      return t('booking.datetimeContinueCta');
    }
    const date = parseIsoDate(selectedDate);
    const day = dayShortFormatter.format(date);
    const time = formatTimeLabel(selectedTime, timeFormatter);
    return t('booking.datetimeContinueWithSlot', { day, time });
  })();

  const cancellationHours = shopQuery.data?.cancellation_window_hours ?? null;
  const cancellationHint =
    cancellationHours != null && cancellationHours > 0
      ? t('booking.confirmCancellationHint', { hours: cancellationHours })
      : t('booking.confirmCancellationOpen');

  const confirmWhenValue = (() => {
    if (selectedDate == null || selectedTime == null) {
      return '—';
    }
    const date = parseIsoDate(selectedDate);
    return t('booking.confirmDetailWhenValue', {
      date: dateFormatter.format(date),
      day: dayLongFormatter.format(date),
      time: formatTimeLabel(selectedTime, timeFormatter),
    });
  })();

  const confirmDurationValue = t('booking.confirmDetailDurationValue', {
    minutes: totals.totalDurationMinutes,
  });
  const confirmServicesValue = selectedServices.map((s) => s.name).join(' · ');

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
        <SerifTitle size={28}>{t('booking.datetimeHeadlineA')}</SerifTitle>
        <SerifTitle size={28} italic color={colors.gold}>
          {t('booking.datetimeHeadlineB')}
        </SerifTitle>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <MonthStrip
          label={monthLabel}
          canGoPrev={canGoPrev}
          onPrev={handlePrevWindow}
          onNext={handleNextWindow}
        />
      </View>

      <View
        style={{
          paddingHorizontal: 20,
          marginTop: 16,
          flexDirection: 'row',
          gap: 6,
        }}
      >
        {dateOptions.map((option) => (
          <DateChip
            key={option.dateIso}
            date={option.dateIso}
            dateLabel={option.dateLabel}
            dayLabel={option.dayLabel}
            isDisabled={option.isPast}
            isSelected={selectedDate === option.dateIso}
            onSelect={handleSelectDate}
          />
        ))}
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 24 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        {selectedDate == null ? (
          <StateCard description={t('customer.datetime.selectDatePrompt')} variant="info" />
        ) : isLoadingAvailability ? (
          <StateCard description={t('customer.datetime.loadingAvailability')} variant="loading" />
        ) : hasAvailabilityError ? (
          <StateCard
            actionLabel={t('customer.datetime.retryButton')}
            description={t('customer.datetime.errors.availabilityFailed')}
            onAction={() => {
              void shopClosureQuery.refetch();
              void barberUnavailableQuery.refetch();
              void workingHoursQuery.refetch();
              void barberBookingsQuery.refetch();
            }}
            variant="error"
          />
        ) : shopClosureQuery.data != null ? (
          <StateCard description={t('customer.datetime.shopClosed')} variant="info" />
        ) : barberUnavailableQuery.data != null ? (
          <StateCard description={t('customer.datetime.barberUnavailable')} variant="info" />
        ) : availableSlots.length === 0 ? (
          <StateCard description={t('customer.datetime.noSlots')} variant="empty" />
        ) : (
          <View>
            {morningSlots.length > 0 ? (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontFamily: fontFamilies.mono.regular,
                    fontSize: 9,
                    color: colors.gold,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  {t('booking.datetimeMorning')}
                </Text>
                <SlotGrid
                  selectedTime={selectedTime}
                  slots={morningSlots}
                  onSelect={handleSelectTime}
                />
              </View>
            ) : null}
            {afternoonSlots.length > 0 ? (
              <View>
                <Text
                  style={{
                    fontFamily: fontFamilies.mono.regular,
                    fontSize: 9,
                    color: colors.gold,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  {t('booking.datetimeAfternoon')}
                </Text>
                <SlotGrid
                  selectedTime={selectedTime}
                  slots={afternoonSlots}
                  onSelect={handleSelectTime}
                />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 22,
          backgroundColor: colors.bg,
          paddingTop: 12,
        }}
      >
        <CTA disabled={!canReview} onPress={handleReviewBooking}>
          {continueLabel}
        </CTA>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
        presentationStyle="formSheet"
        visible={isReviewModalVisible}
      >
        <ConfirmSheet
          barberName={barberName}
          cancellationHint={cancellationHint}
          confirmDurationValue={confirmDurationValue}
          confirmServicesValue={confirmServicesValue}
          confirmWhenValue={confirmWhenValue}
          isPending={createBookingMutation.isPending}
          notes={notes}
          onClose={() => setReviewModalVisible(false)}
          onConfirm={handleConfirmBooking}
          setNotes={setNotes}
          shopCoverImageUrl={shopQuery.data?.cover_image_url ?? null}
          shopName={shopName}
          submissionError={submissionError}
          totalPrice={totals.totalPrice}
        />
      </Modal>
    </View>
  );
}

function SlotGrid({
  slots,
  selectedTime,
  onSelect,
}: {
  slots: string[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}) {
  // Render rows of 4 chips. The flex-1 inside `<TimeSlotChip>` keeps
  // each cell equal-width within its row even when the final row has
  // fewer slots — the trailing flex spacers below balance it.
  const rows = useMemo(() => {
    const out: string[][] = [];
    for (let i = 0; i < slots.length; i += 4) {
      out.push(slots.slice(i, i + 4));
    }
    return out;
  }, [slots]);

  return (
    <View style={{ gap: 8 }}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', gap: 8 }}>
          {row.map((time) => (
            <TimeSlotChip
              key={time}
              isSelected={selectedTime === time}
              onSelect={onSelect}
              time={time}
            />
          ))}
          {/* pad the last row so chips don't stretch */}
          {Array.from({ length: 4 - row.length }, (_, i) => (
            <View key={`pad-${i}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function ConfirmSheet({
  barberName,
  cancellationHint,
  confirmDurationValue,
  confirmServicesValue,
  confirmWhenValue,
  isPending,
  notes,
  onClose,
  onConfirm,
  setNotes,
  shopCoverImageUrl,
  shopName,
  submissionError,
  totalPrice,
}: {
  barberName: string;
  cancellationHint: string;
  confirmDurationValue: string;
  confirmServicesValue: string;
  confirmWhenValue: string;
  isPending: boolean;
  notes: string;
  onClose: () => void;
  onConfirm: () => void;
  setNotes: (notes: string) => void;
  shopCoverImageUrl: string | null;
  shopName: string;
  submissionError: string | null;
  totalPrice: number;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const coverSource = useMemo(
    () => (shopCoverImageUrl != null ? { uri: shopCoverImageUrl } : null),
    [shopCoverImageUrl],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Sheet handle */}
      <View style={{ alignItems: 'center', paddingTop: 10 }}>
        <View
          style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineSoft }}
        />
      </View>

      <View style={{ marginTop: 8 }}>
        <ProgressBar step={4} total={4} />
        <ModalHeader title={t('booking.confirmEyebrow')} onBack={onClose} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 130,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: 24 }}>
          <SerifTitle size={26}>{t('booking.confirmHeadlineA')}</SerifTitle>
          <SerifTitle size={26} italic color={colors.gold}>
            {t('booking.confirmHeadlineB')}
          </SerifTitle>
        </View>

        {/* Shop summary */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineSoft,
            marginTop: 28,
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden' }}>
            {coverSource != null ? (
              <Image
                source={coverSource}
                placeholder={DEFAULT_PLACEHOLDER}
                contentFit="cover"
                transition={120}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Photo tone="chair" />
            )}
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fontFamilies.serif.medium,
                fontSize: 18,
                color: colors.ivory,
              }}
            >
              {shopName}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fontFamilies.sans.regular,
                fontSize: 11,
                color: colors.muted,
                marginTop: 2,
              }}
            >
              {t('booking.confirmShopWith', { barber: barberName })}
            </Text>
          </View>
        </View>

        <View style={{ paddingTop: 8 }}>
          <BookingDetailRow
            label={t('booking.confirmDetailWhen')}
            value={confirmWhenValue}
          />
          <BookingDetailRow
            label={t('booking.confirmDetailDuration')}
            value={confirmDurationValue}
          />
          <BookingDetailRow
            label={t('booking.confirmDetailServices')}
            value={confirmServicesValue}
          />
        </View>

        {/* Notes */}
        <View
          style={{
            marginTop: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 6,
            borderCurve: 'continuous',
          }}
        >
          <Text
            style={{
              fontFamily: fontFamilies.mono.regular,
              fontSize: 9,
              color: colors.muted,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {t('booking.confirmNoteLabel')}
          </Text>
          <TextInput
            multiline
            placeholder={t('booking.confirmNotePlaceholder')}
            placeholderTextColor={colors.mutedLow}
            value={notes}
            onChangeText={setNotes}
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 13,
              color: colors.ivory,
              fontStyle: 'italic',
              lineHeight: 20,
              minHeight: 60,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Total */}
        <View
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTopWidth: 1,
            borderTopColor: colors.goldBorder,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: fontFamilies.mono.regular,
                fontSize: 9,
                color: colors.muted,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {t('booking.confirmTotalLabel')}
            </Text>
            <Text
              style={{
                fontFamily: fontFamilies.sans.regular,
                fontSize: 11,
                color: colors.muted,
                marginTop: 4,
              }}
            >
              {t('booking.confirmTotalSub')}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: fontFamilies.serif.medium,
              fontSize: 32,
              color: colors.gold,
              fontVariant: ['tabular-nums'],
            }}
          >
            {t('customer.serviceSelection.priceValue', { price: totalPrice.toFixed(0) })}
          </Text>
        </View>

        {submissionError != null ? (
          <Text
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 12,
              color: colors.terra,
              marginTop: 12,
            }}
          >
            {submissionError}
          </Text>
        ) : null}
      </ScrollView>

      {/* CTA pinned to bottom */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 22,
          backgroundColor: colors.surface,
        }}
      >
        <CTA disabled={isPending} onPress={onConfirm}>
          {isPending ? t('booking.confirmingCta') : t('booking.confirmCta')}
        </CTA>
        <Pressable onPress={onClose} hitSlop={8} style={{ marginTop: 14, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 12,
              color: colors.muted,
            }}
          >
            {cancellationHint}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
