import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';

type AppointmentCardProps = {
  appointmentId: string;
  barberName: string;
  canCancel: boolean;
  date: string;
  endTime: string;
  isCancelling: boolean;
  onCancel: (appointmentId: string) => void;
  servicesSummary: string;
  shopName: string;
  showCancelAction: boolean;
  startTime: string;
  status: 'cancelled' | 'completed' | 'confirmed' | 'pending' | 'unknown';
  statusLabel: string;
};

export const AppointmentCard = memo(function AppointmentCard({
  appointmentId,
  barberName,
  canCancel,
  date,
  endTime,
  isCancelling,
  onCancel,
  servicesSummary,
  shopName,
  showCancelAction,
  startTime,
  status,
  statusLabel,
}: AppointmentCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text fontWeight="700">{shopName}</Text>
        <View style={[styles.statusBadge, status === 'pending' && styles.pendingBadge, status === 'confirmed' && styles.confirmedBadge, status === 'completed' && styles.completedBadge, status === 'cancelled' && styles.cancelledBadge]}>
          <Text color="$inverseColor">{statusLabel}</Text>
        </View>
      </View>

      <Text color="$colorMuted">{t('customer.bookings.barberLine', { barber: barberName })}</Text>
      <Text color="$colorMuted">{date}</Text>
      <Text color="$colorMuted">{`${startTime} - ${endTime}`}</Text>
      <Text color="$colorMuted">{servicesSummary}</Text>

      {showCancelAction ? (
        <View style={styles.cancelSection}>
          <Button disabled={!canCancel || isCancelling} onPress={() => onCancel(appointmentId)}>
            <ButtonText>
              {isCancelling ? t('customer.bookings.cancellingButton') : t('customer.bookings.cancelButton')}
            </ButtonText>
          </Button>
          {!canCancel ? <Text color="$colorMuted">{t('customer.bookings.cancelBlocked')}</Text> : null}
        </View>
      ) : null}
    </Card>
  );
});

const styles = StyleSheet.create({
  cancelledBadge: {
    backgroundColor: '#ef4444',
  },
  cancelSection: {
    gap: 8,
  },
  completedBadge: {
    backgroundColor: '#334155',
  },
  confirmedBadge: {
    backgroundColor: '#16a34a',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pendingBadge: {
    backgroundColor: '#f97316',
  },
  statusBadge: {
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
