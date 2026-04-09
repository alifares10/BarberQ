import { FlashList } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { Input } from '@/components/Input/Input';
import { Text } from '@/components/Text/Text';
import {
  createBarberUnavailableDate,
  createWorkingHour,
  deleteBarberUnavailableDate,
  deleteWorkingHour,
  fetchBarberUnavailableDatesByShopId,
  fetchWorkingHoursByShopId,
  updateBarberUnavailableDate,
  updateWorkingHour,
} from '@/lib/shop-owner/api';
import { shopOwnerQueryKeys } from '@/lib/shop-owner/query-keys';
import type { Database } from '@/types/database';

type Barber = Database['public']['Tables']['barbers']['Row'];
type WorkingHour = Database['public']['Tables']['working_hours']['Row'];
type BarberUnavailableDate = Database['public']['Tables']['barber_unavailable_dates']['Row'];

type BarberAvailabilityModalProps = {
  barber: Barber | null;
  onClose: () => void;
  shopId: string | null;
  visible: boolean;
};

const DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;
const DEFAULT_WORKING_DAY = 1;
const DEFAULT_WORKING_START = '09:00';
const DEFAULT_WORKING_END = '17:00';

function isUniqueViolation(error: unknown) {
  if (typeof error !== 'object' || error == null || !('code' in error)) {
    return false;
  }

  return (error as { code?: string }).code === '23505';
}

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTimeInput(value: string) {
  const trimmedValue = value.trim();
  const withMinutesPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const withSecondsPattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

  const withMinutesMatch = trimmedValue.match(withMinutesPattern);

  if (withMinutesMatch != null) {
    return `${withMinutesMatch[1]}:${withMinutesMatch[2]}`;
  }

  const withSecondsMatch = trimmedValue.match(withSecondsPattern);

  if (withSecondsMatch == null) {
    return null;
  }

  return `${withSecondsMatch[1]}:${withSecondsMatch[2]}`;
}

function toMinutes(timeValue: string) {
  const [hoursPart, minutesPart] = timeValue.split(':');
  const hours = Number.parseInt(hoursPart ?? '0', 10);
  const minutes = Number.parseInt(minutesPart ?? '0', 10);

  return hours * 60 + minutes;
}

