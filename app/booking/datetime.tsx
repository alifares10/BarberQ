import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText, Card, DateChip, Input, LoadingScreen, StateCard, Text, TimeSlotChip, useToast } from '@/components';
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
import { getRtlLayout } from '@/lib/rtl';
import { addDays, parseIsoDate, toIsoDate } from '@/lib/shop-owner/appointments-helpers';
import { useAuthStore } from '@/stores/auth-store';
import { useBookingStore } from '@/stores/booking-store';

type DateOption = {
  dateIso: string;
  dateLabel: string;
  dayLabel: string;
};

type SelectedServiceRow = {
  duration: number;
  id: string;
  name: string;
  price: number;
};

type TimeSlotRow = {
  isSelected: boolean;
  time: string;
};

function getErrorCode(error: unknown) {
  if (typeof error !== 'object' || error == null || !('code' in error)) {
    return null;
  }

  const { code } = error as { code?: unknown };

  return typeof code === 'string' ? code : null;
}

export default function BookingDateTimeScreen() {
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const rtlLayout = getRtlLayout(i18n.language);
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

  const hasContext =
    selectedBarberId != null && selectedShopId != null && selectedServiceIds.length > 0 && customerId != null;
  const selectedDateDayOfWeek = useMemo(
    () => (selectedDate != null ? parseIsoDate(selectedDate).getDay() : null),
    [selectedDate]
  );
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }),
    [i18n.language]
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }),
    [i18n.language]
  );
  const shopQuery = useQuery({
    enabled: selectedShopId != null,
    queryFn: () => fetchShopById(selectedShopId ?? ''),
    queryKey: selectedShopId != null ? customerQueryKeys.shopById(selectedShopId) : ['customer', 'shop', 'unknown'],
  });
  const barbersQuery = useQuery({
    enabled: selectedShopId != null,
    queryFn: () => fetchActiveBarbersByShopId(selectedShopId ?? ''),
    queryKey:
      selectedShopId != null ? customerQueryKeys.barbersByShop(selectedShopId) : ['customer', 'barbers', 'unknown'],
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
  const selectedServiceSet = useMemo(() => new Set(selectedServiceIds), [selectedServiceIds]);
  const selectedServices = useMemo(
    () =>
      services.filter((service) => selectedServiceSet.has(service.id)).map((service) => ({
        duration: service.duration,
        id: service.id,
        name: service.name,
        price: service.price,
      })) satisfies SelectedServiceRow[],
    [selectedServiceSet, services]
  );
  const totals = useMemo(
    () =>
      selectedServices.reduce(
        (accumulator, service) => ({
          totalDurationMinutes: accumulator.totalDurationMinutes + service.duration,
          totalPrice: accumulator.totalPrice + service.price,
        }),
        {
          totalDurationMinutes: 0,
          totalPrice: 0,
        }
      ),
    [selectedServices]
  );
  const dateOptions = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const value = addDays(new Date(), index);
      const dateIso = toIsoDate(value);

      return {
        dateIso,
        dateLabel: dateFormatter.format(value),
        dayLabel: weekdayFormatter.format(value),
      } satisfies DateOption;
    });
  }, [dateFormatter, weekdayFormatter]);
  const shopName = shopQuery.data?.name ?? t('customer.datetime.unknownShop');
  const barberName = useMemo(() => {
    const matchedBarber = (barbersQuery.data ?? []).find((barber) => barber.id === selectedBarberId);

    return matchedBarber?.name ?? t('customer.datetime.unknownBarber');
  }, [barbersQuery.data, selectedBarberId, t]);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const availableSlots = useMemo(() => {
    if (selectedDate == null || totals.totalDurationMinutes <= 0) {
      return [];
    }

    if (shopClosureQuery.data != null || barberUnavailableQuery.data != null) {
      return [];
    }

    const workingWindows = (workingHoursQuery.data ?? []).flatMap((workingHour) => {
      try {
        return [
          {
            endMinutes: timeToMinutes(workingHour.end_time),
            startMinutes: timeToMinutes(workingHour.start_time),
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
  const isLoadingBaseData = servicesQuery.isPending || shopQuery.isPending || barbersQuery.isPending;
  const isBaseDataError = servicesQuery.isError || shopQuery.isError || barbersQuery.isError;
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
  const timeSlotRows = useMemo(
    () =>
      availableSlots.map((time) => ({
        isSelected: selectedTime === time,
        time,
      })) satisfies TimeSlotRow[],
    [availableSlots, selectedTime]
  );
  const canReview = selectedDate != null && selectedTime != null && selectedServices.length > 0;

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
        await queryClient.invalidateQueries({ queryKey: customerQueryKeys.customerAppointments(customerId) });
      }

      setSubmissionError(null);
      showToast({ message: t('toast.bookingCreated'), type: 'success' });
      setReviewModalVisible(false);
      resetBooking();
      router.replace('/(customer)/bookings');
    },
  });

  const handleRetryBaseData = useCallback(() => {
    void shopQuery.refetch();
    void barbersQuery.refetch();
    void servicesQuery.refetch();
  }, [barbersQuery, servicesQuery, shopQuery]);
  const handleRetryAvailability = useCallback(() => {
    void shopClosureQuery.refetch();
    void barberUnavailableQuery.refetch();
    void workingHoursQuery.refetch();
    void barberBookingsQuery.refetch();
  }, [barberBookingsQuery, barberUnavailableQuery, shopClosureQuery, workingHoursQuery]);
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
    [selectedDate, setSelectedDate, setSelectedTime]
  );
  const handleSelectTime = useCallback(
    (time: string) => {
      if (selectedTime === time) {
        setSelectedTime(null);
        return;
      }

      setSelectedTime(time);
    },
    [selectedTime, setSelectedTime]
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

  const renderDateItem = useCallback<ListRenderItem<DateOption>>(
    ({ item }) => (
      <DateChip
        date={item.dateIso}
        dateLabel={item.dateLabel}
        dayLabel={item.dayLabel}
        isDisabled={false}
        isSelected={selectedDate === item.dateIso}
        onSelect={handleSelectDate}
      />
    ),
    [handleSelectDate, selectedDate]
  );
  const renderTimeSlot = useCallback<ListRenderItem<TimeSlotRow>>(
    ({ item }) => <TimeSlotChip isSelected={item.isSelected} onSelect={handleSelectTime} time={item.time} />,
    [handleSelectTime]
  );
  const renderSelectedService = useCallback<ListRenderItem<SelectedServiceRow>>(
    ({ item }) => (
      <Card>
        <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{item.name}</Text>
        <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
          {t('customer.datetime.serviceLine', {
            duration: item.duration,
            price: item.price.toFixed(2),
          })}
        </Text>
      </Card>
    ),
    [rtlLayout.textAlign, t]
  );

  if (!hasContext) {
    return (
      <View style={styles.errorContainer}>
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
      <View style={styles.errorContainer}>
        <StateCard
          actionLabel={t('customer.datetime.retryButton')}
          description={t('customer.datetime.errors.loadFailed')}
          onAction={handleRetryBaseData}
          variant="error"
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.contentContainer}>
        <Card>
          <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34} textAlign={rtlLayout.textAlign}>
            {t('customer.datetime.title')}
          </Text>
          <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.datetime.description')}</Text>
        </Card>

        <Card>
          <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('customer.datetime.dateSectionTitle')}</Text>
          <FlashList
            contentContainerStyle={styles.dateListContent}
            contentInsetAdjustmentBehavior="automatic"
            data={dateOptions}

            extraData={selectedDate}
            horizontal
            keyExtractor={(item) => item.dateIso}
            renderItem={renderDateItem}
            showsHorizontalScrollIndicator={false}
          />
        </Card>

        <View style={styles.slotsContainer}>
          <Card>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('customer.datetime.timeSectionTitle')}</Text>
          </Card>

          {selectedDate == null ? (
            <StateCard description={t('customer.datetime.selectDatePrompt')} variant="info" />
          ) : isLoadingAvailability ? (
            <StateCard description={t('customer.datetime.loadingAvailability')} variant="loading" />
          ) : hasAvailabilityError ? (
            <StateCard
              actionLabel={t('customer.datetime.retryButton')}
              description={t('customer.datetime.errors.availabilityFailed')}
              onAction={handleRetryAvailability}
              variant="error"
            />
          ) : shopClosureQuery.data != null ? (
            <StateCard description={t('customer.datetime.shopClosed')} variant="info" />
          ) : barberUnavailableQuery.data != null ? (
            <StateCard description={t('customer.datetime.barberUnavailable')} variant="info" />
          ) : (
            <FlashList
              ListEmptyComponent={
                <StateCard description={t('customer.datetime.noSlots')} variant="empty" />
              }
              contentContainerStyle={styles.slotListContent}
              contentInsetAdjustmentBehavior="automatic"
              data={timeSlotRows}

              extraData={selectedTime}
              keyExtractor={(item) => item.time}
              numColumns={4}
              renderItem={renderTimeSlot}
            />
          )}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Card>
          <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
            {t('customer.datetime.totalDuration', {
              minutes: totals.totalDurationMinutes,
            })}
          </Text>
          <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
            {t('customer.datetime.totalPrice', {
              price: totals.totalPrice.toFixed(2),
            })}
          </Text>
          {selectedTime != null ? (
            <Text color="$accent" textAlign={rtlLayout.textAlign}>{t('customer.datetime.timeLabel', { time: selectedTime })}</Text>
          ) : null}

          <Button disabled={!canReview} onPress={handleReviewBooking}>
            <ButtonText>{t('customer.datetime.reviewBookingButton')}</ButtonText>
          </Button>
        </Card>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
        presentationStyle="formSheet"
        visible={isReviewModalVisible}
      >
        <View style={styles.modalScreen}>
          <Card>
            <Text fontFamily="$heading" fontSize={26} fontWeight="800" lineHeight={32} textAlign={rtlLayout.textAlign}>
              {t('customer.datetime.reviewTitle')}
            </Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.datetime.shopLabel', { shopName })}</Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.datetime.barberLabel', { barberName })}</Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.datetime.dateLabel', { date: selectedDate ?? '-' })}</Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.datetime.timeLabel', { time: selectedTime ?? '-' })}</Text>
          </Card>

          <Card>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('customer.datetime.servicesTitle')}</Text>
            <View style={styles.summaryServicesWrapper}>
              <FlashList
                ItemSeparatorComponent={() => <View style={styles.summaryServiceSeparator} />}
                data={selectedServices}

                keyExtractor={(item) => item.id}
                renderItem={renderSelectedService}
              />
            </View>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
              {t('customer.datetime.totalDuration', {
                minutes: totals.totalDurationMinutes,
              })}
            </Text>
            <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
              {t('customer.datetime.totalPrice', {
                price: totals.totalPrice.toFixed(2),
              })}
            </Text>
          </Card>

          <Card>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('customer.datetime.notesLabel')}</Text>
            <Input
              multiline
              numberOfLines={4}
              onChangeText={setNotes}
              placeholder={t('customer.datetime.notesPlaceholder')}
              value={notes}
            />

            {submissionError != null ? <Text color="$error" textAlign={rtlLayout.textAlign}>{submissionError}</Text> : null}

            <View style={[styles.modalActionRow, { flexDirection: rtlLayout.rowDirection }]}>
              <Button onPress={() => setReviewModalVisible(false)}>
                <ButtonText>{t('customer.datetime.closeButton')}</ButtonText>
              </Button>
              <Button onPress={handleConfirmBooking}>
                <ButtonText>
                  {createBookingMutation.isPending
                    ? t('customer.datetime.confirmingButton')
                    : t('customer.datetime.confirmButton')}
                </ButtonText>
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
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
  contentContainer: {
    flex: 1,
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  dateListContent: {
    gap: 8,
    paddingVertical: 6,
  },
  errorContainer: {
    flex: 1,
    padding: 16,
  },
  modalActionRow: {
    flexWrap: 'wrap',
    gap: 10,
  },
  modalScreen: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  screen: {
    flex: 1,
  },
  slotListContent: {
    gap: 8,
    paddingBottom: 16,
  },
  slotsContainer: {
    flex: 1,
    gap: 10,
  },
  summaryServiceSeparator: {
    height: 8,
  },
  summaryServicesWrapper: {
    maxHeight: 220,
  },
});