export function BarberAvailabilityModal({ barber, onClose, shopId, visible }: BarberAvailabilityModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [workingHourId, setWorkingHourId] = useState<string | null>(null);
  const [workingDay, setWorkingDay] = useState<number>(DEFAULT_WORKING_DAY);
  const [workingStart, setWorkingStart] = useState(DEFAULT_WORKING_START);
  const [workingEnd, setWorkingEnd] = useState(DEFAULT_WORKING_END);
  const [workingIsAvailable, setWorkingIsAvailable] = useState(true);
  const [workingError, setWorkingError] = useState<string | null>(null);
  const [unavailableDateId, setUnavailableDateId] = useState<string | null>(null);
  const [unavailableDate, setUnavailableDate] = useState('');
  const [unavailableReason, setUnavailableReason] = useState('');
  const [unavailableError, setUnavailableError] = useState<string | null>(null);
  const isEnabled = visible && barber != null && shopId != null;
  const workingHoursQuery = useQuery({
    enabled: isEnabled,
    queryFn: () => fetchWorkingHoursByShopId(shopId ?? ''),
    queryKey: shopId != null ? shopOwnerQueryKeys.workingHoursByShop(shopId) : ['shop-owner', 'working-hours', 'unknown'],
  });
  const unavailableDatesQuery = useQuery({
    enabled: isEnabled,
    queryFn: () => fetchBarberUnavailableDatesByShopId(shopId ?? ''),
    queryKey:
      shopId != null
        ? shopOwnerQueryKeys.barberUnavailableDatesByShop(shopId)
        : ['shop-owner', 'barber-unavailable-dates', 'unknown'],
  });
  const saveWorkingHourMutation = useMutation({
    mutationFn: async () => {
      if (barber == null || shopId == null) {
        throw new Error(t('shopOwner.availability.errors.missingBarber'));
      }

      const normalizedStart = normalizeTimeInput(workingStart);
      const normalizedEnd = normalizeTimeInput(workingEnd);

      if (normalizedStart == null || normalizedEnd == null) {
        throw new Error(t('shopOwner.availability.errors.invalidTime'));
      }

      if (toMinutes(normalizedStart) >= toMinutes(normalizedEnd)) {
        throw new Error(t('shopOwner.availability.errors.invalidTimeRange'));
      }

      const matchingWindow = barberWorkingHours.find(
        (item) =>
          item.day_of_week === workingDay &&
          normalizeTimeInput(item.start_time) === normalizedStart &&
          normalizeTimeInput(item.end_time) === normalizedEnd
      );
      const dayWindows = barberWorkingHours.filter((item) => item.day_of_week === workingDay);
      const fallbackDayWindow = dayWindows.length === 1 ? dayWindows[0] : null;
      const targetWorkingHourId = workingHourId ?? matchingWindow?.id ?? fallbackDayWindow?.id ?? null;

      if (targetWorkingHourId == null) {
        return createWorkingHour({
          barber_id: barber.id,
          day_of_week: workingDay,
          end_time: normalizedEnd,
          is_available: workingIsAvailable,
          start_time: normalizedStart,
        });
      }

      return updateWorkingHour(targetWorkingHourId, {
        day_of_week: workingDay,
        end_time: normalizedEnd,
        is_available: workingIsAvailable,
        start_time: normalizedStart,
      });
    },
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.workingHoursByShop(shopId) });
      }

      setWorkingHourId(null);
      setWorkingDay(DEFAULT_WORKING_DAY);
      setWorkingStart(DEFAULT_WORKING_START);
      setWorkingEnd(DEFAULT_WORKING_END);
      setWorkingIsAvailable(true);
      setWorkingError(null);
    },
  });
  const deleteWorkingHourMutation = useMutation({
    mutationFn: (id: string) => deleteWorkingHour(id),
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.workingHoursByShop(shopId) });
      }
    },
  });
  const toggleWorkingHourMutation = useMutation({
    mutationFn: ({ id, nextValue }: { id: string; nextValue: boolean }) =>
      updateWorkingHour(id, { is_available: nextValue }),
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.workingHoursByShop(shopId) });
      }
    },
  });
  const saveUnavailableDateMutation = useMutation({
    mutationFn: async () => {
      if (barber == null || shopId == null) {
        throw new Error(t('shopOwner.availability.errors.missingBarber'));
      }

      if (!isValidDateInput(unavailableDate)) {
        throw new Error(t('shopOwner.availability.errors.invalidDate'));
      }

      const reason = unavailableReason.trim();

      if (unavailableDateId == null) {
        return createBarberUnavailableDate({
          barber_id: barber.id,
          date: unavailableDate,
          reason: reason.length === 0 ? null : reason,
        });
      }

      return updateBarberUnavailableDate(unavailableDateId, {
        date: unavailableDate,
        reason: reason.length === 0 ? null : reason,
      });
    },
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.barberUnavailableDatesByShop(shopId) });
      }

      setUnavailableDateId(null);
      setUnavailableDate('');
      setUnavailableReason('');
      setUnavailableError(null);
    },
  });
  const deleteUnavailableDateMutation = useMutation({
    mutationFn: (id: string) => deleteBarberUnavailableDate(id),
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.barberUnavailableDatesByShop(shopId) });
      }
    },
  });

  const barberWorkingHours = useMemo(
    () => (workingHoursQuery.data ?? []).filter((item) => item.barber_id === barber?.id),
    [barber?.id, workingHoursQuery.data]
  );
  const barberUnavailableDates = useMemo(
    () => (unavailableDatesQuery.data ?? []).filter((item) => item.barber_id === barber?.id),
    [barber?.id, unavailableDatesQuery.data]
  );
  const isLoadingAvailabilityData =
    isEnabled && (workingHoursQuery.isPending || unavailableDatesQuery.isPending);
  const hasAvailabilityLoadError =
    isEnabled && (workingHoursQuery.isError || unavailableDatesQuery.isError);

  const handleRetryLoad = useCallback(async () => {
    await Promise.all([workingHoursQuery.refetch(), unavailableDatesQuery.refetch()]);
  }, [unavailableDatesQuery, workingHoursQuery]);

  const syncWorkingDraftForDay = useCallback(
    (day: number) => {
      const dayWindows = barberWorkingHours.filter((item) => item.day_of_week === day);

      setWorkingDay(day);

      if (dayWindows.length === 1) {
        const dayWindow = dayWindows[0];

        setWorkingHourId(dayWindow.id);
        setWorkingStart(normalizeTimeInput(dayWindow.start_time) ?? dayWindow.start_time);
        setWorkingEnd(normalizeTimeInput(dayWindow.end_time) ?? dayWindow.end_time);
        setWorkingIsAvailable(dayWindow.is_available);
        setWorkingError(null);
        return;
      }

      setWorkingHourId(null);
      setWorkingStart(DEFAULT_WORKING_START);
      setWorkingEnd(DEFAULT_WORKING_END);
      setWorkingIsAvailable(true);

      if (dayWindows.length > 1) {
        setWorkingError(t('shopOwner.availability.errors.multipleWindowsSelectEdit'));
        return;
      }

      setWorkingError(null);
    },
    [barberWorkingHours, t]
  );

  useEffect(() => {
    if (!visible || workingHourId != null) {
      return;
    }

    syncWorkingDraftForDay(workingDay);
  }, [syncWorkingDraftForDay, visible, workingDay, workingHourId]);

  const handleClose = () => {
    setWorkingHourId(null);
    setWorkingDay(DEFAULT_WORKING_DAY);
    setWorkingStart(DEFAULT_WORKING_START);
    setWorkingEnd(DEFAULT_WORKING_END);
    setWorkingIsAvailable(true);
    setWorkingError(null);
    setUnavailableDateId(null);
    setUnavailableDate('');
    setUnavailableReason('');
    setUnavailableError(null);
    onClose();
  };

  const handleEditWorkingHour = useCallback((item: WorkingHour) => {
    setWorkingError(null);
    setWorkingHourId(item.id);
    setWorkingDay(item.day_of_week);
    setWorkingStart(normalizeTimeInput(item.start_time) ?? item.start_time);
    setWorkingEnd(normalizeTimeInput(item.end_time) ?? item.end_time);
    setWorkingIsAvailable(item.is_available);
  }, []);

  const handleSaveWorkingHour = async () => {
    try {
      await saveWorkingHourMutation.mutateAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('shopOwner.availability.errors.generic');
      setWorkingError(message);
    }
  };

  const handleDeleteWorkingHour = useCallback((id: string) => {
    void deleteWorkingHourMutation.mutateAsync(id);
  }, [deleteWorkingHourMutation]);

  const handleToggleWorkingHour = useCallback((item: WorkingHour) => {
    void toggleWorkingHourMutation.mutateAsync({ id: item.id, nextValue: !item.is_available });
  }, [toggleWorkingHourMutation]);

  const handleEditUnavailableDate = useCallback((item: BarberUnavailableDate) => {
    setUnavailableError(null);
    setUnavailableDateId(item.id);
    setUnavailableDate(item.date);
    setUnavailableReason(item.reason ?? '');
  }, []);

  const handleSaveUnavailableDate = async () => {
    try {
      await saveUnavailableDateMutation.mutateAsync();
    } catch (error) {
      if (isUniqueViolation(error)) {
        setUnavailableError(t('shopOwner.availability.errors.duplicateUnavailableDate'));
        return;
      }

      const message = error instanceof Error ? error.message : t('shopOwner.availability.errors.generic');
      setUnavailableError(message);
    }
  };

  const handleDeleteUnavailableDate = useCallback((id: string) => {
    void deleteUnavailableDateMutation.mutateAsync(id);
  }, [deleteUnavailableDateMutation]);

  const renderWorkingHour = useCallback(
    ({ item }: { item: WorkingHour }) => (
      <Card>
        <Text fontWeight="700">
          {t('shopOwner.availability.dayLabel', {
            day: t(`shopOwner.availability.days.${item.day_of_week}`),
          })}
        </Text>
        <Text color="$colorMuted">
          {t('shopOwner.availability.timeRangeLabel', {
            end: normalizeTimeInput(item.end_time) ?? item.end_time,
            start: normalizeTimeInput(item.start_time) ?? item.start_time,
          })}
        </Text>
        <Text color="$colorMuted">
          {item.is_available
            ? t('shopOwner.availability.statusAvailable')
            : t('shopOwner.availability.statusUnavailable')}
        </Text>

        <View style={styles.actionRow}>
          <Button onPress={() => handleEditWorkingHour(item)}>
            <ButtonText>{t('shopOwner.availability.actions.edit')}</ButtonText>
          </Button>
          <Button onPress={() => handleToggleWorkingHour(item)}>
            <ButtonText>
              {item.is_available
                ? t('shopOwner.availability.actions.markUnavailable')
                : t('shopOwner.availability.actions.markAvailable')}
            </ButtonText>
          </Button>
          <Button onPress={() => handleDeleteWorkingHour(item.id)}>
            <ButtonText>{t('shopOwner.availability.actions.delete')}</ButtonText>
          </Button>
        </View>
      </Card>
    ),
    [handleDeleteWorkingHour, handleEditWorkingHour, handleToggleWorkingHour, t]
  );

  const renderUnavailableDate = useCallback(
    ({ item }: { item: BarberUnavailableDate }) => (
      <Card>
        <Text fontWeight="700">{item.date}</Text>
        <Text color="$colorMuted">
          {item.reason == null || item.reason.length === 0
            ? t('shopOwner.availability.noReason')
            : item.reason}
        </Text>

        <View style={styles.actionRow}>
          <Button onPress={() => handleEditUnavailableDate(item)}>
            <ButtonText>{t('shopOwner.availability.actions.edit')}</ButtonText>
          </Button>
          <Button onPress={() => handleDeleteUnavailableDate(item.id)}>
            <ButtonText>{t('shopOwner.availability.actions.delete')}</ButtonText>
          </Button>
        </View>
      </Card>
    ),
    [handleDeleteUnavailableDate, handleEditUnavailableDate, t]
  );

  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible={visible} onRequestClose={handleClose}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.modalContentContainer}>
        <View style={styles.modalRoot}>
          {barber == null ? (
            <Card>
              <Text>{t('shopOwner.availability.errors.missingBarber')}</Text>
              <Button onPress={handleClose}>
                <ButtonText>{t('shopOwner.availability.actions.close')}</ButtonText>
              </Button>
            </Card>
          ) : isLoadingAvailabilityData ? (
            <>
              <Card>
                <Text fontFamily="$heading" fontSize={24} fontWeight="800">
                  {t('shopOwner.availability.title')}
                </Text>
                <Text color="$colorMuted">{t('shopOwner.availability.subtitle', { name: barber.name })}</Text>
              </Card>

              <Card>
                <Text color="$colorMuted">{t('shopOwner.availability.loadingData')}</Text>
              </Card>

              <Button onPress={handleClose}>
                <ButtonText>{t('shopOwner.availability.actions.close')}</ButtonText>
              </Button>
            </>
          ) : hasAvailabilityLoadError ? (
            <>
              <Card>
                <Text fontFamily="$heading" fontSize={24} fontWeight="800">
                  {t('shopOwner.availability.title')}
                </Text>
                <Text color="$colorMuted">{t('shopOwner.availability.subtitle', { name: barber.name })}</Text>
              </Card>

              <Card>
                <Text color="$error">{t('shopOwner.availability.loadError')}</Text>
                <Button onPress={() => void handleRetryLoad()}>
                  <ButtonText>{t('shopOwner.availability.retryButton')}</ButtonText>
                </Button>
              </Card>

              <Button onPress={handleClose}>
                <ButtonText>{t('shopOwner.availability.actions.close')}</ButtonText>
              </Button>
            </>
          ) : (
            <>
              <Card>
                <Text fontFamily="$heading" fontSize={24} fontWeight="800">
                  {t('shopOwner.availability.title')}
                </Text>
                <Text color="$colorMuted">{t('shopOwner.availability.subtitle', { name: barber.name })}</Text>
              </Card>

              <Card>
                <Text fontWeight="700">{t('shopOwner.availability.workingHoursTitle')}</Text>
                <View style={styles.dayRow}>
                  {DAY_OPTIONS.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => syncWorkingDraftForDay(day)}
                      style={[styles.dayPill, workingDay === day ? styles.dayPillSelected : null]}
                    >
                      <Text color={workingDay === day ? '$inverseColor' : '$colorMuted'}>
                        {t(`shopOwner.availability.days.${day}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.fieldGroup}>
                  <Text fontWeight="700">{t('shopOwner.availability.startTimeLabel')}</Text>
                  <Input
                    autoCapitalize="none"
                    onChangeText={setWorkingStart}
                    placeholder={t('shopOwner.availability.timePlaceholder')}
                    value={workingStart}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text fontWeight="700">{t('shopOwner.availability.endTimeLabel')}</Text>
                  <Input
                    autoCapitalize="none"
                    onChangeText={setWorkingEnd}
                    placeholder={t('shopOwner.availability.timePlaceholder')}
                    value={workingEnd}
                  />
                </View>

                <Button onPress={() => setWorkingIsAvailable((currentValue) => !currentValue)}>
                  <ButtonText>
                    {workingIsAvailable
                      ? t('shopOwner.availability.actions.setWindowUnavailable')
                      : t('shopOwner.availability.actions.setWindowAvailable')}
                  </ButtonText>
                </Button>

                {workingError != null ? <Text color="$error">{workingError}</Text> : null}

                <View style={styles.actionRow}>
                  <Button onPress={() => void handleSaveWorkingHour()}>
                    <ButtonText>
                      {saveWorkingHourMutation.isPending
                        ? t('shopOwner.availability.savingButton')
                        : t('shopOwner.availability.actions.saveWindow')}
                    </ButtonText>
                  </Button>
                  <Button
                    onPress={() => {
                      setWorkingHourId(null);
                      setWorkingStart(DEFAULT_WORKING_START);
                      setWorkingEnd(DEFAULT_WORKING_END);
                      setWorkingIsAvailable(true);
                      setWorkingError(null);
                    }}
                  >
                    <ButtonText>{t('shopOwner.availability.actions.clearWindowForm')}</ButtonText>
                  </Button>
                </View>

                <FlashList
                  ListEmptyComponent={
                    <Card>
                      <Text color="$colorMuted">{t('shopOwner.availability.emptyWorkingHours')}</Text>
                    </Card>
                  }
                  contentContainerStyle={styles.listContent}
                  data={barberWorkingHours}
                  estimatedItemSize={136}
                  keyExtractor={(item) => item.id}
                  nestedScrollEnabled
                  renderItem={renderWorkingHour}
                  style={styles.listViewport}
                />
              </Card>

              <Card>
                <Text fontWeight="700">{t('shopOwner.availability.unavailableDatesTitle')}</Text>

                <View style={styles.fieldGroup}>
                  <Text fontWeight="700">{t('shopOwner.availability.dateLabel')}</Text>
                  <Input
                    autoCapitalize="none"
                    onChangeText={setUnavailableDate}
                    placeholder={t('shopOwner.availability.datePlaceholder')}
                    value={unavailableDate}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text fontWeight="700">{t('shopOwner.availability.reasonLabel')}</Text>
                  <Input
                    autoCapitalize="sentences"
                    onChangeText={setUnavailableReason}
                    placeholder={t('shopOwner.availability.reasonPlaceholder')}
                    value={unavailableReason}
                  />
                </View>

                {unavailableError != null ? <Text color="$error">{unavailableError}</Text> : null}

                <View style={styles.actionRow}>
                  <Button onPress={() => void handleSaveUnavailableDate()}>
                    <ButtonText>
                      {saveUnavailableDateMutation.isPending
                        ? t('shopOwner.availability.savingButton')
                        : t('shopOwner.availability.actions.saveUnavailableDate')}
                    </ButtonText>
                  </Button>
                  <Button
                    onPress={() => {
                      setUnavailableDateId(null);
                      setUnavailableDate('');
                      setUnavailableReason('');
                      setUnavailableError(null);
                    }}
                  >
                    <ButtonText>{t('shopOwner.availability.actions.clearUnavailableForm')}</ButtonText>
                  </Button>
                </View>

                <FlashList
                  ListEmptyComponent={
                    <Card>
                      <Text color="$colorMuted">{t('shopOwner.availability.emptyUnavailableDates')}</Text>
                    </Card>
                  }
                  contentContainerStyle={styles.listContent}
                  data={barberUnavailableDates}
                  estimatedItemSize={120}
                  keyExtractor={(item) => item.id}
                  nestedScrollEnabled
                  renderItem={renderUnavailableDate}
                  style={styles.listViewport}
                />
              </Card>

              <Button onPress={handleClose}>
                <ButtonText>{t('shopOwner.availability.actions.close')}</ButtonText>
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayPillSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldGroup: {
    gap: 8,
  },
  listContent: {
    gap: 8,
    paddingBottom: 12,
  },
  listViewport: {
    maxHeight: 240,
  },
  modalRoot: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  modalContentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
